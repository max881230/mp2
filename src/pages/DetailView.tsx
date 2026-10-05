import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Collection } from '../types'
import {
  artworkHref,
  collectionSearch,
  movementOptions,
  readOptions,
  selectArtworks,
} from '../lib/browse'
import { ArtworkImage } from '../components/ArtworkImage'
import { Icon } from '../components/Icon'

function descriptionParagraphs(html: string): string[] {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document
    .querySelectorAll('script, style')
    .forEach((element) => element.remove())
  const paragraphs = [...document.querySelectorAll('p')]
    .map((paragraph) => paragraph.textContent?.trim() ?? '')
    .filter(Boolean)
  return paragraphs.length
    ? paragraphs
    : [document.body.textContent?.trim() ?? ''].filter(Boolean)
}

export function DetailView({ collection }: { collection: Collection }) {
  const { id } = useParams()
  const [params] = useSearchParams()
  const options = useMemo(() => readOptions(params), [params])
  const filtered = useMemo(
    () => selectArtworks(collection.artworks, options),
    [collection.artworks, options],
  )
  const artwork = collection.artworks.find((item) => String(item.id) === id)
  const view = params.get('from') === 'list' ? 'list' : 'gallery'
  const search = collectionSearch(`?${params.toString()}`)
  const sequence = filtered.some((item) => item.id === artwork?.id)
    ? filtered
    : collection.artworks
  const index = sequence.findIndex((item) => item.id === artwork?.id)
  if (!artwork)
    return (
      <div className="empty-state page-message">
        <Icon name="art" />
        <h1>Painting not found</h1>
        <p>This painting is not part of our current collection.</p>
        <Link className="primary-button" to="/gallery">
          Explore the collection
          <Icon name="arrow" />
        </Link>
      </div>
    )
  const previous = sequence[(index - 1 + sequence.length) % sequence.length]
  const next = sequence[(index + 1) % sequence.length]
  const paragraphs = artwork.description
    ? descriptionParagraphs(artwork.description)
    : []
  const movement = movementOptions([artwork])[0]?.name
  return (
    <section className="detail-section" aria-labelledby="detail-title">
      <div className="detail-topbar">
        <Link className="back-link" to={`/${view}${search}`}>
          <Icon name="left" />
          Back to {view === 'gallery' ? 'the collection' : 'list view'}
        </Link>
        <span>
          {String(index + 1).padStart(2, '0')} / {sequence.length} PAINTINGS
          {sequence === filtered && (options.query || options.styles.length > 0)
            ? ' · FILTERED'
            : ''}
        </span>
      </div>
      <div className="detail-layout">
        <div className="detail-art">
          <div className="detail-image" key={artwork.id}>
            <ArtworkImage
              artwork={artwork}
              iiifUrl={collection.iiifUrl}
              size={843}
              eager
            />
          </div>
          <div className="image-credit">
            <span>Art Institute of Chicago</span>
            <span>Public domain · CC0</span>
          </div>
        </div>
        <article className="detail-copy">
          <div className="eyebrow">
            {movement || 'FROM THE OPEN COLLECTION'}
          </div>
          <h1 id="detail-title">{artwork.title}</h1>
          <p className="detail-artist">
            {artwork.artist_title || 'Unknown artist'}
          </p>
          <p className="detail-artist-bio">{artwork.artist_display}</p>
          <span className="detail-year">
            {artwork.date_display || 'Date unknown'}
          </span>
          <dl className="artwork-facts">
            <div>
              <dt>MEDIUM</dt>
              <dd>{artwork.medium_display || 'Not recorded'}</dd>
            </div>
            <div>
              <dt>DIMENSIONS</dt>
              <dd>{artwork.dimensions || 'Not recorded'}</dd>
            </div>
            <div>
              <dt>ORIGIN</dt>
              <dd>{artwork.place_of_origin || 'Not recorded'}</dd>
            </div>
            <div>
              <dt>DEPARTMENT</dt>
              <dd>{artwork.department_title || 'Not recorded'}</dd>
            </div>
            <div>
              <dt>ON VIEW</dt>
              <dd>{artwork.gallery_title || 'Not currently on view'}</dd>
            </div>
            <div>
              <dt>ARTWORK ID</dt>
              <dd>{artwork.id}</dd>
            </div>
          </dl>
          <div className="detail-story">
            <h2>Behind the canvas</h2>
            {paragraphs.length ? (
              paragraphs.map((text, paragraphIndex) => (
                <p key={paragraphIndex}>{text}</p>
              ))
            ) : (
              <p>
                The museum has not provided a written description for this
                painting. Explore its materials, origin, and artist above, or
                visit the museum’s artwork page.
              </p>
            )}
          </div>
          {artwork.style_titles.length > 0 && (
            <div className="detail-tags">
              {artwork.style_titles.map((style) => (
                <span key={style}>{style}</span>
              ))}
            </div>
          )}
          <div className="detail-credit">
            <h3>CREDIT LINE</h3>
            <p>{artwork.credit_line || 'Art Institute of Chicago'}</p>
          </div>
          <a
            className="text-button museum-artwork-link"
            href={`https://www.artic.edu/artworks/${artwork.id}`}
            target="_blank"
            rel="noreferrer"
          >
            View at the Art Institute
            <Icon name="external" />
          </a>
        </article>
      </div>
      <nav className="detail-pagination" aria-label="Browse paintings">
        {sequence.length > 1 ? (
          <>
            <Link
              to={artworkHref(previous.id, search, view)}
              className="pagination-link previous"
            >
              <Icon name="left" />
              <div>
                <span>PREVIOUS PAINTING</span>
                <strong>{previous.title}</strong>
              </div>
            </Link>
            <span className="pagination-center">
              {index + 1} / {sequence.length}
            </span>
            <Link
              to={artworkHref(next.id, search, view)}
              className="pagination-link next"
            >
              <div>
                <span>NEXT PAINTING</span>
                <strong>{next.title}</strong>
              </div>
              <Icon name="right" />
            </Link>
          </>
        ) : (
          <p>
            This is the only painting in your current results.{' '}
            <Link to={`/${view}`}>Browse all paintings</Link>
          </p>
        )}
      </nav>
    </section>
  )
}
