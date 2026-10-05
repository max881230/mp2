import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Collection } from '../src/types'

const snapshot: Collection = JSON.parse(
  readFileSync(
    new URL('../public/data/paintings.json', import.meta.url),
    'utf8',
  ),
)

test('GitHub Pages 404 entry renders a direct detail URL using the correct asset base', async ({
  page,
}) => {
  const fallback = readFileSync(
    new URL('../dist/404.html', import.meta.url),
    'utf8',
  )
  expect(fallback).toBe(
    readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'),
  )
  expect(fallback).toContain('/mp2/assets/')
  await page.route('**/mp2/artwork/28560', (route) =>
    route.fulfill({ status: 404, contentType: 'text/html', body: fallback }),
  )
  const response = await page.goto('/mp2/artwork/28560')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'The Bedroom', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: /^NEXT PAINTING/ }).click()
  await expect(page.locator('#detail-title')).toHaveText(
    'Paris Street; Rainy Day',
  )
})

test.beforeEach(async ({ page }) => {
  await page.route('https://api.artic.edu/api/v1/artworks/search**', (route) =>
    route.fulfill({
      json: {
        data: snapshot.artworks,
        config: { iiif_url: snapshot.iiifUrl },
        pagination: { total_pages: 1 },
      },
    }),
  )
  // Keep interaction tests deterministic and avoid repeatedly fetching museum images.
  await page.route('https://www.artic.edu/iiif/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  )
})

test('gallery displays 100 distinct paintings, media, and valid API query', async ({
  page,
}) => {
  let requests = 0
  page.on('request', (request) => {
    if (!request.url().startsWith('https://api.artic.edu/')) return
    requests++
    const params = JSON.parse(
      new URL(request.url()).searchParams.get('params')!,
    )
    expect(params.limit).toBe(100)
    expect(params.query.bool.filter).toContainEqual({
      term: { 'artwork_type_title.keyword': 'Painting' },
    })
    expect(params.query.bool.filter).toContainEqual({
      term: { is_public_domain: true },
    })
  })
  await page.goto('/mp2/gallery')
  await expect(page.locator('.artwork-card')).toHaveCount(100)
  await expect(page.locator('.card-image img')).toHaveCount(100)
  await expect(page.locator('.card-image img').first()).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  )
  expect(new Set(snapshot.artworks.map((artwork) => artwork.id)).size).toBe(100)
  expect(
    new Set(snapshot.artworks.map((artwork) => artwork.image_id)).size,
  ).toBe(100)
  expect(
    snapshot.artworks.every(
      (artwork) =>
        artwork.artwork_type_title === 'Painting' &&
        artwork.is_public_domain &&
        artwork.image_id,
    ),
  ).toBe(true)
  expect(requests).toBe(1)
  await page.reload()
  await expect(page.locator('.artwork-card')).toHaveCount(100)
  expect(requests).toBe(1)
})

test('list filters while typing, handles no results, and clears search', async ({
  page,
}) => {
  await page.goto('/mp2/list')
  await expect(page.locator('.artwork-row')).toHaveCount(100)
  const search = page.getByRole('searchbox', { name: 'Search paintings' })
  await search.pressSequentially('Monet')
  const expected = snapshot.artworks.filter((artwork) =>
    [
      artwork.title,
      artwork.artist_title,
      artwork.date_display,
      artwork.place_of_origin,
      artwork.medium_display,
      ...artwork.style_titles,
    ]
      .join(' ')
      .toLowerCase()
      .includes('monet'),
  ).length
  await expect(page.locator('.artwork-row')).toHaveCount(expected)
  await search.fill('no-painting-has-this-title-xyz')
  await expect(
    page.getByRole('heading', { name: 'No paintings found' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Reset search & filters' }).click()
  await expect(page.locator('.artwork-row')).toHaveCount(100)
  await expect(search).toHaveValue('')
})

for (const property of ['title', 'artist', 'year'] as const) {
  for (const order of ['asc', 'desc']) {
    test(`list sorts by ${property} in ${order} order`, async ({ page }) => {
      await page.goto('/mp2/list')
      await page.getByLabel('Sort by', { exact: true }).selectOption(property)
      await page.getByLabel('Sort direction').selectOption(order)
      const hrefs = await page
        .locator('.artwork-row')
        .evaluateAll((rows) => rows.map((row) => row.getAttribute('href')!))
      expect(hrefs).toHaveLength(100)
      const artworks = hrefs.map((href) =>
        snapshot.artworks.find((artwork) =>
          href.includes(`/artwork/${artwork.id}?`),
        )!,
      )
      const collator = new Intl.Collator('en', {
        sensitivity: 'base',
        numeric: true,
      })
      for (let index = 1; index < artworks.length; index++) {
        const a = artworks[index - 1]
        const b = artworks[index]
        const comparison =
          property === 'year'
            ? a.date_start! - b.date_start!
            : collator.compare(
                property === 'title' ? a.title : (a.artist_title ?? ''),
                property === 'title' ? b.title : (b.artist_title ?? ''),
              )
        expect(order === 'asc' ? comparison <= 0 : comparison >= 0).toBe(true)
      }
    })
  }
}

test('gallery multi-select filters use a union and persist between views', async ({
  page,
}) => {
  await page.goto('/mp2/gallery')
  const impressionism = page.getByRole('button', {
    name: /^Impressionism\s*\d/,
  })
  const realism = page.getByRole('button', { name: /^Realism\s*\d/ })
  await impressionism.click()
  await expect(impressionism).toHaveAttribute('aria-pressed', 'true')
  const one = snapshot.artworks.filter((artwork) =>
    artwork.style_titles.includes('Impressionism'),
  ).length
  await expect(page.locator('.artwork-card')).toHaveCount(one)
  await realism.click()
  const both = snapshot.artworks.filter((artwork) =>
    artwork.style_titles.some((style) =>
      ['Impressionism', 'Realism'].includes(style),
    ),
  ).length
  await expect(page.locator('.artwork-card')).toHaveCount(both)
  await page
    .getByRole('link', { name: 'List view', exact: true })
    .first()
    .click()
  await expect(page.locator('.artwork-row')).toHaveCount(both)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('.artwork-row')).toHaveCount(100)
})

for (const view of ['gallery', 'list']) {
  test(`${view} opens details; previous and next cycle sorted results and preserve context`, async ({
    page,
  }) => {
    await page.goto(`/mp2/${view}?q=monet&sort=year&order=asc`)
    const selector = view === 'gallery' ? '.artwork-card' : '.artwork-row'
    await expect(page.locator(selector).first()).toBeVisible()
    const hrefs = await page
      .locator(selector)
      .evaluateAll((items) => items.map((item) => item.getAttribute('href')!))
    expect(hrefs.length).toBeGreaterThan(2)
    await page.locator(selector).first().click()
    await expect(page).toHaveURL(new RegExp(`/mp2/artwork/\\d+\\?`))
    await expect(page.locator('.artwork-facts')).toContainText('MEDIUM')
    await expect(page.locator('.detail-story')).toContainText(
      'Behind the canvas',
    )
    await page.getByRole('link', { name: /^PREVIOUS PAINTING/ }).click()
    expect(new URL(page.url()).pathname).toBe(
      new URL(hrefs.at(-1)!, page.url()).pathname,
    )
    await page.getByRole('link', { name: /^NEXT PAINTING/ }).click()
    expect(new URL(page.url()).pathname).toBe(
      new URL(hrefs[0], page.url()).pathname,
    )
    await page.getByRole('link', { name: /^NEXT PAINTING/ }).click()
    expect(new URL(page.url()).pathname).toBe(
      new URL(hrefs[1], page.url()).pathname,
    )
    await page.reload()
    await expect(page.locator('#detail-title')).toBeVisible()
    await page.getByRole('link', { name: /^Back to/ }).click()
    await expect(page.getByRole('searchbox')).toHaveValue('monet')
    await expect(page.getByLabel('Sort by', { exact: true })).toHaveValue(
      'year',
    )
    await expect(page.getByLabel('Sort direction')).toHaveValue('asc')
    await expect(page.locator(selector)).toHaveCount(hrefs.length)
  })
}

test('direct detail URL works, unknown artwork is handled, singleton has no false next item', async ({
  page,
}) => {
  await page.goto('/mp2/artwork/28560')
  await expect(
    page.getByRole('heading', { name: 'The Bedroom', exact: true }),
  ).toBeVisible()
  await page.goto('/mp2/artwork/999999999')
  await expect(
    page.getByRole('heading', { name: 'Painting not found' }),
  ).toBeVisible()
  await page.goto('/mp2/artwork/28560?q=the+bedroom')
  await expect(
    page.getByText('This is the only painting in your current results.'),
  ).toBeVisible()
  await expect(page.locator('.pagination-link')).toHaveCount(0)
})

test('API outage falls back to snapshot and retry restores the live collection', async ({
  page,
}) => {
  await page.route('https://api.artic.edu/api/v1/artworks/search**', (route) =>
    route.abort(),
  )
  await page.goto('/mp2/gallery')
  await expect(page.locator('.data-notice')).toContainText(
    'saved museum collection',
  )
  await expect(page.locator('.artwork-card')).toHaveCount(100)
  await page.route('https://api.artic.edu/api/v1/artworks/search**', (route) =>
    route.fulfill({
      json: {
        data: snapshot.artworks,
        config: { iiif_url: snapshot.iiifUrl },
        pagination: { total_pages: 1 },
      },
    }),
  )
  await page.getByRole('button', { name: 'Retry live collection' }).click()
  await expect(page.locator('.data-notice')).toHaveCount(0)
  await expect(page.locator('.artwork-card')).toHaveCount(100)
})

test('total network failure shows an actionable error; fewer than 100 uses the real count', async ({
  page,
}) => {
  await page.route('https://api.artic.edu/api/v1/artworks/search**', (route) =>
    route.abort(),
  )
  await page.route('**/data/paintings.json', (route) => route.abort())
  await page.goto('/mp2/gallery')
  await expect(page.getByRole('alert')).toContainText(
    'The collection couldn’t be loaded',
  )
  await page.route('https://api.artic.edu/api/v1/artworks/search**', (route) =>
    route.fulfill({
      json: {
        data: snapshot.artworks.slice(0, 7),
        config: { iiif_url: snapshot.iiifUrl },
        pagination: { total_pages: 1 },
      },
    }),
  )
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('.artwork-card')).toHaveCount(7)
  await expect(page.locator('.data-notice')).toContainText(
    '7 available paintings',
  )
})

test('missing images have a fallback, and pages have no inline styles, scripts, or layout tables', async ({
  page,
}) => {
  await page.route('https://www.artic.edu/iiif/**', (route) => route.abort())
  for (const path of ['/mp2/gallery', '/mp2/list', '/mp2/artwork/28560']) {
    await page.goto(path)
    await expect(page.locator('.image-unavailable').first()).toBeVisible()
    await expect(page.locator('[style]')).toHaveCount(0)
    await expect(page.locator('script:not([src])')).toHaveCount(0)
    await expect(page.locator('table')).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
})
