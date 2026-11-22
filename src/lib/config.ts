// Central settings. Change URLs here only.

export const SITE = 'https://mudramonk.com';
export const WP_API = `${SITE}/wp-json/wp/v2`;
export const LOGO_URL = `${SITE}/wp-content/uploads/2026/11/mudra-monk-icon.png`; // official site icon
export const APP_API = `${SITE}/wp-json/mudramonk-app/v1`; // from the mudramonk-app-api plugin

// Same files the website reads (updated by the GitHub Action every 10 min on trading days)
const DATA = 'https://raw.githubusercontent.com/mudramonkk-sudo/MudraMonk-Data/main';
export const PRICES_URL = `${DATA}/prices.json`;
export const STOCKS_URL = `${DATA}/stocks.json`;
export const HISTORY_URL = `${DATA}/history.json`; // index chart data (1D + daily closes)

// WordPress category IDs on mudramonk.com
export const CATEGORIES = [
  { id: 0, name: 'All' },
  { id: 25, name: 'Stock Analysis' },
  { id: 18, name: 'Market' },
  { id: 19, name: 'IPO' },
  { id: 20, name: 'Mutual Fund' },
  { id: 21, name: 'Commodity' },
  { id: 22, name: 'Learn' },
] as const;
export const CAT = { analysis: 25, market: 18, ipo: 19, mf: 20, commodity: 21, learn: 22 };

// Website pages shown inside the app (slug = part after mudramonk.com/)
export const PAGES = {
  ipo: 'ipo',
  unlisted: 'unlisted-shares',
  about: 'about-us',
  contact: 'contact-us',
  privacy: 'privacy-policy',
};

// Sign-up / password reset stay on the website's own pages (email verification lives there)
export const SIGNUP_URL = `${SITE}/#mm-login`;
export const RESET_URL = `${SITE}/#mm-login`;

export const SOCIAL = {
  youtube: 'https://youtube.com/@mudramonk',
  instagram: 'https://instagram.com/mudra.monk',
  x: 'https://x.com/Mudramonk',
  email: 'info@mudramonk.com',
};

export const DISCLAIMER =
  'Mudra Monk is an independent financial information and educational platform. It is not a SEBI-registered investment adviser or research analyst. Nothing here is a buy or sell recommendation. Market prices are delayed.';
