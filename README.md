# 家計簿 v1.7 — 雙人登入、操作紀錄、年度分表與備份

## 重要：先備份，再升級

1. 在現有 v1.6.2 網站確認「待同步 0 筆」，下載完整 JSON 備份。
2. 在 Google Sheets 另建立一份**獨立的私人試算表**作為備份，保留其 ID。
3. 原 Google Sheets 的 `Records` 工作表不會被 v1.7 刪除或清空；第一次執行 `setupV17()` 時，會把舊交易複製至 `Records_2025`、`Records_2026` 等年度工作表。舊 `Records` 就是升級前快照。

## Apps Script 部署（必要）

1. 在現有 Apps Script 專案，把 `apps-script/Code.gs` **完整替換**舊檔，再新增一個 Apps Script 檔案 `Auth.gs`，貼入 `apps-script/Auth.gs`。
2. 確認 Script Properties：

   - `SPREADSHEET_ID`：原本主 Google Sheets 的 ID（沿用）。
   - `ACCESS_TOKEN`：原本至少 24 字元的隨機密鑰（沿用；現在只在後端簽署登入憑證）。
   - `BOOTSTRAP_ME_PASSWORD`：承瑋初始密碼，至少 12 個字元。
   - `BOOTSTRAP_WIFE_PASSWORD`：俐穎初始密碼，至少 12 個字元。
   - `BACKUP_SPREADSHEET_ID`：另一份私人備份 Google Sheets 的 ID（建議設定）。

3. 在 Apps Script 編輯器手動執行 **`setupV17()`** 一次，核准所需權限。此函式會建立 `Users`、`AuditLog`、年度工作表，儲存加鹽雜湊後**刪除 Script Properties 中的兩組明文初始密碼**。確認成功後不要再執行第二次。
4. 若設定了 `BACKUP_SPREADSHEET_ID`，先手動執行 **`backupToSeparateBookV17()`** 檢查另一份 Sheet 有資料，再執行一次 **`installDailyBackupV17()`** 建立每天凌晨約 3 點的排程。備份以星期幾作為七個輪替槽，最多保存**近七天的每日快照**；它是另一份 Google Sheets，不會動原始主表。
5. 「部署 → 管理部署作業 → 編輯 → 新版本 → 部署」，執行身分選「我」，存取權按原設定「任何人」。原網站前端必須先通過個人登入，後端才允許讀寫。
6. 將 v1.7 的 `index.html` 替換 GitHub Pages 倉庫根目錄同名檔案。
7. 在 iPhone 或電腦開啟網頁，輸入 Apps Script `/exec` 網址、選擇使用者及密碼登入。第一次仍須提供網址，但不用再輸入舊 Token；後續同一瀏覽器會保存網址。

## 功能與限制

- 兩個帳號：承瑋（me）、俐穎（wife）；兩人能查看及編輯家庭交易。後端按**實際登入者**記錄新增、修改、刪除，不能透過前端指定操作者。
- 登入憑證有效 12 小時，儲存在該瀏覽器的 `sessionStorage`；登出清除憑證，且在沒有待同步修改時清除本機記帳快取。手機加入主畫面的獨立 Web App 可能需要重新登入。
- 密碼只經由 HTTPS POST 傳至 Apps Script 後端，後端存加鹽、多輪 SHA-256 雜湊；Google Sheets 的 `Users` 是私人資料表。這是家庭自用的輕量驗證，**不是銀行等級安全機制**；請使用強且不重複的密碼。
- 資料寫入 `Records_YYYY`；登入預設只向雲端讀取本年度，可按「載入年度」再抓舊年份。既有瀏覽器快取可能包含之前載入的年份，因此不代表它們重新從伺服器下載。
- `AuditLog` 保留時間、登入帳號、操作、交易 ID、修改前及修改後 JSON；網站的「操作紀錄」顯示最近 100 筆摘要。
- 既有交易**暫不支援直接變更年份**（需在未來版本加入跨年度移動與稽核）。如需修改既有交易年份，應先另行備份再處理。
- 不提供自行註冊、忘記密碼重設、細緻權限角色；密碼修改須由 Sheets 管理者在後端以安全流程操作（本版沒有前端修改密碼）。
- 由於 Apps Script 是無狀態 Web App，會把有時效的簽章憑證送在讀取網址參數；請勿分享帶有 `session` 參數的 URL，亦勿在不可信任的裝置上登入。

## 驗證與回復

- 本次已做前端及 Apps Script JavaScript 語法檢查、ZIP 完整性檢查；**無真實 Apps Script／Google Sheets 的整合測試**，請先用副本試跑。
- 如要回復：切回 v1.6.2 的 `index.html` 和 Apps Script 部署版本，並仍使用原始 `Records` 工作表。v1.7 新增的交易儲存在 `Records_YYYY`，回復時不會自動出現在舊版，須先匯出、合併；所以正式升級前必須先做試跑與備份。
