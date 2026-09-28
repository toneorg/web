# Receiving signups in a Google Sheet

The forms POST every submission as JSON to `SUBMISSIONS_WEBHOOK_URL`. The quickest
place to point it is a Google Sheet both founders can open.

1. Create a Sheet (e.g. "tone: lista de espera").
2. Extensions → Apps Script. Replace the file contents with the script below and save.
3. Deploy → New deployment → type **Web app**. Execute as **Me**, access **Anyone**.
   Copy the `/exec` URL.
4. Set it as `SUBMISSIONS_WEBHOOK_URL` in `.env.local` (dev) and in the hosting
   provider's environment variables (production). Redeploy.

Consumer signups land in the `Lista` tab, brand requests in `Marcas`. New fields add
their own column automatically.

```js
const TABS = { waitlist: "Lista", brand: "Marcas" };

// Sheets runs cells that start with = + - @ as formulas; keep them as text.
const safe = (v) =>
  typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const name = TABS[data.kind] || "Outros";
    const sheet = book.getSheetByName(name) || book.insertSheet(name);

    const header = sheet.getLastColumn()
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    Object.keys(data).forEach((k) => {
      if (!header.includes(k)) header.push(k);
    });
    sheet.getRange(1, 1, 1, header.length).setValues([header]);

    const row = header.map((k) => {
      const v = data[k];
      return safe(Array.isArray(v) ? v.join(", ") : v ?? "");
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } finally {
    lock.releaseLock();
  }
}
```

Keep the `/exec` URL private: anyone who has it can add rows. If it leaks, create a
new deployment and update the environment variable.
