import { Link, NavLink, useLocation } from 'react-router-dom'
import { collectionSearch } from '../lib/browse'
import { Icon } from './Icon'

export function Header() {
  const location = useLocation()
  const search = collectionSearch(location.search)
  const detailView =
    new URLSearchParams(location.search).get('from') === 'list'
      ? 'list'
      : 'gallery'
  const isDetail = location.pathname.startsWith('/artwork/')
  return (
    <header className="site-header">
      <Link to="/gallery" className="brand" aria-label="Frame home">
        <span className="brand-symbol" aria-hidden="true">
          f.
        </span>
        <span className="brand-name">
          FRAME<span>A WINDOW INTO ART</span>
        </span>
      </Link>
      <nav aria-label="Main navigation" className="main-nav">
        <NavLink
          to={`/gallery${search}`}
          className={({ isActive }) =>
            isActive || (isDetail && detailView === 'gallery')
              ? 'nav-link active'
              : 'nav-link'
          }
        >
          <Icon name="grid" />
          Gallery
        </NavLink>
        <NavLink
          to={`/list${search}`}
          className={({ isActive }) =>
            isActive || (isDetail && detailView === 'list')
              ? 'nav-link active'
              : 'nav-link'
          }
        >
          <Icon name="list" />
          List view
        </NavLink>
      </nav>
      <a
        className="museum-link"
        href="https://www.artic.edu/"
        target="_blank"
        rel="noreferrer"
      >
        Art Institute of Chicago
        <Icon name="external" />
      </a>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-brand" to="/gallery">
          FRAME<span>Art is for everyone.</span>
        </Link>
        <p>
          An independent exploration of the Art Institute of Chicago collection.
        </p>
      </div>
      <div className="footer-credit">
        <a href="https://api.artic.edu/docs/" target="_blank" rel="noreferrer">
          Powered by the AIC API
          <Icon name="external" />
        </a>
        <span>Public domain artwork · Metadata CC0</span>
        <span>Artwork descriptions © Art Institute of Chicago, CC BY 4.0</span>
      </div>
    </footer>
  )
}
