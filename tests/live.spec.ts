import { expect, test } from '@playwright/test'

test('live museum API and IIIF images load in the built app', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.RUN_LIVE !== '1' || testInfo.project.name !== 'desktop',
    'Opt in with RUN_LIVE=1 to avoid repeatedly requesting museum data.',
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/mp2/gallery')
  await expect(page.locator('.artwork-card')).toHaveCount(100, {
    timeout: 25000,
  })
  await expect(page.locator('.data-notice')).toHaveCount(0)
  await expect
    .poll(
      async () =>
        page
          .locator('.hero-painting img')
          .evaluateAll(
            (images) =>
              images.filter(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ).length,
          ),
      { timeout: 20000 },
    )
    .toBe(3)
  await expect
    .poll(
      async () =>
        page
          .locator('.card-image img')
          .evaluateAll(
            (images) =>
              images.filter(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ).length,
          ),
      { timeout: 20000 },
    )
    .toBeGreaterThanOrEqual(4)
  await page.screenshot({ path: testInfo.outputPath('gallery-live.png') })
  await page.locator('.artwork-card').first().click()
  await expect(page.locator('#detail-title')).toHaveText('The Bedroom')
  await expect
    .poll(
      async () =>
        page
          .locator('.detail-image img')
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0)
  await page.screenshot({ path: testInfo.outputPath('detail-live.png') })
  expect(errors).toEqual([])
})
