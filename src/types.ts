export type TCandle = {
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
  datetime: number
}

export type TPriceHistoryResponse = {
  candles: TCandle[]
}

export type TSingleQuote = {
  [x: string]: {
    symbol: string,
    quote: {
      bidPrice: number,
      tradeTime: number,
      lastPrice: number,
    }
  }
}

export type TOption = {
  description: string,
  bid: number,
  ask: number,
  last: number,
  strikePrice: number,
  expirationDate: string,
  daysToExpiration: number,
  inTheMoney: boolean,
  totalVolume: number,
  volatility: number
}

export type TStrikeOptionMap = Record<string, TOption[]>;

export type TExpDateStrikeOptionMap = Record<string, TStrikeOptionMap>;

export type TOptionChain = {
  symbol: string,
  callExpDateMap: TExpDateStrikeOptionMap,
  putExpDateMap: TExpDateStrikeOptionMap
}