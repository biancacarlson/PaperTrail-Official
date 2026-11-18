# PaperTrail
A mobile-first tool that turns receipts, invoices and other freelance paperwork into clean records.

It runs in your browser. Upload a receipt, invoice, screenshot or photo, check the fields, then save a PDF or copy the record into an ongoing Google Doc.

## Quick start
1. Choose **Expense** or **Work Invoice**.
2. Add your document (or tap **Enter manually instead**).
3. Review the fields. Fix anything that looks wrong.
4. Tap **Save as PDF**, or **Save record** to keep it in the **Saved** tab.

## Expenses
**Reading the receipt**
- Fills in date, merchant, city/state, receipt number, tax, subtotal and total
- Date comes from the top right of the receipt when printed there
- Receipt number is read from labels like Receipt #, Invoice #, Order #, TRN, TR#, TC#, Check or Ref. A bare number near the bottom (e.g. under the barcode) is used when there is no label
- Category is guessed from the items: gloves, tools and safety gear are Gear; consumables are Supplies
- Upload several screenshots at once
- **Photos of paper receipts:** if the first reads leave the date, items or totals empty (or the items do not add up), the photo is flattened for shadows and curl and read again in bands. A date has to be a real, recent date. If only the subtotal is readable, one flagged line is added at that price so you can check its name

**Leaving out personal items**
- Tap the circle beside an item to exclude it. A black bar over an item's row does the same (remove the bar and it counts again)
- The **Work-related total** card then shows the subtotal, tax and total that appear in the saved PDF summary
- If the receipt prints T/F flags after prices, tax only drops for taxable items (leaving out the eggs does not change the tax)

**Purchase PDF**
- **Redact:** drag down over anything personal (full-width bars; use the dots to resize)
- **Highlight:** date, order number, subtotal, tax and total are highlighted automatically
- **Pick text:** tap words on the receipt (they turn amber), choose a field in the bottom bar, tap **Add**. Text under a black bar can't be picked
- **Undo / Redo / Clear all** work while marking up. Clear all on the record can also be undone
- **Save as PDF** saves one file: the receipt pages with the summary under the last page, named `[purchase date] Receipt and Summary`
- Redactions are burned into the image and can't be undone from the saved file
- **Copy Receipt Image** puts the marked-up receipt on the clipboard

## Work invoices
- **Adding the invoice:** upload one PDF, or select several photos or screenshots at once (up to 6 pages). Every page is read, kept and saved, and pages after the first show under the first in the preview
- Reads employer, client, job dates, location, hours and amount. Times like `7:00 AM - 11:00 AM` or per-day hour rows fill in automatically. A lone `#1042` or `INV-2026-0042` is read as the invoice number
- **Open / Closed:** worked out for you. An invoice is **Closed** when it has a printed total, the amount is more than $0 and the event is over. It is **Open** when the total is an estimate (`est.`), is $0.00 or is missing, or the event end date is still ahead. This also applies to invoices you saved earlier. The **Open / Closed switch** (under Hours & pay, and at the top of a saved invoice) overrides it, and goes back to automatic when it matches what the invoice says. Invoices you marked by hand in an older version keep that choice. Every saved work invoice shows an **Open** or **Closed** badge
- **Shifts:** one row per shift (date, start, end, hours, **Pay for this day**). A split shift is two rows on the same date. Regular and overtime hours are totaled, and saved records and PDFs show each shift plus a split-day total
- **Pay for this day:** read from that day's own total on the invoice: a "Day total" line if there is one, otherwise the amounts printed under that date, otherwise the amount on the date row. It is never worked out from an hourly rate or a share of the invoice total. You can type it yourself in the shift. When the invoice prints a $0.00 total but lists billed lines, the amount is the sum of the day totals
- **Wear and tear:** calculated from the IRS business mileage rate for the job date
- **Net 30:** payout date is the same date one month after the event end date (10/21 becomes 11/21)
- **Calendar:** two buttons under Calculated, and the same two in a saved invoice
  - **Add payout to Calendar:** one event on the payout date, with the amount in the title (e.g. `Net-30 payout $1,250.00 - Client`). The notes list amount, client, invoice #, job and end dates, location and hours
  - **Add work days to Calendar:** one event per shift, every shift on the invoice whether it is past or ahead. The title is `Work: Client @ location`, and the notes have the time range, client, employer, invoice #, location and **Est. pay for this day**. Each has alerts 2 hours and 1 day before. Adding the same invoice again updates the same events instead of creating copies. The pay line is left off a day that has no pay entered
- **Replace invoice** (in a saved invoice) swaps in the new pages and re-reads them. Hours, pay per day, amount, end date, shifts and Open / Closed update everywhere (list, summary, totals). Anything the new invoice does not contain, such as round-trip miles, stays. If the new invoice can't be read, the pages are still replaced and you are told to use **Edit**. For receipts, Replace swaps the image only
- **Editing a saved invoice:** upload the new invoice inside **Edit** and the boxes refresh from it. It is saved over the same record, not as a copy
- **Invoice viewer:** shown at full height, so dragging scrolls the page. Pinch or tap **Enlarge** to zoom; while zoomed, one finger pans. **Reset zoom** (or pinching out) goes back. Tapping a word still picks it

**Mileage:** PaperTrail does not look up distance. Tap **Search in Safari** or **Search in Chrome**, then type the result into **Round-trip miles**.

| Period | IRS rate |
|---|---|
| Jan 1 - Jun 30, 2026 | $0.725 / mile |
| Jul 1 - Dec 31, 2026 | $0.76 / mile |

## Saved tab
- **Save record** files Expenses and Work invoices in separate lists. Saving a record you opened with **Edit** updates it (it says **Changes saved**, or **No changes to save**)
- **Tabs:** **Expenses**, **Work** and **Totals**. Under them, filters sit on the left and the sort on the right
- **Filter and sort:** expenses by category chip (Gear only, Meals only, ...), and by date or cost. Work invoices by **All / Open / Closed** (with counts), and by date, location or client. Work invoices sorted by date are grouped by week (Sunday to Saturday) with the working days in each
- **Search:** tap the magnifier in the top bar. Find a record by merchant, client or receipt / invoice number. Every word must match; numbers ignore spaces, dashes and `#`. Tap ✕ to clear. If nothing matches here but something does in the other list, a button jumps there
- **Open a record:** tap a row. The window shows when it was **Saved** and **Edited**, the Open / Closed switch (work invoices), and the summary. Older records saved before time stamps existed say "Saved earlier (time not recorded)" unless the time can be recovered. Time stamps are for your reference only and are not printed on the PDF. Actions are grouped below the summary:
  - **Calendar:** Work days, Payout (work invoices)
  - **PDF:** View, Download. With invoice pages attached the PDF is `Call Sheet Invoice and Summary` (the pages, then the summary); without them it is just the one-page summary
  - **Invoice** (or **Receipt**): Crop, Replace, Remove, or Attach when there is none
  - **Edit**, and **Delete** (a small red link, so it is hard to hit by accident)
- **Totals:** expenses by category, income by client and the mileage deduction, with **This month** and **This year** side by side (the date range is shown on each card). Open and closed invoices both count. The **All / Open / Closed** tabs above Income by client narrow income and mileage. Expenses count by purchase date and income by job date. Records with no date, or dated after today, are left out and the count is shown. Invoices with no round-trip miles get no mileage deduction, and the view says how many
- **Export CSV** (Data menu): download the list you are viewing (the category chip applies). Choose all dates, one year, or a custom range. Rows are oldest first with plain numbers and ISO dates, and work invoices include a **Status** column. Undated records are left out when a date filter is on. Text starting with `=` `+` `-` `@` gets an apostrophe so spreadsheets never run it as a formula

## Menus
- **Account:** update password, update password hint, create a new recovery code, add to Home Screen, log out
- **Data:** copy records, export CSV, download backup, remembered fixes, delete all saved records
- **Sign-in screen:** forgot password, show my password hint, restore from a backup file
- **Disclaimer:** the grey link at the bottom of every page

## Safety nets
- **Duplicate warning:** a red **Already saved** notice with a **View** button appears if the record matches a saved one (same store or client and receipt/invoice number, or with no number, the same store or client, date and total). Saving a likely duplicate asks first
- **Backup reminders:** if you have records and no backup yet (or the last one is a week or more old and records changed), a bar offers **Download backup** or **Later** (snoozes 3 days). Only timestamps are stored for this. Restoring a backup resets the last-backup time to when that file was made
- **Remembered fixes:** correct a merchant spelling (say `HOME DEPO` to `Home Depot`) and PaperTrail applies it next time, with a note and an **Undo** link. Only small corrections are remembered; a completely different name is treated as a one-off. Round-trip miles are remembered per job location (typing your own number always wins). Fixes are learned when you leave the field, tap Save record or tap Copy, never from half-typed text. **Data > Remembered fixes** lists them and lets you forget one or all; saved records never change

## Privacy
- Photos and PDFs are read on your phone and never uploaded
- OCR and PDF tools load from public servers (cdnjs, jsDelivr)
- **Identify unclear items from their photos** downloads an image model once (jsDelivr, Hugging Face) and runs it on your phone. Images are not sent anywhere
- The job address goes to Google only when you tap a search button
- Accounts (email + password) are created and stored on your device; nothing goes to a server
- Saved records are encrypted (AES-GCM, key from your email and password via PBKDF2) in the browser's IndexedDB, separately per account. A saved record keeps its text fields and, if you attach them, its receipt or invoice pages, all encrypted the same way
- On sign-up you get a recovery code. With it and your email you can set a new password without losing records. Without the password or the code, records can't be opened
- **Data > Download backup** saves an encrypted file; **Restore from a backup file** on the sign-in screen loads it on any browser or the Home Screen app. Remembered fixes are included. Records do not sync between devices
- After 5 wrong passwords an account is locked for 15 minutes. That lock is a browser-side screen lock; the encryption is what protects the data
- **Data > Delete all saved records** removes everything

## Notes
- **Calculator:** the round calculator button in the corner opens a small pad for quick math while you check a job. It stores nothing
- **Updates on the Home Screen app:** each launch checks the server for a newer `app.js` and reloads once to pick it up. A copy installed before v95 needs the new files uploaded and one manual refresh to get this (force-quit and reopen after the new files are live)
- **Version badge:** shown at the bottom of the page (for example `v59`). Each release bumps these together: `PT_BUILD` (a plain number that only goes up) and `PT_LABEL` at the end of `docs/app.js`, `V` at the top of `docs/parser.js`, the four `?v=` numbers in `docs/index.html`, and the badge text there. The Home Screen app updates itself by comparing the build number. If a release skips the bump, phones may keep showing an older copy

## Deploy
1. Upload the project files to your GitHub repo
2. Settings > Pages > Deploy from a branch
3. Branch `main`, folder `/docs`, then Save
4. Open the Pages URL once it finishes deploying

## Important
PaperTrail is a recordkeeping tool, not tax, accounting or legal advice, and it does not guarantee accuracy. Read the full [DISCLAIMER](DISCLAIMER.md). IRS mileage rates are built into the code; check them each year at irs.gov.

## License
MIT, see `LICENSE`. Provided as is, without warranty.
