# Sproutfolio

An investing app built with plocks and Expo. The home screen charts a demo portfolio of stocks and crypto (area chart, allocation donut, sparkline rows, top movers). Each stock or coin opens its own page with a scrubbable line or candlestick price chart (1D to 5Y), your position and returns, company or coin profile, key statistics, 52-week range, analyst ratings and price targets, earnings and revenue charts, news, and "people also own". Search covers stocks, crypto, and lists, with a sector-performance heatmap; the account tab charts dividend income. Company logos come from `@plocks/brands`. Orders are simulated: whole shares for stocks, fractional amounts for crypto. Positions, cash, watchlist, and activity are saved with AsyncStorage. All prices and statistics are fictional sample data generated on the device; no account, brokerage connection, network request, or real trade is involved.

Run from the plocks root:

```bash
npm install
npm run web -w @plocks/sproutfolio
```
