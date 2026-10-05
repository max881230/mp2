import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { loadCollection } from './lib/collection'
import type { CollectionResult } from './lib/collection'
import { Header, Footer } from './components/Layout'
import { Icon } from './components/Icon'
import { CollectionView } from './pages/CollectionView'
import { DetailView } from './pages/DetailView'
import './App.css'

function App() {
  const [result, setResult] = useState<CollectionResult | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  useEffect(() => {
    let active = true
    loadCollection()
      .then((value) => {
        if (active) setResult(value)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = location.pathname.startsWith('/artwork/')
      ? 'Painting details — Frame'
      : `${location.pathname === '/list' ? 'List view' : 'The collection'} — Frame`
  }, [location.pathname])
  async function retry() {
    setLoading(true)
    setError(false)
    try {
      setResult(await loadCollection(true))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        {loading ? (
          <div className="loading-state" role="status">
            <span className="loading-mark" aria-hidden="true">
              f.
            </span>
            <h1>Opening the collection</h1>
            <p>A little art is on its way.</p>
            <div className="loading-line" />
          </div>
        ) : error || !result ? (
          <div className="empty-state page-message" role="alert">
            <Icon name="art" />
            <h1>The collection couldn’t be loaded</h1>
            <p>Please check your connection and try again.</p>
            <button className="primary-button" onClick={retry}>
              Try again
              <Icon name="arrow" />
            </button>
          </div>
        ) : (
          <>
            {result.notice && (
              <div className="data-notice" role="status">
                <p>{result.notice}</p>
                <button className="text-button" onClick={retry}>
                  Retry live collection
                  <Icon name="arrow" />
                </button>
              </div>
            )}
            <Routes>
              <Route path="/" element={<Navigate to="/gallery" replace />} />
              <Route
                path="/gallery"
                element={
                  <CollectionView
                    collection={result.collection}
                    view="gallery"
                  />
                }
              />
              <Route
                path="/list"
                element={
                  <CollectionView collection={result.collection} view="list" />
                }
              />
              <Route
                path="/artwork/:id"
                element={<DetailView collection={result.collection} />}
              />
              <Route
                path="*"
                element={
                  <div className="empty-state page-message">
                    <h1>Let’s get you back to the art.</h1>
                    <p>This page doesn’t exist.</p>
                    <Link className="primary-button" to="/gallery">
                      Explore the collection
                      <Icon name="arrow" />
                    </Link>
                  </div>
                }
              />
            </Routes>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default App
