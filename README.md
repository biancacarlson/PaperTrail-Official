# PaperTrail
A mobile-first tool for turning receipts, invoices and other freelance expense documents into clean, usable records.

PaperTrail runs in your browser. Upload a receipt, invoice, screenshot or photo, review the fields, and copy the finished record into an ongoing Google Doc.

## What it does
- Reads uploaded receipts and invoices and fills in key fields: date, business or client, location, hours, and amount
- Purchases: the date is taken from the top right of the receipt when one is printed there, the store's city and state are filled in when the receipt shows them, and the category is guessed from the items (gloves, tools and safety items are Gear; consumables are Supplies). Upload several screenshots at once, tap the circle on any personal item to exclude it, and the subtotal, tax and total update automatically. The receipt number is read from labels such as Receipt #, Invoice #, Order #, TRN, TR#, TC#, Check or Ref, and when a register receipt prints a bare number near the bottom (usually under the barcode, e.g. `0214 03 40317 0928 26`) with no label, that number is used as the receipt number. On Work Invoices, a lone `#1042` or `INV-2026-0042` is recognized as the invoice number too. When the receipt prints T/F flags after prices, tax is only reduced for taxable items (leaving out the eggs does not change the tax)
- Purchase PDF: redact anything personal by dragging down over it (full-width bars by default, with dots to resize), highlight what matters (date, order number, subtotal, tax and total are highlighted automatically), then tap **Save as PDF**. One file is saved: the receipt pages with the summary under the last page. It is named `[purchase date] Receipt and Summary`. Undo, Redo and Clear all marks are available while marking up (Clear all on the record can also be undone). A black bar over an item's row also leaves that item out of the subtotal, tax and total (remove the bar and it counts again). Tap words on the receipt to pick them (they turn amber), then choose a field in the bar at the bottom and tap **Add**; text under a black bar can't be picked. Redactions are burned into the image, so they can't be undone from the saved file. **Copy Receipt Image** puts the marked-up receipt on the clipboard to paste into a doc.
- Lets you review and edit every field before copying
- **Save record** files the record in the **Saved** tab: Expenses in one list, Work invoices in the other. Expenses can be filtered by category (Gear only, Meals only, ...) and sorted by date (default, newest first) or by cost, high to low or low to high
- Totals regular and overtime hours
- Calculates wear and tear from the IRS business mileage rate for the job date
- Calculates the Net 30 payout date from the event end date

## Mileage
PaperTrail does not look up driving distance. Tap **Search in Safari** or **Search in Chrome** to open a Google search in a separate tab, then type the round-trip miles into **Round-trip miles**.

IRS business rate used for wear and tear:
- Jan 1 - Jun 30, 2026: $0.725/mile
- Jul 1 - Dec 31, 2026: $0.76/mile

## Privacy
- Your photo or PDF is read on your phone and is not uploaded to a server.
- The reading tools (OCR and PDF) load from public servers (cdnjs, jsDelivr).
- The "Identify unclear items from their photos" feature downloads an image model once (from jsDelivr and Hugging Face) and runs it on your phone. Your receipt images are not sent anywhere.
- The job address is sent to Google only when you tap a search button.
- Only the one passcode built into this app is accepted; it can't be set or changed from the site. After 3 wrong attempts the app locks on that device until the browser's site data is cleared. It is a screen lock in the browser, so the site address itself is still public. Nothing is stored on a server. Records you tap Save record on are kept on this phone only, encrypted (AES-GCM, key derived from the passcode) in the browser's IndexedDB. Receipt images are never stored, only the text fields. Settings > Delete all saved records removes them. If the passcode built into the app is ever changed, previously saved records can no longer be opened.

## Deploy
1. Upload the project files to your GitHub repo.
2. Settings > Pages > Deploy from a branch.
3. Branch `main`, folder `/docs`, then Save.
4. Open the Pages URL once it finishes deploying.

## Important
PaperTrail is a recordkeeping tool, not tax, accounting or legal advice, and it does not guarantee accuracy. Read the full [DISCLAIMER](DISCLAIMER.md). IRS mileage rates are built into the code and must be checked each year against irs.gov.

## License
MIT, see `LICENSE`. The software is provided as is, without warranty.
