/* VaiCar driver-only Apps Script adapter scaffold.
 * Use only with a dedicated TEST spreadsheet until authentication and admin authorization
 * have been implemented and reviewed. Do not put credentials or secrets in this file.
 */
const DRIVER_COLUMNS = ['uid','name','email','whatsapp','cpf','birthDate','vehicleType','vehicleBrand','vehicleModel','vehicleYear','vehicleColor','vehiclePlate','operatingZonesJson','servicesOfferedJson','approvalStatus','rejectionReason','isOnline','createdAt','updatedAt'];

function doGet() {
  return output_({ success: true, service: 'vaicar-driver-adapter', status: 'scaffold-only' });
}

function doPost(e) {
  // Deliberately disabled until server-side authentication and authorization are reviewed.
  return output_({ success: false, error: 'Integração ainda não ativada. Configure e valide a autenticação antes de habilitar ações.' });
}

function getDriverSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('VAICAR_SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('Configure VAICAR_SPREADSHEET_ID nas propriedades do script.');
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName('Drivers');
  if (!sheet) sheet = spreadsheet.insertSheet('Drivers');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, DRIVER_COLUMNS.length).setValues([DRIVER_COLUMNS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
