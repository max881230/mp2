export interface Artwork {
  id: number
  title: string
  artist_title: string | null
  artist_display: string | null
  date_display: string | null
  date_start: number | null
  medium_display: string | null
  dimensions: string | null
  credit_line: string | null
  place_of_origin: string | null
  style_titles: string[]
  classification_title: string | null
  artwork_type_title: string
  image_id: string | null
  thumbnail: { alt_text: string | null; width: number; height: number } | null
  is_public_domain: boolean
  gallery_title: string | null
  department_title: string | null
  description: string | null
}

export interface Collection {
  artworks: Artwork[]
  iiifUrl: string
  fetchedAt: string
}

export type SortProperty = 'featured' | 'title' | 'artist' | 'year'
export type SortOrder = 'asc' | 'desc'
export interface BrowseOptions {
  query: string
  styles: string[]
  sort: SortProperty
  order: SortOrder
}
