const { google } = require('googleapis');

let sheetsAPI = null;

/**
 * Initializes the Google Sheets API client
 */
function getSheetsAPI() {
  if (sheetsAPI) return sheetsAPI;

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsAPI = google.sheets({ version: 'v4', auth });
  return sheetsAPI;
}

/**
 * Ensures the given tab (sheet) exists in the spreadsheet. If not, it creates it.
 */
async function ensureSheetExists(spreadsheetId, sheetName) {
  const sheets = getSheetsAPI();
  
  // Get spreadsheet info
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = response.data.sheets.map(s => s.properties.title);

  if (!existingSheets.includes(sheetName)) {
    console.log(`[Google Sheets] Sheet "${sheetName}" does not exist. Creating it...`);
    
    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }
        ]
      }
    });

    // Add headers since it's a new sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:D1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Date', 'Product Name', 'Quantity', 'Action Type']]
      }
    });
    
    console.log(`[Google Sheets] Created sheet "${sheetName}" and added headers.`);
  }
}

/**
 * Saves the parsed data into the appropriate Google Sheet
 * @param {object} parsedData - The JSON output from Gemini
 */
async function saveToSheet(parsedData) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not defined in .env');
    }

    const sheets = getSheetsAPI();
    
    // Determine the target sheet based on action
    let sheetName = '';
    if (parsedData.action_type === 'sold') {
      sheetName = 'Daily Sales';
    } else if (['restock', 'update'].includes(parsedData.action_type)) {
      sheetName = 'Inventory';
    } else {
      // Fallback
      sheetName = 'Uncategorized';
    }

    // Ensure the sheet tab exists
    await ensureSheetExists(spreadsheetId, sheetName);

    // Append the row
    const rowData = [
      parsedData.date,
      parsedData.product_name,
      parsedData.quantity,
      parsedData.action_type
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData]
      }
    });

    console.log(`[Google Sheets] Successfully appended row to "${sheetName}":`, rowData);
    return true;
  } catch (error) {
    console.error('[Google Sheets] Error saving to sheet:', error.message);
    return false;
  }
}

module.exports = {
  saveToSheet
};
