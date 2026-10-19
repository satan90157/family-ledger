/**
 * 家計簿 Google Sheets backend (Google Apps Script, V8).
 * Script Properties:
 *   SPREADSHEET_ID = Google 試算表 ID
 *   ACCESS_TOKEN   = 自行產生的長隨機金鑰
 * Deploy: Web app, execute as Me, access Anyone.
 * WARNING: This bearer-token design is intended for personal use only.
 */
const SHEET_NAME = 'Records';
const HEADERS = ['ID', 'Date', 'Type', 'Merchant', 'Amount', 'Category', 'Invoice', 'Note', 'Source', 'JSON'];

function config_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const token = props.getProperty('ACCESS_TOKEN');
  if (!spreadsheetId || !token || token.length < 24) throw new Error('請先設定 SPREADSHEET_ID 與至少 24 字元的 ACCESS_TOKEN');
  return { spreadsheetId, token };
}

function authorized_(input) {
  const expected = config_().token;
  const supplied = String(input || '');
  if (supplied.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0;
}

function sheet_() {
  const book = SpreadsheetApp.openById(config_().spreadsheetId);
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getRecords_() {
  const sheet = sheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 10, last - 1, 1).getValues()
    .filter(row => row[0] !== '')
    .map(row => JSON.parse(row[0]));
}

function validate_(r) {
  if (!r || typeof r !== 'object') throw new Error('紀錄格式不正確');
  if (typeof r.id !== 'string' || !/^(inv:|manual:)[\w:.-]{1,120}$/.test(r.id)) throw new Error('紀錄 ID 不正確');
  if (typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error('日期格式不正確');
  if (!['income', 'expense'].includes(r.type)) throw new Error('收支類型不正確');
  if (typeof r.merchant !== 'string' || r.merchant.length > 120) throw new Error('店家名稱不正確');
  if (!Number.isFinite(r.amount) || r.amount < 0 || r.amount > 1000000000) throw new Error('金額不正確');
  if (JSON.stringify(r).length > 16000) throw new Error('單筆資料過大');
  return r;
}

function rowOf_(r) {
  return [r.id, r.date, r.type, r.merchant, r.amount, String(r.category || ''), String(r.invoice || ''), String(r.note || ''), String(r.source || ''), JSON.stringify(r)];
}

function upsert_(incoming) {
  if (!Array.isArray(incoming) || incoming.length > 3000) throw new Error('單次最多 3000 筆');
  incoming.forEach(validate_);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('同步忙碌，請稍後重試');
  try {
    const sheet = sheet_();
    const existing = getRecords_();
    const map = new Map(existing.map(r => [r.id, r]));
    incoming.forEach(r => map.set(r.id, r));
    const rows = [...map.values()].map(rowOf_);
    // Full authoritative rewrite of the Records worksheet. Never edit this worksheet manually.
    const oldCount = Math.max(0, sheet.getLastRow() - 1);
    if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    if (oldCount > rows.length) sheet.getRange(rows.length + 2, 1, oldCount - rows.length, HEADERS.length).clearContent();
    return { count: incoming.length, total: rows.length };
  } finally { lock.releaseLock(); }
}

/** v1.6: each write only touches changed IDs; _rev is a server-owned optimistic version. */
function applyChanges_(changes) {
  if (!Array.isArray(changes) || changes.length > 100) throw new Error('單次最多同步 100 筆變更');
  changes.forEach(validate_);
  const ids = changes.map(r => r.id);
  if (new Set(ids).size !== ids.length) throw new Error('同一批次有重複 ID');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('同步忙碌，請稍後重試');
  try {
    const sheet = sheet_();
    const existing = getRecords_();
    const rowById = new Map(existing.map((r, i) => [r.id, {record:r, row:i+2}]));
    const conflicts = [], accepted = [];
    for (const record of changes) {
      const prev = rowById.get(record.id);
      const serverRev = Number(prev?.record._rev || 0);
      const clientRev = Number(record._rev || 0);
      if (!Number.isSafeInteger(clientRev) || clientRev < 0 || clientRev !== serverRev) {
        conflicts.push(record.id);
        continue;
      }
      const saved = {...record, _rev:serverRev+1};
      const row = prev ? prev.row : sheet.getLastRow()+1;
      sheet.getRange(row, 1, 1, HEADERS.length).setValues([rowOf_(saved)]);
      rowById.set(saved.id,{record:saved,row});
      accepted.push(saved);
    }
    return {count:accepted.length, accepted, conflicts};
  } finally {lock.releaseLock();}
}

function doGet(e) {
  const p = e && e.parameter || {};
  const callback = String(p.callback || '');
  if (!/^ledgerCallback[a-zA-Z0-9]{1,120}$/.test(callback)) return ContentService.createTextOutput('Invalid callback');
  let result;
  try {
    if (!authorized_(p.token)) throw new Error('存取金鑰錯誤');
    if (p.action !== 'list') throw new Error('無效的操作');
    result = { ok: true, records: getRecords_() };
  } catch (err) { result = { ok: false, error: String(err.message || err) }; }
  // Do not allow user records to break out of a script element.
  const json = JSON.stringify(result).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const p = e && e.parameter || {};
  const nonce = String(p.nonce || '').slice(0, 120);
  let response;
  try {
    if (!authorized_(p.token)) throw new Error('存取金鑰錯誤');
    const input = JSON.parse(p.payload || '{}');
    if (p.action === 'delta') response = { ok: true, ...applyChanges_(input.records) };
    else if (p.action === 'save') response = { ok: true, ...upsert_(input.records) };
    else throw new Error('無效的操作');
  } catch (err) { response = { ok: false, error: String(err.message || err) }; }
  const data = JSON.stringify({ ledgerNonce: nonce, ...response }).replace(/</g, '\\u003c');
  const html = '<!doctype html><html><body><script>parent.postMessage(' + data + ',"*");<\/script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
