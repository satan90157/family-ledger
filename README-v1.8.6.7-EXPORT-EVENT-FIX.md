# v1.8.6.7 匯出按鈕事件修正

## 根因
上一版 `exportAICloudSnapshotV1865_` 和 `$('aiExportV1865').onclick` 位於主程式 IIFE 外，但 `$`、`session`、`pending`、`quickDraft` 等都在 IIFE 內。因此事件綁定執行時拋出 `ReferenceError: $ is not defined`，匯出按鈕根本未綁定，點擊後狀態持續顯示「尚未匯出」。

## 修正
將 AI 匯出功能與事件處理移入既有 IIFE 內，保留同步檢查、逐年讀取、ZIP 產生及原功能。只更新 `index.html`。

## 驗證
已執行 Node.js 靜態語法檢查與結構檢查。尚未執行真實瀏覽器與雲端測試，請先在測試站部署。
