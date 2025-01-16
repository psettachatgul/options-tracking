import axios from 'axios';
import { TOptionChain, TPriceHistoryResponse, TSingleQuote } from './types';
import { setSpreadsheetData } from './sheets';
import get from 'lodash/get';
import { addDays, format } from 'date-fns';
import { auth } from './auth';
import { blackScholesParams } from './black-scholes-params';
import { BlackScholes } from '@uqee/black-scholes';
import { toZonedTime } from 'date-fns-tz'

const interval = 10000;

const blackScholes = new BlackScholes();

export const trackSymbol = (symbol: string) => {

  getPriceHistory(symbol);

  getLastBid(symbol);

  getOptionsQuotes(symbol, 'CALL');

  getOptionsQuotes(symbol, 'PUT');
};

export const getPriceHistory = (symbol: string) => {

  return setInterval(async () => {
    const access_token = auth.access_token;

    const { data: { candles = [] } = {} } = await axios.get<TPriceHistoryResponse>(
      'https://api.schwabapi.com/marketdata/v1/pricehistory',
      {
        params: {
          symbol,
          periodType: 'day',
          period: 4,
          frequencyType: 'minute',
          frequency: 1,
          endDate: Date.now(),
          needExtendedHoursData: true,
          needPreviousClose: false,
        },
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const priceHistory = candles.reduce<{
      data: Array<Date | string | number>[],
      sumVolume: number,
      sumTotal: number,
      average: number
    }>(
      (_priceHistory, candle) => {
        if (candle.close !== 0) {
          _priceHistory.data.push([
            format(new Date(candle.datetime), 'yyyy-MM-dd HH:mm'),
            candle.close,
            candle.volume,
          ]);
          _priceHistory.sumVolume = _priceHistory.sumVolume + candle.volume;
          _priceHistory.sumTotal = _priceHistory.sumTotal + (candle.close * candle.volume);
          _priceHistory.average = _priceHistory.sumTotal / _priceHistory.sumVolume;
        }
        return _priceHistory;
      },
      {
        data: [['Date', 'Close', 'Volume']],
        sumVolume: 0,
        sumTotal: 0,
        average: 0
      }
    );

    const sumDiffSquared = priceHistory.data.reduce<number>(
      (_sumDiffSquared, data, index) => {
        // skip header row
        if (index === 0) return _sumDiffSquared;
        const result = _sumDiffSquared + ((Math.pow(((data[1] as number) - priceHistory.average), 2)) * (data[2] as number));
        return result;
      },
      0
    );

    const variance = sumDiffSquared / priceHistory.sumVolume;
    const standardDeviation = Math.sqrt(variance);
    const volatility = standardDeviation / priceHistory.average;
    const fudgedVolatility = volatility;

    priceHistory.data.unshift([priceHistory.average, sumDiffSquared, variance, standardDeviation, volatility, fudgedVolatility]);
    priceHistory.data.unshift(['Average Price', 'SumDiffSquared', 'Variance', 'Standard Deviation', 'Volatility', 'Fudged Volatility']);
    priceHistory.data.unshift([`Last Updated ${(new Date()).toString()}`])

    blackScholesParams.volatility = fudgedVolatility;
    setSpreadsheetData(process.env.GOOGLE_SHEET_ID!, `${symbol} Price History!A1`, priceHistory.data);

  }, interval);
};

export const getLastBid = (symbol: string) => {


  return setInterval(async () => {
    const access_token = auth.access_token;

    const { data } = await axios.get<TSingleQuote>(
      `https://api.schwabapi.com/marketdata/v1/${symbol}/quotes`,
      {
        params: {
          fields: 'quote',
        },
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const { quote } = get(data, symbol);

    const sheetData = [
      [`Last Updated ${(new Date()).toString()}`],
      ['Last Bid', quote.bidPrice],
      ['Last Bid Time', (new Date(quote.tradeTime)).toString()],
      ['Previous Close', quote.closePrice]
    ];

    blackScholesParams.lastBid = quote.bidPrice;
    setSpreadsheetData(process.env.GOOGLE_SHEET_ID!, `${symbol} Last Bid!A1`, sheetData);

  }, interval);
};

export const getOptionsQuotes = (symbol: string, contractType: 'CALL' | 'PUT') => {

  return setInterval(async () => {
    const access_token = auth.access_token;

    const { data: { callExpDateMap = {}, putExpDateMap = {} } = {} } = await axios.get<TOptionChain>(
      'https://api.schwabapi.com/marketdata/v1/chains',
      {
        params: {
          symbol,
          contractType,
          strikeCount: 7,
          includeUnderlyingQuote: false,
          fromDate: format(toZonedTime(Date.now(), 'America/New_York'), 'yyyy-MM-dd'),
          toDate: format(addDays(toZonedTime(Date.now(), 'America/New_York'), 10), 'yyyy-MM-dd')
        },
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const expDateMap = contractType === 'CALL' ? callExpDateMap : putExpDateMap;

    const sheetData = Object.values(expDateMap).reduce<Array<Date | string | number>[]>(
      (_sheetData, strikeOptionMap) => {
        const optionsAr = Object.values(strikeOptionMap);

        optionsAr.forEach((options) => {
          options.forEach((option) => {

            const blackScholesOption = blackScholes.option({
              rate: blackScholesParams.US10YrInt,
              sigma: blackScholesParams.volatility,
              strike: option.strikePrice,
              time: option.daysToExpiration / 365,
              type: contractType === 'CALL' ? 'call' : 'put',
              underlying: blackScholesParams.lastBid
            });

            _sheetData.push([
              option.expirationDate.slice(0, 10),
              option.strikePrice,
              option.bid,
              option.ask,
              option.last,
              option.totalVolume,
              option.volatility,
              option.description,
              option.daysToExpiration,
              option.inTheMoney ? 'Yes' : 'No',
              //black scholes price
              blackScholesOption.price,
              // diff
              blackScholesOption.price - option.ask
            ]);
          })
        });

        return _sheetData;
      },
      [['Expiration Date', 'Strike', 'Bid', 'Ask', 'Last', 'Volume', 'Volatility', 'Description', 'Days To Expiration', 'In The Money', 'Black Scholes Price', 'Diff']]
    );

    sheetData.unshift([`Last Updated ${(new Date()).toString()}`]);

    setSpreadsheetData(process.env.GOOGLE_SHEET_ID!, `${symbol} ${contractType}!A1`, sheetData);

  }, interval);
};

export const getYield10Yr = (symbol: string) => {

  return setInterval(async () => {
    const access_token = auth.access_token;

    const { data } = await axios.get<TSingleQuote>(
      `https://api.schwabapi.com/marketdata/v1/${encodeURIComponent(process.env.USTreasurySymbol!)}/quotes`,
      {
        params: {
          fields: 'quote',
        },
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const { quote } = get(data, process.env.USTreasurySymbol!);
    blackScholesParams.US10YrInt = (quote.lastPrice / 1000.0)

    const sheetData = [
      [`Intrest 10 Year Treasury Bond (${(new Date()).toString()})`, blackScholesParams.US10YrInt],
    ];

    setSpreadsheetData(process.env.GOOGLE_SHEET_ID!, `${symbol} Last Bid!A6`, sheetData);

  }, interval);
}