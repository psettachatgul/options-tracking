import { google, sheets_v4 } from 'googleapis';
import { GaxiosError } from 'gaxios';
import get from 'lodash/get';
import isNumber from 'lodash/isNumber';
import set from 'lodash/set';
import { TSpreadsheetUpdate } from './types';

export const setupGoogleAuth = () => {

  const googleCredentials = {
    "type": "service_account",
    "project_id": "options-tracking-445716",
    'private_key_id': process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    'private_key': process.env.SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    'client_email': process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    'client_id': process.env.SERVICE_ACCOUNT_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/opt-tracking-service-account%40options-tracking-445716.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  };

  // use google to get spreadsheet data create programs
  const googleAuth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  google.options({ auth: googleAuth });

  return googleAuth;
};

export const getSpreadsheetData = async (
  spreadsheetId: string,
  range: string,
  majorDim?: string,
): Promise<unknown[]> => {
  const sheets = google.sheets({ version: 'v4' });

  return new Promise((resolve) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
      majorDimension: majorDim ?? 'ROWS',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res?.data.values;
      // only return rows where there is data in the first column
      const filledRows = rows?.filter((singleRow) => { return !!(singleRow[0]?.toString()); });
      if (filledRows?.length) {
        resolve(filledRows);
      } else {
        console.log('No data found.');
        resolve([]);
      }
    });
  });

};

const sheetIndex: Record<string, Record<string, number>> = {};

export const getSheetId = async (spreadsheetId: string, sheetName: string) => {

  const sheetId = await (async () => {
    if (sheetIndex[spreadsheetId]?.[sheetName]) return sheetIndex[spreadsheetId][sheetName];

    // get all sheetIds
    const sheets = google.sheets({ version: 'v4' });

    const spreadSheetInfo = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
    const _sheets = spreadSheetInfo.data.sheets;

    _sheets?.forEach((_sheet) => {
      if (_sheet.properties?.title && _sheet.properties?.sheetId) {
        const title = _sheet.properties.title;
        const sheetId = _sheet.properties?.sheetId;
        set(sheetIndex, `${spreadsheetId}.${title}`, sheetId);
      }
    });

    return sheetIndex[spreadsheetId][sheetName];
  })();

  return sheetId;
};

export const setSpreadsheetData = async (
  spreadsheetId: string,
  updates: TSpreadsheetUpdate[]
) => {
  const sheets = google.sheets({ version: 'v4' });



  const requests: sheets_v4.Schema$Request[] = [];
  for (const update of updates) {

    const rows: sheets_v4.Schema$RowData[] = update.values.map((rowValues) => {

      const values: sheets_v4.Schema$CellData[] = rowValues.map((cellValue) => {

        if (isNumber(cellValue)) {
          return { userEnteredValue: { numberValue: cellValue } };
        }

        return { userEnteredValue: { stringValue: cellValue as string } };
      });

      return {
        values
      }
    });

    requests.push({
      updateCells: {
        fields: 'userEnteredValue',
        rows,
        start: {
          sheetId: await getSheetId(spreadsheetId, update.sheetName),
          rowIndex: update.range.rowIndex,
          columnIndex: update.range.columnIndex
        }
      }
    });
  }

  await googleSheetsRetry({
    cb: async () => {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests
        }
      });
    },
  });

};

const maxGoogleSheetsRetry = 10;

export const googleSheetsRetry = async <T>(
  {
    cb,
    retry = 0,
    args = [],
  }:
    {
      cb: (...args: unknown[]) => Promise<T>,
      retry?: number,
      args?: unknown[],
    },
) => {

  if (retry > maxGoogleSheetsRetry) {
    console.error('Exceeded maximum number of retries for google sheets request... skipping');
    return Promise.resolve<T>(undefined as T);
  }

  try {
    return await cb(...args);
  } catch (err) {

    if (get(err, 'response.statusText') === 'Too Many Requests') {
      const gErr = err as GaxiosError;

      const delay = (retry + 12000 + Math.random() * 1000);
      console.info(`Current google sheets request: ${gErr.config.body}`);
      console.info(`Too many requests to google sheets. Going to try again in ${delay} ms`);

      return new Promise<T>((resolve) => {
        setTimeout(
          () => {
            googleSheetsRetry<T>({
              cb,
              retry: retry + 1,
              args,
            })
              .then(resolve);
          },
          delay,
        );
      });

    } else {
      throw err;
    }
  }
};
