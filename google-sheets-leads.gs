// ================================================================
// FreeYou — Lead Capture to Google Sheets
// Google Apps Script Web App
//
// SETUP INSTRUCTIONS:
// 1. Go to: https://script.google.com → New Project
// 2. Paste this entire file → Save
// 3. Click "Deploy" → "New deployment" → Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Click Deploy → Authorise → Copy the Web App URL
// 5. Paste that URL into landing-v2.html where it says PASTE_YOUR_SCRIPT_URL_HERE
// 6. Create a Google Sheet named "FreeYou Leads" (or any name you like)
//    and paste its Spreadsheet ID into SHEET_ID below
// ================================================================

const SHEET_ID   = 'PASTE_YOUR_SPREADSHEET_ID_HERE'; // From the sheet URL: /d/XXXX/edit
const SHEET_NAME = 'Leads'; // Tab name inside the sheet

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
                   || SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone',
        'Skill', 'Experience', 'City', 'LinkedIn', 'Message', 'Form Source'
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#0069d9').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}),
      data.firstName  || data.name || '',
      data.lastName   || '',
      data.email      || '',
      data.phone      || '',
      data.skill      || '',
      data.experience || '',
      data.city       || '',
      data.linkedin   || '',
      data.message    || '',
      data.source     || 'website'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test GET endpoint — visit the Web App URL in browser to confirm it's live
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'FreeYou lead sheet is live ✅' }))
    .setMimeType(ContentService.MimeType.JSON);
}
