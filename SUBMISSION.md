# Frame — MP2 使用與繳交說明

原始作業規範保留在 README.md。介面採暖白底、襯線標題和陶土橘點綴的美術館風格，資料來源為 Art Institute of Chicago API。

## 啟動及檢查

建議使用 Node.js 22.12 或更新版本。GitHub Actions 已設定 Node.js 22。

```sh
npm ci
npm run dev
```

本機網址：http://localhost:5173/mp2/ 。Vite 的 `base` 和 React Router 的 `basename` 都使用 `/mp2/`，符合此 repository 名稱。

```sh
npm run lint
npm run build
npm run test:e2e -- tests/collection.spec.ts
```

瀏覽器測試預設使用已安裝的 Google Chrome。若沒有 Chrome，可執行 `npx playwright install chromium`，再用 `PLAYWRIGHT_CHANNEL=chromium npm run test:e2e -- tests/collection.spec.ts`。

真實館方連線測試需自行啟用，避免每次測試都重複請求館方服務：

```sh
RUN_LIVE=1 npm run test:e2e -- tests/live.spec.ts --project=desktop
```

如需更新館方備援資料：`npm run refresh:collection`。它會保存最多 100 幅有圖片的不同公開領域畫作；如果 API 提供不足 100 幅，就保存實際數量。圖片仍由館方提供，需要網路連線。

## 操作說明

- Gallery：畫作圖片卡片；藝術流派可多選，符合任一選取流派即顯示。
- List view：輸入即時搜尋，不需 Enter；可按標題、藝術家和年份排序，每項均有 Ascending / Descending。
- Details：點擊任一列表項目或畫廊卡片即可進入；顯示作者、日期、媒材、尺寸、來源、部門、展廳、流派、館藏說明和 credit line。
- Previous / Next：依目前搜尋、篩選與排序後的結果切換，首尾循環；只有一筆結果時會顯示說明。
- 搜尋、篩選和排序記錄在 URL，跨視圖、返回列表及重新整理會保留。
- 詳情網址範例：`/mp2/artwork/28560`，可直接開啟。

## GitHub Pages

本次已完成本機程式和部署設定，尚未替使用者 commit、push 或修改 GitHub Pages 設定。

1. 確認 `max881230/mp2` repository 是 public。
2. GitHub repository → Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。
3. 檢查需要提交的檔案，將程式、`package-lock.json`、文件及 workflow commit 到 `main` 並 push。不要提交 `node_modules/`、`dist/`、`test-results/` 或 `playwright-report/`。
4. 等待 Deploy to GitHub Pages workflow 成功，驗證 `https://max881230.github.io/mp2/`。
5. 在新分頁直接開啟 `https://max881230.github.io/mp2/artwork/28560` 並重新整理。

建置後的 `dist/404.html` 使用相同的 SPA 入口，因此 GitHub Pages 可載入乾淨的詳情路徑。GitHub Pages 在這種直接請求仍回傳 HTTP 404，但瀏覽器會執行 app 並顯示正確頁面；站內 `<Link>` 導航使用 React Router。入口只有外部 Vite module script，沒有 inline redirect script。

## 三分鐘內展示建議

1. 先顯示部署網址及 Gallery 的 100 幅畫作。
2. 選取 Impressionism，再加選 Realism，展示結果數量變化及多選。
3. 進入 List view，搜尋 `Monet`，展示不需 Enter 的即時搜尋。
4. 示範 Title / Artist / Year 的升降冪排序。
5. 點擊列表項目進入詳情，展示欄位、Previous / Next、返回保留條件。
6. 回到 Gallery 點擊卡片，再把詳情網址貼到新分頁並重新整理。
7. 簡短展示手機版。

錄製不超過三分鐘的影片，上傳 Google Drive，分享給 `uiuc.web.programming@gmail.com`，依 README.md 的表單提交。繳交時附完整 LLM 聊天紀錄、參考來源 SOURCES.md，並回答 LLM 使用問卷。`chatlogs/` 已包含匯出時點之前的實際對話與工具／程式紀錄；繳交前請更新為最終版本，並附上任何後續相關對話。

截止時間以 README.md 為準：**2026 年 10 月 6 日星期二，11:59 PM CT**。
