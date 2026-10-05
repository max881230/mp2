import axios from 'axios'
import type { Artwork, Collection } from '../types'

export const TARGET_COUNT = 100
const CACHE_KEY = 'frame-paintings-v1'
const CACHE_LIFETIME = 24 * 60 * 60 * 1000
const fields =
  'id,title,artist_title,artist_display,date_display,date_start,medium_display,dimensions,credit_line,place_of_origin,style_titles,classification_title,artwork_type_title,image_id,thumbnail,is_public_domain,gallery_title,department_title,description'

interface ApiResponse {
  data: Artwork[]
  config: { iiif_url: string }
  pagination: { total_pages: number }
}

export interface CollectionResult {
  collection: Collection
  source: 'live' | 'cache' | 'snapshot'
  notice: string | null
}

export function uniquePaintings(artworks: Artwork[]): Artwork[] {
  const ids = new Set<number>()
  const images = new Set<string>()
  return artworks
    .filter((artwork) => {
      if (
        artwork.artwork_type_title !== 'Painting' ||
        !artwork.is_public_domain ||
        !artwork.image_id ||
        ids.has(artwork.id) ||
        images.has(artwork.image_id)
      )
        return false
      ids.add(artwork.id)
      images.add(artwork.image_id)
      return true
    })
    .slice(0, TARGET_COUNT)
}

function validCollection(value: unknown): value is Collection {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Collection
  return (
    Array.isArray(candidate.artworks) &&
    candidate.artworks.length > 0 &&
    candidate.artworks.length <= TARGET_COUNT &&
    candidate.artworks.every(
      (artwork) =>
        typeof artwork.id === 'number' &&
        typeof artwork.title === 'string' &&
        Array.isArray(artwork.style_titles),
    ) &&
    uniquePaintings(candidate.artworks).length === candidate.artworks.length &&
    typeof candidate.iiifUrl === 'string' &&
    candidate.iiifUrl.startsWith('https://') &&
    Number.isFinite(Date.parse(candidate.fetchedAt))
  )
}

function readCache(): Collection | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    return validCollection(value) ? value : null
  } catch {
    return null
  }
}

async function requestCollection(force: boolean): Promise<CollectionResult> {
  const cached = readCache()
  if (
    !force &&
    cached &&
    Date.now() - Date.parse(cached.fetchedAt) < CACHE_LIFETIME
  ) {
    return { collection: cached, source: 'cache', notice: null }
  }
  let paintings: Artwork[] = []
  let iiifUrl = ''
  try {
    let totalPages = 1
    for (
      let page = 1;
      page <= totalPages && paintings.length < TARGET_COUNT;
      page++
    ) {
      // The API accepts the complete query as JSON in its documented `params` parameter.
      const response = await axios.get<ApiResponse>(
        'https://api.artic.edu/api/v1/artworks/search',
        {
          timeout: 12000,
          params: {
            params: JSON.stringify({
              query: {
                bool: {
                  filter: [
                    { term: { 'artwork_type_title.keyword': 'Painting' } },
                    { term: { is_public_domain: true } },
                    { exists: { field: 'image_id' } },
                  ],
                },
              },
              fields,
              limit: TARGET_COUNT,
              page,
            }),
          },
        },
      )
      iiifUrl = response.data.config.iiif_url
      totalPages = Math.min(response.data.pagination.total_pages, 100)
      paintings = uniquePaintings([...paintings, ...response.data.data])
      if (page < totalPages && paintings.length < TARGET_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, 1100))
      }
    }
    const collection = {
      artworks: paintings,
      iiifUrl,
      fetchedAt: new Date().toISOString(),
    }
    if (!validCollection(collection))
      throw new Error('No usable paintings were returned.')
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(collection))
    } catch {
      /* Storage failure must not prevent browsing. */
    }
    return {
      collection,
      source: 'live',
      notice:
        paintings.length < TARGET_COUNT
          ? `The museum currently returned ${paintings.length} available paintings.`
          : null,
    }
  } catch {
    const partial = {
      artworks: paintings,
      iiifUrl,
      fetchedAt: new Date().toISOString(),
    }
    if (validCollection(partial))
      return {
        collection: partial,
        source: 'live',
        notice: `The connection was interrupted. Showing ${paintings.length} paintings received so far.`,
      }
    if (cached)
      return {
        collection: cached,
        source: 'cache',
        notice:
          'The museum API is temporarily unavailable. You are viewing a previously saved collection.',
      }
    const response = await axios.get<Collection>(
      `${import.meta.env.BASE_URL}data/paintings.json`,
      { timeout: 8000 },
    )
    if (!validCollection(response.data))
      throw new Error('The saved collection could not be loaded.')
    return {
      collection: response.data,
      source: 'snapshot',
      notice:
        'The museum API is temporarily unavailable. You are viewing our saved museum collection; images still require a connection.',
    }
  }
}

let pending: Promise<CollectionResult> | null = null
export function loadCollection(force = false): Promise<CollectionResult> {
  // Share the in-flight request, including React StrictMode's development remount.
  if (!pending)
    pending = requestCollection(force).finally(() => {
      pending = null
    })
  return pending
}
