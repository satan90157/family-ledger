# 家計簿｜GitHub Pages + Google Sheets

手機優先的家庭記帳網站。`dist/index.html` 是可獨立部署的靜態網站；`apps-script/Code.gs` 是 Google Sheets 後端。

## 現有功能

- Invoice CSV 匯入（依發票號碼合併品項與折扣、偵測重複）
- 手動新增、編輯、刪除收支；分類與搜尋
- 月度收入、支出、結餘、儲蓄率；最近六個月趨勢；支出類別
- 本機資料儲存、JSON 備份與還原、CSV 明細匯出
- Apps Script 向 Google Sheets 上傳／下載（手動同步）

## 1. 建立 Google Sheets

1. 在 Google 雲端硬碟新增一份空白試算表，命名「家庭記帳」。
2. 從網址 `https://docs.google.com/spreadsheets/d/【這一段】/edit` 取得試算表 ID。
3. 選「擴充功能 → Apps Script」，將 `apps-script/Code.gs` 全部貼到程式編輯器並儲存。
4. Apps Script「專案設定 → 指令碼屬性」新增：
   - `SPREADSHEET_ID`：剛才的試算表 ID。
   - `ACCESS_TOKEN`：自己用密碼管理器產生至少 24 字元的高強度隨機字串（建議 48 字元以上）。
5. 「部署 → 新增部署作業 → 類型：網頁應用程式」；「執行身分：我」；「誰可以存取：所有人」；完成授權後複製 `/exec` 網址。
6. 進入網站「同步設定」，填入 `/exec` 網址與 `ACCESS_TOKEN`，按「儲存設定」，再按「上傳本機資料」。
7. 登入 Google Sheets 確認出現 `Records` 分頁與資料，再試一次「從 Google Sheets 讀取」。

**重要安全提醒**：上述部署的 Apps Script 網址對網際網路開放，以自訂存取金鑰驗證，適合個人／家庭低風險用途，並非正式的使用者登入系統。請不要把金鑰提交到 GitHub、傳給他人或在公用裝置輸入；金鑰保存在該瀏覽器的 localStorage。經由網址參數傳送的讀取金鑰可能出現在瀏覽器或伺服器存取紀錄中。若要正式多人登入、細分權限或存放敏感財務資料，建議改用有完善身分驗證的後端。

## 2. 發布到 GitHub Pages

1. 在 GitHub 建立**新的 Repository**，例如 `family-ledger`。請勿將發票 CSV、備份 JSON、Sheets ID 或存取金鑰放進 repository。
2. 將 `dist/index.html` 複製成 repository **根目錄**的 `index.html` 並提交。
3. 進入「Settings → Pages」，Source 選「Deploy from a branch」，分支選 `main`，資料夾選 `/(root)`，儲存。
4. 等待 GitHub Pages 顯示網站網址，使用 iPhone Safari 開啟。也可以「分享 → 加入主畫面」。

GitHub Pages 通常是公開網頁；即使網站只想給家庭使用，別人仍可能看見前端程式。此網站**不把任何真實交易資料放在 HTML 內**。

## 3. 日常操作

1. 從 Invoice App 下載 CSV。
2. 手機開啟網站 →「收支明細」→「匯入 Invoice CSV」。
3. 檢查金額與自動分類，必要時編輯。
4. 切到「同步設定」→「上傳本機資料」。
5. 其他裝置先按「從 Google Sheets 讀取」，再開始編輯。**目前不是即時同步**，不同裝置同時編輯可能由最後上傳者覆寫相同 ID。

## 資料規則與限制

- 每張發票統計一次「總計」，不把每個品項重複計為支出；商品明細仍保留。
- 發票 ID 為 `inv:發票號碼`，手動收支 ID 為 `manual:UUID`；匯入相同發票不會重複新增。
- 信用卡刷卡消費記作支出後，信用卡帳單繳款不可再記第二次支出。貸款的本金、利息、帳戶轉帳若要做完整資產負債報表，需另增會計分類。目前是現金流記帳原型。
- **手動同步為「新增／更新」合併**。刪除本機紀錄不會刪除 Sheets 的遠端紀錄；再次下載會恢復該筆。若需跨裝置刪除，應增加 tombstone／同步刪除機制。
- 自動店家分類為簡單規則，不保證正確，首次匯入需人工確認。
- 第一次開啟沒有示意假數據，趨勢依實際資料產生。
- 本機使用 localStorage；Safari 清除網站資料後需從 Sheets 取回或還原備份。

## 本機預覽

直接開啟 `dist/index.html` 即可測試本機記帳，或使用本機靜態伺服器。無需 npm、編譯或第三方 JavaScript 套件。
