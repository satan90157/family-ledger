# v1.8.6.6 AI 匯出修正

- 一次下載 ZIP，包含完整歷史交易 CSV 與原始基準 JSON，避免瀏覽器阻擋連續下載。
- 不依賴 CDN 或第三方套件。ZIP 為未壓縮封裝，檔案可能較大。
- 匯出前登入／草稿／待同步驗證失敗會顯示明確錯誤，不再只有 Console 訊息。
- 僅修改 index.html；無新增 Apps Script API，不修改正式 Google Sheets。
- 沒有真實 Google Sheets 端到端測試；請在測試環境部署。
