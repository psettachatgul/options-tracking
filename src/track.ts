import { auth } from './auth';
import { getPriceHistory, getYield10Yr, trackSymbol } from './quotes'
import { setupGoogleAuth } from './sheets';

export const track = () => {
  setupGoogleAuth();

  if (!auth.access_token) return;

  setTimeout(() => {
    getPriceHistory(process.env.USTreasurySymbol!);
  }, 2500);

  getYield10Yr('SPY');
  trackSymbol('SPY');
}