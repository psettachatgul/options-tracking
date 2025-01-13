function ResetSheets() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName('SPY Price History'), true);
  spreadsheet.getRange('A4:B').activate();
  spreadsheet.getActiveRangeList().clear({contentsOnly: true, skipFilteredRows: true});
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName('$TNX Price History'), true);
  spreadsheet.getRange('A4:B').activate();
  spreadsheet.getActiveRangeList().clear({contentsOnly: true, skipFilteredRows: true});
};