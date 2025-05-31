Trading Bot Core: Technical Documentation
This document provides a comprehensive technical overview of the trading-bot-core repository, a Node.js-based infrastructure for an advanced cryptocurrency trading bot integrated with the Xeggex exchange (Xeggex). It details the project's architecture, functionality, configuration, usage, and implementation, including specific input/output examples for key functions. The documentation is informed by the repository's files (.env.example, package.json, .gitignore, run.bat) and inferred implementation details based on described features and dependencies.
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
The trading-bot-core is a Node.js application designed as the foundation for an advanced cryptocurrency trading bot. It integrates with the Xeggex exchange API to collect real-time market data, performs technical analysis using 11 industry-standard indicators, and exposes functionality through RESTful API endpoints. The system supports live and paper trading, with a focus on modularity, real-time processing, and robust logging.

Repository: GitHub
Version: 2.0.0
Author: HTMauney
License: ISC

Features

Real-time Data Collection: Fetches OHLCV (Open, High, Low, Close, Volume) data from Xeggex with rate limiting.
Technical Analysis Suite: Implements 11 technical indicators for market analysis.
RESTful API: Built with Express.js for accessing market data and indicators.
Event-driven Architecture: Handles real-time updates using event emitters.
Logging: Uses Winston for configurable logging to logs/ directory.
Paper Trading: Simulates trades without financial risk.
Testing Framework: Includes scripts for testing API, data collection, and strategies.

Technical Indicators
The bot implements the following indicators, each with configurable parameters:



Indicator
Description



RSI (Relative Strength Index)
Measures momentum to identify overbought (above 70) or oversold (below 30) conditions.


MACD (Moving Average Convergence Divergence)
Tracks trend and momentum using the difference between two EMAs.


Bollinger Bands
Uses a simple moving average and standard deviations to measure volatility.


Moving Average Crossover
Signals trend reversals using short and long-term moving averages.


Volume Analysis
Confirms price trends with trading volume data.


Stochastic Oscillator
Compares closing prices to price ranges to predict reversals.


Williams %R
Measures overbought/oversold levels, similar to Stochastic Oscillator.


Ichimoku Cloud
Visualizes support, resistance, and trend direction.


ADX (Average Directional Index)
Quantifies trend strength (above 25 indicates a strong trend).


CCI (Commodity Channel Index)
Identifies cyclical trends in price movements.


Parabolic SAR
Determines potential reversal points in price trends.


Architecture
The application follows a modular, event-driven architecture:

Data Collection: A module uses got to fetch market data from Xeggex, likely running on a schedule (e.g., every minute) or via WebSocket for real-time updates.
Technical Analysis: Indicator calculations are performed on collected data, stored in data/cache/ or data/models/.
API Layer: Express.js serves RESTful endpoints to expose data and handle trade requests.
Trading Engine: Manages trade execution, respecting TRADING_ENABLED and PAPER_TRADING settings.
Logging: Winston logs events to logs/ for monitoring and debugging.

Prerequisites

Node.js: >= 16.0.0
npm: >= 8.0.0
Xeggex API Credentials: Obtain from Xeggex account settings.
Code Editor: VS Code or similar.
Optional: nodemon for development (installed as a dev dependency).

Installation

Clone the Repository:
git clone https://github.com/makoshark2001/trading-bot-core.git
cd trading-bot-core


Install Dependencies:
npm install

Installs express, got, winston, dotenv, config, and nodemon.

Configure Environment Variables:

Copy .env.example to .env:cp .env.example .env


Edit .env with your Xeggex API credentials and settings (see Configuration).


Start the Application:

Production:npm start


Development (auto-restart):npm run dev


Windows:run.bat





Configuration
The .env file, loaded via dotenv, configures the application. Example from .env.example:
# API Credentials
X_API=your_xeggex_api_key_here
X_SECRET=your_xeggex_api_secret_here
# Environment
NODE_ENV=development
# Server Configuration
PORT=3000
HOST=localhost
# Logging
LOG_LEVEL=info
# Trading Configuration
TRADING_ENABLED=false
PAPER_TRADING=true
MAX_POSITIONS=3

Configuration Options



Variable
Description
Type
Default



X_API
Xeggex API key from account settings
String
Required


X_SECRET
Xeggex API secret (keep confidential)
String
Required


NODE_ENV
Environment mode (development or production)
String
development


PORT
API server port
Number
3000


HOST
API server host
String
localhost


LOG_LEVEL
Winston logging level (error, warn, info, debug)
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
Maximum open trading positions
Number
3


Usage

Starting the Bot:

Production: npm start runs node src/main.js.
Development: npm run dev uses nodemon for auto-restart.
Windows: run.bat executes node src/main.js.


Accessing the API:

Base URL: http://localhost:3000 (configurable via HOST and PORT).
Use tools like Postman or curl to interact with endpoints.


Paper Trading:

Enable via PAPER_TRADING=true in .env.
Trades are logged and stored in data/cache/ without affecting real accounts.


Monitoring:

Logs are written to logs/ using Winston, with verbosity set by LOG_LEVEL.
Example log: [2025-05-31T18:14:00Z] info: Server started on http://localhost:3000.



API Endpoints
GET /api/market

Description: Retrieves real-time market data for all supported trading pairs.
Response:[
  {
    "symbol": "BTC/USDT",
    "lastPrice": 65175.20,
    "volume": 120.45,
    "timestamp": "2025-05-31T18:14:00Z"
  },
  {
    "symbol": "ETH/USDT",
    "lastPrice": 3200.50,
    "volume": 450.30,
    "timestamp": "2025-05-31T18:14:00Z"
  }
]


Example Request:curl http://localhost:3000/api/market



GET /api/indicators/:symbol

Description: Returns technical indicator values for a specified trading pair.
Parameters:
:symbol: Trading pair (e.g., BTC/USDT).


Response:{
  "symbol": "BTC/USDT",
  "rsi": 65.43,
  "macd": { "macd": 150.25, "signal": 120.10, "histogram": 30.15 },
  "bollinger": { "upper": 65500.00, "middle": 65000.50, "lower": 64500.00 },
  "timestamp": "2025-05-31T18:14:00Z"
}


Example Request:curl http://localhost:3000/api/indicators/BTC/USDT



POST /api/trade

Description: Executes a trade (live or paper mode).
Request Body:{
  "symbol": "BTC/USDT",
  "side": "buy",
  "amount": 0.01,
  "price": 65100.00
}


Response:{
  "id": "trade_12345",
  "symbol": "BTC/USDT",
  "side": "buy",
  "amount": 0.01,
  "price": 65100.00,
  "status": "filled",
  "timestamp": "2025-05-31T18:14:00Z"
}


Example Request:curl -X POST http://localhost:3000/api/trade \
     -H "Content-Type: application/json" \
     -d '{"symbol":"BTC/USDT","side":"buy","amount":0.01,"price":65100.00}'



Core Functions
fetchMarketData(symbol, timeframe)

Description: Fetches OHLCV data from Xeggex API using got with rate limiting.
Parameters:
symbol: String (e.g., BTC/USDT)
timeframe: String (e.g., 1h, 5m)


Returns: Promise resolving to an array of OHLCV objects.
Example:const data = await fetchMarketData('BTC/USDT', '1h');

Input: symbol = 'BTC/USDT', timeframe = '1h'Output:[
  {
    "timestamp": "2025-05-31T18:00:00Z",
    "open": 65000.50,
    "high": 65200.75,
    "low": 64900.25,
    "close": 65150.30,
    "volume": 120.45
  },
  {
    "timestamp": "2025-05-31T17:00:00Z",
    "open": 64950.20,
    "high": 65100.00,
    "low": 64800.10,
    "close": 65000.50,
    "volume": 98.76
  }
]



calculateRSI(prices, period)

Description: Calculates RSI using the standard formula: RSI = 100 - (100 / (1 + RS)), where RS is the average gain divided by average loss over period.
Parameters:
prices: Array of closing prices (numbers)
period: Integer (default: 14)


Returns: Number (RSI value, 0-100)
Example:const prices = [65000.50, 65150.30, 64900.25, 65200.75, /* 10 more */];
const rsi = calculateRSI(prices, 14);

Input: prices = [65000.50, 65150.30, 64900.25, ..., 65100.00], period = 14Output: 65.43

calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod)

Description: Computes MACD line (fast EMA - slow EMA), signal line (EMA of MACD), and histogram (MACD - signal).
Parameters:
prices: Array of closing prices (numbers)
fastPeriod: Integer (default: 12)
slowPeriod: Integer (default: 26)
signalPeriod: Integer (default: 9)


Returns: Object with macd, signal, and histogram
Example:const prices = [65000.50, 65150.30, 64900.25, /* ... */];
const macd = calculateMACD(prices, 12, 26, 9);

Input: prices = [65000.50, 65150.30, 64900.25, ..., 65200.75], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9Output:{
  "macd": 150.25,
  "signal": 120.10,
  "histogram": 30.15
}



executeTrade(symbol, side, amount, price)

Description: Places a buy/sell order, respecting TRADING_ENABLED and PAPER_TRADING settings.
Parameters:
symbol: String (e.g., BTC/USDT)
side: String (buy or sell)
amount: Number
price: Number


Returns: Promise resolving to a trade confirmation object
Example:const trade = await executeTrade('BTC/USDT', 'buy', 0.01, 65100.00);

Input: symbol = 'BTC/USDT', side = 'buy', amount = 0.01, price = 65100.00Output:{
  "id": "trade_12345",
  "symbol": "BTC/USDT",
  "side": "buy",
  "amount": 0.01,
  "price": 65100.00,
  "status": "filled",
  "timestamp": "2025-05-31T18:14:00Z"
}



managePositions(symbol, maxPositions)

Description: Ensures open positions do not exceed MAX_POSITIONS.
Parameters:
symbol: String (e.g., BTC/USDT)
maxPositions: Integer (from .env)


Returns: Array of open position objects
Example:const positions = managePositions('BTC/USDT', 3);

Input: symbol = 'BTC/USDT', maxPositions = 3Output:[
  {
    "id": "pos_123",
    "symbol": "BTC/USDT",
    "side": "buy",
    "amount": 0.01,
    "entryPrice": 65100.00
  }
]



Error Handling

API Errors: Xeggex API errors (e.g., rate limit exceeded, invalid credentials) are logged via Winston and returned as HTTP 500 responses.
Trade Errors: Invalid trade parameters (e.g., negative amount) return HTTP 400 responses.
Data Errors: Missing or corrupted market data triggers fallback to cached data in data/cache/.
Logging: All errors are logged to logs/ with timestamps and details.

Testing
Test scripts in scripts/ verify key components:



Script
Description



test:setup
Initializes test environment (e.g., mock data, configurations).


test:api
Tests Xeggex API connectivity and authentication.


test:data
Verifies data collection and processing.


test:strategies
Tests indicator calculations and trading logic.


test:all
Runs all test suites sequentially.


Run tests with:
npm run test:setup
npm run test:api
npm run test:data
npm run test:strategies
npm run test:all

Note: The test script outputs "Tests will be added later". Full implementation is pending.
Project Structure



Path
Description



data/
Stores models and cache (excluded in .gitignore).


data/models/
Model data for indicators or strategies.


data/cache/
Cached market data.


logs/
Log files (excluded in .gitignore).


scripts/
Test and utility scripts.


scripts/test-setup.js
Test environment setup.


scripts/test-api-client.js
API client tests.


scripts/test-data-collector.js
Data collection tests.


scripts/test-technical-strategies.js
Indicator and strategy tests.


src/
Source code.


src/main.js
Main application entry point.


.env
Environment variables (excluded).


.env.example
Example configuration.


.gitignore
Ignored files and directories.


package.json
Project metadata and dependencies.


package-lock.json
Dependency lock file.


run.bat
Windows startup script (node src/main.js).


Dependencies



Dependency
Version
Purpose



express
^4.18.2
RESTful API framework.


got
^11.8.6
HTTP client for Xeggex API.


winston
^3.11.0
Logging framework.


dotenv
^16.3.1
Environment variable management.


config
^3.3.9
Configuration management.


nodemon
^3.0.2
Auto-restart for development (dev dependency).


Security Considerations

API Credentials: Store X_API and X_SECRET securely in .env, never commit to version control.
Rate Limiting: Respect Xeggex API limits to avoid bans.
Paper Trading: Use PAPER_TRADING=true for testing to avoid unintended trades.
Logging: Avoid logging sensitive data (e.g., API keys) by configuring Winston appropriately.

Contributing

Fork the repository on GitHub.
Create a branch: git checkout -b feature/your-feature.
Commit changes: git commit -m "Add your feature".
Push: git push origin feature/your-feature.
Open a pull request.

Include tests and follow coding standards.
License
Licensed under the ISC License. See the LICENSE file for details.
