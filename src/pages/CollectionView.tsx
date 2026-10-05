import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { Hero } from '../components/Hero'

export function CollectionView({
  collection,
  view,
}: {
  collection: Collection
  view: 'gallery' | 'list'
}) {
  const [params, setParams] = useSearchParams()
  const options = useMemo(() => readOptions(params), [params])
  const artworks = useMemo(
    () => selectArtworks(collection.artworks, options),
    [collection.artworks, options],
  )
  const movements = useMemo(
    () => movementOptions(collection.artworks),
    [collection.artworks],
  )
  const filtered = Boolean(options.query || options.styles.length)
  const search = collectionSearch(`?${params.toString()}`)
  function update(name: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }
  function toggleStyle(style: string) {
    const next = new URLSearchParams(params)
    next.delete('style')
    const styles = options.styles.includes(style)
      ? options.styles.filter((name) => name !== style)
      : [...options.styles, style]
    styles.forEach((name) => next.append('style', name))
    setParams(next, { replace: true })
  }
  function reset() {
    const next = new URLSearchParams(params)
    next.delete('q')
    next.delete('style')
    setParams(next, { replace: true })
  }
  return (
    <>
      {view === 'gallery' && <Hero collection={collection} />}
      <section
        className={`collection-section ${view === 'list' ? 'list-section' : ''}`}
        id="collection"
        aria-labelledby="collection-title"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              {view === 'gallery'
                ? 'FIND YOUR NEXT FAVORITE'
                : 'A COLLECTION WORTH EXPLORING'}
            </div>
            <h2 id="collection-title">
              {view === 'gallery'
                ? 'The collection'
                : 'Every painting, at a glance'}
              <span className="count-badge">{collection.artworks.length}</span>
            </h2>
            <p>
              {view === 'gallery'
                ? 'Follow a movement. Find an artist. Let your curiosity lead.'
                : 'Search, sort, and discover the stories behind the canvas.'}
            </p>
          </div>
          <div className="view-toggle" aria-label="Collection view">
            <Link
              className={view === 'gallery' ? 'selected' : ''}
              to={`/gallery${search}`}
              aria-label="Gallery view"
              aria-current={view === 'gallery' ? 'page' : undefined}
            >
              <Icon name="grid" />
            </Link>
            <Link
              className={view === 'list' ? 'selected' : ''}
              to={`/list${search}`}
              aria-label="List view"
              aria-current={view === 'list' ? 'page' : undefined}
            >
              <Icon name="list" />
            </Link>
          </div>
        </div>
        <div className="collection-toolbar">
          <div className="search-field">
            <Icon name="search" />
            <label className="sr-only" htmlFor="painting-search">
              Search paintings
            </label>
            <input
              id="painting-search"
              type="search"
              value={options.query}
              onChange={(event) => update('q', event.target.value)}
              placeholder="Search by artwork, artist, or keyword…"
              autoComplete="off"
            />
            {options.query && (
              <button
                className="icon-button"
                onClick={() => update('q', '')}
                aria-label="Clear search"
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <div className="sort-controls">
            <label htmlFor="sort-property">Sort by</label>
            <select
              id="sort-property"
              value={options.sort}
              onChange={(event) => update('sort', event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="year">Year</option>
            </select>
            <label className="sr-only" htmlFor="sort-order">
              Sort direction
            </label>
            <select
              id="sort-order"
              value={options.order}
              onChange={(event) => update('order', event.target.value)}
            >
              <option value="asc">Ascending ↑</option>
              <option value="desc">Descending ↓</option>
            </select>
          </div>
        </div>
        <div className="filter-area">
          <span className="filter-label">ART MOVEMENT</span>
          <div className="filter-chips" aria-label="Filter by art movement">
            <button
              className={`filter-chip ${options.styles.length === 0 ? 'selected' : ''}`}
              aria-pressed={options.styles.length === 0}
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('style')
                setParams(next, { replace: true })
              }}
            >
              All paintings<span>{collection.artworks.length}</span>
            </button>
            {movements.map(({ name, count }) => (
              <button
                key={name}
                className={`filter-chip ${options.styles.includes(name) ? 'selected' : ''}`}
                aria-pressed={options.styles.includes(name)}
                onClick={() => toggleStyle(name)}
              >
                {name}
                <span>{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="results-summary">
          <p role="status" aria-live="polite">
            Showing <strong>{artworks.length}</strong> of{' '}
            {collection.artworks.length} paintings
            {options.query && <> matching “{options.query}”</>}
          </p>
          {filtered ? (
            <button className="text-button" onClick={reset}>
              Clear filters
              <Icon name="close" />
            </button>
          ) : (
            <span className="results-note">A little discovery, every day.</span>
          )}
        </div>
        {artworks.length === 0 ? (
          <div className="empty-state">
            <Icon name="search" />
            <h3>No paintings found</h3>
            <p>Try a different artist, title, or art movement.</p>
            <button className="secondary-button" onClick={reset}>
              Reset search & filters
              <Icon name="arrow" />
            </button>
          </div>
        ) : view === 'gallery' ? (
          <div className="artwork-grid">
            {artworks.map((artwork, index) => (
              <Link
                className="artwork-card"
                key={artwork.id}
                to={artworkHref(artwork.id, search, view)}
              >
                <div className="card-image">
                  <ArtworkImage
                    artwork={artwork}
                    iiifUrl={collection.iiifUrl}
                    eager={index < 4}
                  />
                  <span className="card-open" aria-hidden="true">
                    <Icon name="arrow" />
                  </span>
                </div>
                <div className="card-meta">
                  <p>{artwork.artist_title || 'Unknown artist'}</p>
                  <h3>{artwork.title}</h3>
                  <div className="card-bottom">
                    <span>{artwork.date_display || 'Date unknown'}</span>
                    <span className="card-movement">
                      {movements.find(({ name }) =>
                        artwork.style_titles.includes(name),
                      )?.name ||
                        artwork.place_of_origin ||
                        'Painting'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="artwork-list">
            <div className="list-column-headings" aria-hidden="true">
              <span>ARTWORK</span>
              <span>ARTIST</span>
              <span>DATE</span>
              <span />
            </div>
            {artworks.map((artwork) => (
              <Link
                className="artwork-row"
                key={artwork.id}
                to={artworkHref(artwork.id, search, view)}
              >
                <div className="list-artwork">
                  <div className="list-thumbnail">
                    <ArtworkImage
                      artwork={artwork}
                      iiifUrl={collection.iiifUrl}
                      size={200}
                    />
                  </div>
                  <div>
                    <h3>{artwork.title}</h3>
                    <p>{artwork.medium_display || 'Painting'}</p>
                  </div>
                </div>
                <span className="list-artist">
                  {artwork.artist_title || 'Unknown artist'}
                </span>
                <span className="list-date">
                  {artwork.date_display || 'Date unknown'}
                </span>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        )}
        {artworks.length > 0 && (
          <div className="collection-end">
            <span className="orange-line" />
            <span>
              {filtered
                ? 'Your own little corner of the collection.'
                : `All ${collection.artworks.length} paintings. Endless inspiration.`}
            </span>
            <button
              className="text-button"
              onClick={() =>
                document
                  .getElementById('collection')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Back to top ↑
            </button>
          </div>
        )}
      </section>
    </>
  )
}
