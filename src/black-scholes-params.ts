import { TSymbol } from './trackingSymbols';
import { TBlackScholesParams } from './types';

export const blackScholesParams: Record<TSymbol | string, TBlackScholesParams> = {
  SPY: {
    lastBid: 0,
    volatility: 0,
    US10YrInt: 0
  },
  GME: {
    lastBid: 0,
    volatility: 0,
    US10YrInt: 0
  },
  $TNX: {
    lastBid: 0,
    volatility: 0,
    US10YrInt: 0
  }
};