import { Link } from 'react-router-dom'
import type { Artwork, Collection } from '../types'
import { artworkHref } from '../lib/browse'
import { ArtworkImage } from './ArtworkImage'
import { Icon } from './Icon'

export function Hero({ collection }: { collection: Collection }) {
  const featured = [27992, 28560, 16568]
    .map(
      (id, index) =>
        collection.artworks.find((artwork) => artwork.id === id) ??
        collection.artworks[index],
    )
    .filter((artwork): artwork is Artwork => Boolean(artwork))
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="orange-line" />
          THE OPEN COLLECTION
        </div>
        <h1 id="hero-title">
          A closer look.
          <br />
          <em>
            A different
            <br className="hero-break" /> perspective.
          </em>
        </h1>
        <p>
          Step inside a world of color, light, and possibility.
          <br className="desktop-break" /> Discover paintings from the Art
          Institute of Chicago,
          <br className="desktop-break" /> one masterpiece at a time.
        </p>
        <button
          className="primary-button"
          onClick={() =>
            document
              .getElementById('collection')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Explore the collection
          <Icon name="arrow" />
        </button>
        <div className="hero-note">
          <span className="status-dot" />
          {collection.artworks.length} paintings. A thousand ways to see.
        </div>
      </div>
      <div className="hero-art">
        <div className="hero-art-label">A LITTLE INSPIRATION TO BEGIN</div>
        <div className="hero-composition">
          {featured.map((artwork, index) => (
            <Link
              key={artwork.id}
              className={`hero-painting hero-painting-${index + 1}`}
              to={artworkHref(artwork.id, '', 'gallery')}
              aria-label={`Explore ${artwork.title}`}
            >
              <ArtworkImage
                artwork={artwork}
                iiifUrl={collection.iiifUrl}
                size={600}
                eager
              />
              <span className="hero-image-caption">
                {artwork.artist_title}
                <Icon name="arrow" />
              </span>
            </Link>
          ))}
          <span className="hero-stamp" aria-hidden="true">
            ART
            <br />
            FOR ALL<span>↗</span>
          </span>
        </div>
        <div className="hero-caption">
          <span>FROM CHICAGO, WITH CURIOSITY.</span>
          <span>EST. 1879 ↗</span>
        </div>
      </div>
    </section>
  )
}
