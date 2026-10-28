/**
 * VaiCar — Driver migration setup (Google Sheets + Apps Script)
 *
 * This script creates the spreadsheet structure and a private Drive folder.
 * It does NOT connect to the website or accept live registrations yet.
 * Never store passwords, session tokens, or public document links in Sheets.
 */

const VAICAR_SCHEMA = {
  Passengers: [
    'uid', 'name', 'email', 'whatsapp', 'photoFileId', 'hasCriminalRecordCheck',
    'criminalRecordFileId', 'idDocumentFileId', 'termsAccepted', 'referralCode',
    'referredByCode', 'createdAt', 'updatedAt'
  ],
  Drivers: [
    'uid', 'name', 'email', 'whatsapp', 'cpf', 'birthDate', 'photoFileId',
    'professionalCategory', 'cnhNumber', 'cnhFileId', 'crlvFileId',
    'proofOfAddressFileId', 'criminalRecordFileId', 'vehicleType',
    'vehicleBrand', 'vehicleModel', 'vehicleYear', 'vehicleColor', 'vehiclePlate',
    'operatingZonesJson', 'servicesOfferedJson', 'subscriptionPlan',
    'approvalStatus', 'rejectionReason', 'isOnline', 'createdAt', 'updatedAt'
  ],
  Config: ['key', 'value', 'description'],
  AuditLog: ['timestamp', 'actor', 'action', 'recordUid', 'result']
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('VaiCar')
    .addItem('1. Preparar abas', 'setupVaiCar')
    .addItem('2. Criar pasta privada de documentos', 'createPrivateDocumentsFolder')
    .addSeparator()
    .addItem('Verificar configuração', 'checkVaiCarSetup')
    .addToUi();
}

function setupVaiCar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra este script a partir da planilha VaiCar.');
  Object.keys(VAICAR_SCHEMA).forEach(function(name) {
    const headers = VAICAR_SCHEMA[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const lastCol = Math.max(sheet.getLastColumn(), headers.length);
    const existing = sheet.getLastRow()
      ? sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0]
      : [];
    const hasContent = existing.some(function(v) { return String(v).trim() !== ''; });
    if (hasContent) {
      headers.forEach(function(header, i) {
        if (String(existing[i] || '').trim() !== header) {
          throw new Error('Aba "' + name + '" já contém cabeçalhos diferentes. Nada foi sobrescrito.');
        }
      });
    } else {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
    sheet.setRowHeight(1, 30);
    if (sheet.getFilter()) sheet.getFilter().remove();
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), headers.length).createFilter();
  });

  const config = ss.getSheetByName('Config');
  const existingKeys = config.getLastRow() > 1
    ? config.getRange(2, 1, config.getLastRow() - 1, 1).getDisplayValues().flat()
    : [];
  const starterRows = [
    ['ENVIRONMENT', 'TEST', 'Mantenha TEST até concluir os testes.'],
    ['DRIVE_FOLDER_ID', '', 'Preenchido ao criar a pasta privada de documentos.'],
    ['APPS_SCRIPT_WEB_APP_URL', '', 'Preencher somente após implantar e revisar o endpoint.'],
    ['INTEGRATION_STATUS', 'NOT_CONNECTED', 'Ainda não conectado ao site.']
  ];
  starterRows.forEach(function(row) {
    if (existingKeys.indexOf(row[0]) === -1) config.appendRow(row);
  });

  SpreadsheetApp.getUi().alert(
    'Estrutura VaiCar criada. Nenhum cadastro real foi migrado e o site ainda não está conectado.'
  );
}

function createPrivateDocumentsFolder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra este script a partir da planilha VaiCar.');
  const config = ss.getSheetByName('Config');
  if (!config) throw new Error('Execute primeiro VaiCar → Preparar abas.');

  const row = findConfigRow_(config, 'DRIVE_FOLDER_ID');
  if (row && String(config.getRange(row, 2).getValue()).trim()) {
    const folderId = String(config.getRange(row, 2).getValue()).trim();
    const existingFolder = DriveApp.getFolderById(folderId);
    SpreadsheetApp.getUi().alert('A pasta privada já está configurada: ' + existingFolder.getName());
    return;
  }

  const folder = DriveApp.createFolder('VaiCar — Documentos de Motoristas (PRIVADO)');
  folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  if (!row) {
    config.appendRow(['DRIVE_FOLDER_ID', folder.getId(), 'Pasta privada criada pelo menu VaiCar.']);
  } else {
    config.getRange(row, 2).setValue(folder.getId());
  }
  SpreadsheetApp.getUi().alert(
    'Pasta privada criada. O ID foi salvo na aba Config. Não compartilhe a pasta publicamente.'
  );
}

function checkVaiCarSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const missing = Object.keys(VAICAR_SCHEMA).filter(function(name) {
    return !ss.getSheetByName(name);
  });
  const message = missing.length
    ? 'Faltam estas abas: ' + missing.join(', ') + '. Execute "Preparar abas".'
    : 'As abas existem. Integração do site: ainda não conectada. Use somente dados de teste.';
  SpreadsheetApp.getUi().alert('VaiCar — Verificação', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Authenticated server-to-server diagnostic endpoint.
 * Only driver.health is accepted at this stage. No registration, profile writes,
 * passenger actions, rides, deliveries, GPS, or online-state actions are handled.
 * Configure VAICAR_SHARED_SECRET in Apps Script Project Settings > Script properties.
 */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 20000) return jsonResponse_({ success: false, error: 'Invalid request.' });
    const request = JSON.parse(raw);
    const expected = PropertiesService.getScriptProperties().getProperty('VAICAR_SHARED_SECRET');
    if (!expected || !request || !constantTimeEquals_(String(request.sharedSecret || ''), expected)) {
      return jsonResponse_({ success: false, error: 'Unauthorized.' });
    }

    if (request.action === 'driver.health') {
      return jsonResponse_({ success: true, service: 'vaicar-registration-adapter', status: 'ready' });
    }

    return jsonResponse_({ success: false, error: 'Action not enabled.' });
  } catch (err) {
    return jsonResponse_({ success: false, error: 'Invalid request.' });
  }
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function constantTimeEquals_(a, b) {
  const left = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a, Utilities.Charset.UTF_8);
  const right = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b, Utilities.Charset.UTF_8);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] || 0) ^ (right[i] || 0);
  }
  return diff === 0;
}

function findConfigRow_(sheet, key) {
  if (sheet.getLastRow() < 2) return 0;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === key) return i + 2;
  }
  return 0;
}
