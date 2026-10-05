import { useState } from 'react'
import type { Artwork } from '../types'
import { Icon } from './Icon'

export function ArtworkImage({
  artwork,
  iiifUrl,
  size = 400,
  eager = false,
}: {
  artwork: Artwork
  iiifUrl: string
  size?: 200 | 400 | 600 | 843
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (failed || !artwork.image_id)
    return (
      <div className="image-unavailable">
        <Icon name="art" />
        <span>Image unavailable</span>
        <span className="sr-only">for {artwork.title}</span>
      </div>
    )
  return (
    <img
      src={`${iiifUrl}/${artwork.image_id}/full/${size},/0/default.jpg`}
      alt={
        artwork.thumbnail?.alt_text ||
        `${artwork.title}, by ${artwork.artist_title || 'an unknown artist'}`
      }
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
