# v1.8.6 同步效能改善（開發測試版）

本版保留快速編輯、手動刪除／恢復及現有登入、預算功能，增加年度資料 SHA-256 指紋檢查。

更新檔案：`index.html`、`apps-script/Code.gs`。其中 Code.gs 已合併 manualRecord 入口，不能用上個 ZIP 裡缺少入口的舊檔覆蓋。

## 行為
- 首次登入先抓指定年度完整資料及版本指紋。
- 之後每兩分鐘、恢復分頁或按同步時，先呼叫 GET action=version；未變動不抓整年度 JSON。
- 版本有變動才顯示同步中並讀取最新資料。
- 有快速編輯草稿時暫緩雲端讀取；完成儲存時重新核對雲端。
- 雲端指紋由 Apps Script 計算，仍需讀取該年度 JSON 欄，不是完全免讀 Sheet；只降低客戶端資料量。
- 本階段仍保留舊 delta 路徑與衝突處理。規則、預算仍按原流程更新。

## 部署
1. 備份原 Google Sheets、GAS、GitHub Pages 檔案。
2. 更新 `Code.gs` 和 `index.html`，保留同 ZIP 的 TransactionPatch.gs。
3. Apps Script 以「新版本」重新部署，使用相同 Web App /exec URL。
4. 先在測試帳本測試：雙裝置分類變更、手動刪除、草稿保護、斷網恢復。

## 限制
- 目前僅通過語法與靜態檢查；未在真實 Apps Script / Sheets 上做整合測試。
- 快速編輯跨 100 筆分批時仍可能部分提交，完整回復機制待 AI 發布模組建置。
- 現有 `pullRemote` 的舊版資料合併邏輯仍需後續測試（刪除紀錄、分類同步等）。
