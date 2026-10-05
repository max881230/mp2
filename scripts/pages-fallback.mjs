import { copyFile } from 'node:fs/promises'

// GitHub Pages serves this entry for clean deep links, keeping BrowserRouter URLs.
// The entry only contains Vite's external script; no inline redirect script is used.
await copyFile(
  new URL('../dist/index.html', import.meta.url),
  new URL('../dist/404.html', import.meta.url),
)
