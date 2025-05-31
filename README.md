Trading Bot Core: Technical Documentation
This document provides a detailed technical overview of the trading-bot-core repository—a Node.js-based infrastructure for an advanced cryptocurrency trading bot integrated with the Xeggex exchange. It covers architecture, functionality, configuration, usage, and key implementation details, including input/output examples.

Table of Contents

Overview
Features
Technical Indicators
Architecture
Prerequisites
Installation
Configuration
Usage
API Endpoints
Core Functions
Error Handling
Testing
Project Structure
Dependencies
Security Considerations
Contributing
License


Overview
The trading-bot-core is a Node.js application designed as the backbone for a cryptocurrency trading bot. It connects to the Xeggex exchange API, performs real-time technical analysis, and provides a RESTful API for interaction.

Repository: GitHub  
Version: 2.0.0  
Author: HTMauney  
License: ISC


Features

Real-time Data: Collects OHLCV data from Xeggex with rate limiting.  
Technical Analysis: Implements 11 standard indicators.  
RESTful API: Built with Express.js for data and trade access.  
Event-driven: Uses event emitters for real-time updates.  
Logging: Configurable logging with Winston to logs/.  
Paper Trading: Simulates trades risk-free.  
Testing: Includes scripts for API, data, and strategy validation.


Technical Indicators
The bot supports these configurable indicators:



Indicator
Purpose



RSI
Identifies overbought (>70) or oversold (<30).


MACD
Tracks trend/momentum via EMA differences.


Bollinger Bands
Measures volatility with SMA and deviations.


Moving Average Crossover
Signals trend shifts with short/long MAs.


Volume Analysis
Confirms trends with volume data.


Stochastic Oscillator
Predicts reversals via price range comparison.


Williams %R
Detects overbought/oversold levels.


Ichimoku Cloud
Visualizes support, resistance, and trends.


ADX
Gauges trend strength (>25 = strong).


CCI
Spots cyclical price trends.


Parabolic SAR
Marks potential price reversal points.



Architecture
The bot uses a modular, event-driven design:

Data Collection: Fetches market data via got (scheduled or WebSocket).  
Technical Analysis: Processes data, cached in data/cache/ or data/models/.  
API Layer: Express.js serves RESTful endpoints.  
Trading Engine: Executes trades based on TRADING_ENABLED and PAPER_TRADING.  
Logging: Winston logs to logs/ for monitoring.


Prerequisites

Node.js: ≥ 16.0.0  
npm: ≥ 8.0.0  
Xeggex API Credentials: From Xeggex.  
Code Editor: E.g., VS Code.  
Optional: nodemon (dev dependency).


Installation

Clone the Repository:  
git clone https://github.com/makoshark2001/trading-bot-core.git
cd trading-bot-core


Install Dependencies:  
npm install


Set Up Environment:  

Copy .env.example to .env:  cp .env.example .env


Edit .env with your Xeggex API keys and settings.


Start the Bot:  

Production: npm start  
Development: npm run dev  
Windows: run.bat




Configuration
Configure via .env (loaded with dotenv). Example:
X_API=your_xeggex_api_key_here
X_SECRET=your_xeggex_api_secret_here
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=info
TRADING_ENABLED=false
PAPER_TRADING=true
MAX_POSITIONS=3

Options



Variable
Description
Type
Default



X_API
Xeggex API key
String
Required


X_SECRET
Xeggex API secret
String
Required


NODE_ENV
Mode (development/production)
String
development


PORT
Server port
Number
3000


HOST
Server host
String
localhost


LOG_LEVEL
Logging level
String
info


TRADING_ENABLED
Enable live trading
Boolean
false


PAPER_TRADING
Enable paper trading
Boolean
true


MAX_POSITIONS
Max open positions
Number
3



Usage

Start the Bot:  

Production: npm start  
Development: npm run dev  
Windows: run.bat


Access API:  

Base URL: http://localhost:3000 (adjustable via .env).  
Use Postman or curl for requests.


Paper Trading:  

Set PAPER_TRADING=true in .env.  
Logs trades to data/cache/.


Monitor Logs:  

Check logs/ for Winston logs (e.g., Server started on http://localhost:3000).




API Endpoints
GET /api/market

Purpose: Fetches real-time market data.  
Response:  [
  {"symbol": "BTC/USDT", "lastPrice": 65175.20, "volume": 120.45, "timestamp": "2025-05-31T18:14:00Z"},
  {"symbol": "ETH/USDT", "lastPrice": 3200.50, "volume": 450.30, "timestamp": "2025-05-31T18:14:00Z"}
]


Request: curl http://localhost:3000/api/market

GET /api/indicators/:symbol

Purpose: Returns indicator values for a trading pair.  
Parameter: :symbol (e.g., BTC/USDT)  
Response:  {
  "symbol": "BTC/USDT",
  "rsi": 65.43,
  "macd": {"macd": 150.25, "signal": 120.10, "histogram": 30.15},
  "bollinger": {"upper": 65500.00, "middle": 65000.50, "lower": 64500.00},
  "timestamp": "2025-05-31T18:14:00Z"
}


Request: curl http://localhost:3000/api/indicators/BTC/USDT

POST /api/trade

Purpose: Executes a trade (live or paper).  
Request Body:  {"symbol": "BTC/USDT", "side": "buy", "amount": 0.01, "price": 65100.00}


Response:  {
  "id": "trade_12345",
  "symbol": "BTC/USDT",
  "side": "buy",
  "amount": 0.01,
  "price": 65100.00,
  "status": "filled",
  "timestamp": "2025-05-31T18:14:00Z"
}


Request:  curl -X POST http://localhost:3000/api/trade -H "Content-Type: application/json" -d '{"symbol":"BTC/USDT","side":"buy","amount":0.01,"price":65100.00}'




Core Functions
fetchMarketData(symbol, timeframe)

Purpose: Fetches OHLCV data from Xeggex.  
Parameters: symbol (e.g., BTC/USDT), timeframe (e.g., 1h)  
Returns: Array of OHLCV objects.  
Example:  const data = await fetchMarketData('BTC/USDT', '1h');
// Output: [{"timestamp": "2025-05-31T18:00:00Z", "open": 65000.50, ...}, ...]



calculateRSI(prices, period)

Purpose: Computes RSI (0-100).  
Parameters: prices (array), period (default: 14)  
Returns: RSI value.  
Example:  const rsi = calculateRSI([65000.50, 65150.30, ...], 14);
// Output: 65.43



calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod)

Purpose: Computes MACD components.  
Parameters: prices (array), fastPeriod (12), slowPeriod (26), signalPeriod (9)  
Returns: {macd, signal, histogram}  
Example:  const macd = calculateMACD([65000.50, ...], 12, 26, 9);
// Output: {"macd": 150.25, "signal": 120.10, "histogram": 30.15}



executeTrade(symbol, side, amount, price)

Purpose: Places a trade order.  
Parameters: symbol, side (buy/sell), amount, price  
Returns: Trade confirmation.  
Example:  const trade = await executeTrade('BTC/USDT', 'buy', 0.01, 65100.00);
// Output: {"id": "trade_12345", ...}



managePositions(symbol, maxPositions)

Purpose: Limits open positions.  
Parameters: symbol, maxPositions (from .env)  
Returns: Array of position objects.  
Example:  const positions = managePositions('BTC/USDT', 3);
// Output: [{"id": "pos_123", ...}]




Error Handling

API Errors: Logged (HTTP 500).  
Trade Errors: Invalid params return HTTP 400.  
Data Errors: Falls back to data/cache/.  
Logging: Errors saved to logs/.


Testing
Run tests from scripts/:

npm run test:setup – Sets up test environment.  
npm run test:api – Tests API connectivity.  
npm run test:data – Validates data collection.  
npm run test:strategies – Checks indicators/strategies.  
npm run test:all – Runs all tests.

Note: Full test suite pending.

Project Structure

data/ – Models and cache.  
logs/ – Log files.  
scripts/ – Test/utility scripts.  
src/ – Source code (e.g., main.js).  
.env – Configuration.


Dependencies

express (^4.18.2) – API framework.  
got (^11.8.6) – HTTP client.  
winston (^3.11.0) – Logging.  
dotenv (^16.3.1) – Env variables.  
nodemon (^3.0.2) – Dev tool.


Security Considerations

Credentials: Keep X_API/X_SECRET in .env.  
Rate Limits: Respect Xeggex API limits.  
Paper Trading: Test with PAPER_TRADING=true.  
Logging: Avoid sensitive data in logs.


Contributing

Fork repo.  
Branch: git checkout -b feature/your-feature.  
Commit: git commit -m "Add feature".  
Push: git push origin feature/your-feature.  
Submit PR.


License
ISC License. See LICENSE.
