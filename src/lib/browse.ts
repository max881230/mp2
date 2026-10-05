import type { Artwork, BrowseOptions, SortProperty } from '../types'

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
export function readOptions(params: URLSearchParams): BrowseOptions {
  const sort = params.get('sort')
  return {
    query: params.get('q') ?? '',
    styles: params.getAll('style'),
    sort: ['title', 'artist', 'year'].includes(sort ?? '')
      ? (sort as SortProperty)
      : 'featured',
    order: params.get('order') === 'desc' ? 'desc' : 'asc',
  }
}

export function selectArtworks(
  artworks: Artwork[],
  options: BrowseOptions,
): Artwork[] {
  const tokens = options.query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  const filtered = artworks.filter((artwork) => {
    const text = [
      artwork.title,
      artwork.artist_title,
      artwork.date_display,
      artwork.place_of_origin,
      artwork.medium_display,
      ...artwork.style_titles,
    ]
      .join(' ')
      .toLocaleLowerCase()
    return (
      tokens.every((token) => text.includes(token)) &&
      (options.styles.length === 0 ||
        options.styles.some((style) => artwork.style_titles.includes(style)))
    )
  })
  if (options.sort === 'featured')
    return options.order === 'asc' ? filtered : filtered.reverse()
  return filtered.sort((a, b) => {
    let difference: number
    if (options.sort === 'year') {
      if (a.date_start == null && b.date_start != null) return 1
      if (b.date_start == null && a.date_start != null) return -1
      difference = (a.date_start ?? 0) - (b.date_start ?? 0)
    } else {
      difference = collator.compare(
        options.sort === 'title' ? a.title : (a.artist_title ?? ''),
        options.sort === 'title' ? b.title : (b.artist_title ?? ''),
      )
    }
    return (difference || a.id - b.id) * (options.order === 'asc' ? 1 : -1)
  })
}

export function collectionSearch(search: string): string {
  const params = new URLSearchParams(search)
  params.delete('from')
  const result = params.toString()
  return result ? `?${result}` : ''
}

export function artworkHref(
  id: number,
  search: string,
  view: 'gallery' | 'list',
): string {
  const params = new URLSearchParams(search)
  params.set('from', view)
  return `/artwork/${id}?${params.toString()}`
}

export function movementOptions(
  artworks: Artwork[],
): { name: string; count: number }[] {
  const names = [
    'Impressionism',
    'Post-Impressionism',
    'Realism',
    'Modernism',
    'Renaissance',
    'Baroque',
    'Pointillism',
    'Cubism',
    'Neoclassicism',
    'Naturalism',
    'Mannerism',
    'Ashcan School',
    'Pre-Raphaelite',
  ]
  return names
    .map((name) => ({
      name,
      count: artworks.filter((artwork) => artwork.style_titles.includes(name))
        .length,
    }))
    .filter(({ count }) => count > 0)
}
