import { sheetQuery } from 'sheetquery';

const getSheets = () => SpreadsheetApp.getActive().getSheets();

const getActiveSheetName = () => SpreadsheetApp.getActive().getSheetName();

export const getSheetsData = () => {
  const activeSheetName = getActiveSheetName();
  return getSheets().map((sheet, index) => {
    const name = sheet.getName();
    return {
      name,
      index,
      isActive: name === activeSheetName,
    };
  });
};

export const addSheet = (sheetTitle) => {
  SpreadsheetApp.getActive().insertSheet(sheetTitle);
  return getSheetsData();
};

export const deleteSheet = (sheetIndex) => {
  const sheets = getSheets();
  SpreadsheetApp.getActive().deleteSheet(sheets[sheetIndex]);
  return getSheetsData();
};

export const setActiveSheet = (sheetName) => {
  SpreadsheetApp.getActive().getSheetByName(sheetName).activate();
  return getSheetsData();
};

export const log = (...args) => {
  const sheet = SpreadsheetApp.getActive().getSheetByName('紀錄檔')
  sheet.appendRow(Array.prototype.concat(new Date(), args));
}

export const getConfig = (key) => {
  const query = sheetQuery(SpreadsheetApp.getActiveSpreadsheet()).from('設定檔');
  let result = query.where((row) => row.key == key).getRows();
  if (!result || result.length<1) {
    return '';
  }
  return result[0].val;
}

export const setConfig = (key, val) => {
  const query = sheetQuery(SpreadsheetApp.getActiveSpreadsheet()).from('設定檔');
  query.where((row) => row.key == key).updateRows((row) => {
    row.val = val;
  });
}
