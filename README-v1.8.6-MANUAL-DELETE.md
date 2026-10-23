# v1.8.6 開發版：僅手動交易軟刪除／恢復

- 此包是 **測試版**，不是經過真實 Apps Script + Google Sheets 整合測試的正式版。
- 交易清單中僅 `manual:` ID、`source=manual`（或早期未標記來源）、無發票號碼、非自訂分類定義的紀錄顯示「刪除」。
- 後端 `manualRecord` 必須使用有效登入 Session；重新讀取 Sheets 中交易來源驗證；刪除只是標記 `deleted=true`，可透過「手動交易回收區」恢復。
- 刪除、恢復會增加 `_rev`、更新 JSON 與摘要行、寫入 AuditLog；成功回應前不改本地紀錄。
- 現有 `delta` 介面加入保護，禁止任意刪除發票；自訂分類原先的刪除維持。
- `patchBatch` 原功能保留。

## 測試部署
1. 先備份正式資料；請在獨立的**測試用** Google Spreadsheet／Apps Script 部署測試。
2. 將 `apps-script/Code.gs`、`apps-script/TransactionPatch.gs` 更新至測試專案；其他現有 .gs 保留。
3. 更新測試用 GitHub Pages 前端 `index.html`，確保 API URL 指向新部署的測試 Web App。
4. 先用測試資料驗證手動刪除、跨裝置同步、回收區恢復、AuditLog、刷新與預算統計，再試發票不出現刪除按鈕、直接向後端請求刪除發票會被拒絕。
5. 既有草稿或待同步寫入須先處理完成才允許刪除。

## 注意
- Google Sheets 中來源不明（例如 `manual:` ID 但 `source` 是其他值）的交易預設**不可刪除**，需先調查來源。
- 這次未更動正式帳本或你提供的 XLSX。
- 發票原本的普通編輯功能不在本次需求之內，未另外變更。
