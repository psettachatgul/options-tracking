import { auth } from './auth';
import { getPriceHistory, getYield10Yr, trackSymbols } from './quotes'
import { setupGoogleAuth } from './sheets';

export const track = () => {
  setupGoogleAuth();

  if (!auth.access_token) return;

  setTimeout(() => {
    getPriceHistory(['$TNX']);
  }, 2500);

  getYield10Yr(['SPY', 'GME']);
  trackSymbols(['SPY', 'GME']);
}