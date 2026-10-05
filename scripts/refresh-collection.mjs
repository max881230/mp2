import axios from 'axios'
import { mkdir, writeFile } from 'node:fs/promises'

const fields =
  'id,title,artist_title,artist_display,date_display,date_start,medium_display,dimensions,credit_line,place_of_origin,style_titles,classification_title,artwork_type_title,image_id,thumbnail,is_public_domain,gallery_title,department_title,description'
const artworks = []
const ids = new Set()
const images = new Set()
let iiifUrl = ''
let totalPages = 1

for (let page = 1; page <= totalPages && artworks.length < 100; page++) {
  const { data } = await axios.get(
    'https://api.artic.edu/api/v1/artworks/search',
    {
      timeout: 20000,
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
          limit: 100,
          page,
          fields,
        }),
      },
    },
  )
  totalPages = Math.min(data.pagination.total_pages, 100)
  iiifUrl = data.config.iiif_url
  for (const artwork of data.data) {
    if (artworks.length === 100) break
    if (
      artwork.artwork_type_title !== 'Painting' ||
      !artwork.is_public_domain ||
      !artwork.image_id ||
      ids.has(artwork.id) ||
      images.has(artwork.image_id)
    )
      continue
    ids.add(artwork.id)
    images.add(artwork.image_id)
    artworks.push(artwork)
  }
  if (page < totalPages && artworks.length < 100)
    await new Promise((resolve) => setTimeout(resolve, 1100))
}
if (!artworks.length)
  throw new Error('No paintings returned; the existing snapshot was preserved.')
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true })
await writeFile(
  new URL('../public/data/paintings.json', import.meta.url),
  JSON.stringify(
    { artworks, iiifUrl, fetchedAt: new Date().toISOString() },
    null,
    2,
  ) + '\n',
)
console.log(
  `Saved ${artworks.length} distinct public-domain paintings with distinct images.`,
)
