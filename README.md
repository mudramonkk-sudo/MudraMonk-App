# Mudra Monk – Mobile App (Android + iOS)

One codebase (Expo / React Native). It shows **the same content as mudramonk.com**:

| In the app | Where it comes from |
|---|---|
| Nifty, Sensex, Bank Nifty, gainers / losers / most active | `MudraMonk-Data` GitHub repo (`prices.json`) – same file the website uses |
| Stock search (2,700+ NSE stocks), price, open/high/low, volume | `MudraMonk-Data` (`stocks.json`) |
| Stock chart, RSI, MACD, technicals, financials, company profile | TradingView widgets – same ones as the website's Stock Search page |
| Stock Analysis, Market news, IPO, Mutual Fund, Commodity, Learn posts | WordPress posts (`/wp-json/wp/v2/posts`) – post on the site, it shows in the app |
| IPO page, Unlisted Shares, About, Contact, Privacy | The website pages themselves, opened inside the app |
| SIP & Lumpsum calculator | Built into the app |
| Login, watchlist sync | `wordpress-plugin/mudramonk-app-api` (install on the site) |

**Admin panel = your WordPress dashboard.** Publish there → it appears on the website and in the app.

## 1. Install the WordPress plugin (one time)
1. Zip the folder `wordpress-plugin/mudramonk-app-api` (or use the ready zip).
2. WordPress → Plugins → Add New → Upload Plugin → Activate.
3. If your sign-up stores "email verified" in user meta, put that key in `MM_APP_VERIFIED_META` (top of the plugin file).

## 2. Check settings
Open `src/lib/config.ts` and confirm the page slugs (`ipo`, `about-us`, `contact-us`, `privacy-policy`) and the sign-up link match the website.

## 3. Run on your phone
```bash
npm install
npx expo start
```
Scan the QR with the **Expo Go** app.

## 4. Make the Play Store / App Store build
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android   # .aab for Play Store
npx eas-cli@latest build --platform ios       # needs an Apple Developer account
```
Before publishing: replace `assets/icon.png`, `assets/splash-icon.png` and the Android icon files with the official Mudra Monk logo.

## Notes
- All prices are **delayed** and labelled so in the app.
- The SEBI disclaimer is on every screen with market data or analysis.
- Code: `src/app` = screens, `src/lib` = data + login, `src/components` = shared UI.
