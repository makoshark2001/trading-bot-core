# trading-bot-core - Development Guide

**Repository**: https://github.com/makoshark2001/trading-bot-core  
**Port**: 3000  
**Priority**: 1 (Foundation Service - Must Complete First)

## 🎯 Service Purpose

The core trading bot service that provides market data collection and technical analysis. This is the foundation service that all other modules depend on.

## 💬 Chat Instructions for Claude

```
I'm building the core trading bot service that provides market data collection and technical analysis. This is the foundation service that all other modules depend on. Please help me implement the features step by step, focusing on reliability and clean API design.

Key requirements:
- Real-time data from Xeggex exchange
- 11 technical indicators with ensemble signals
- RESTful API on port 3000
- Clean, modular architecture
- Comprehensive error handling

Please refer to the technical specifications in the documentation and help me implement each component systematically.
```

## 📋 Implementation To-Do List

### ✅ Phase 1A: Basic Infrastructure

- [ ] **Project Setup**
  - [ ] Initialize Node.js project: `npm init -y`
  - [ ] Install dependencies:
    ```bash
    npm install express axios lodash winston cors dotenv
    npm install --save-dev jest nodemon
    ```
  - [ ] Create folder structure:
    ```
    src/
    ├── server/
    ├── exchange/
    ├── data/
    ├── strategies/
    ├── routes/
    └── utils/
    config/
    logs/
    tests/
    ```
  - [ ] Create `.env.example` with required variables
  - [ ] Create `config/default.json` with service configuration
  - [ ] Create main entry point `src/main.js`

- [ ] **API Foundation**
  - [ ] File: `src/server/app.js` - Express server setup
  - [ ] File: `src/routes/health.js` - Health check endpoint
  - [ ] Implement CORS for other services
  - [ ] Add request logging middleware (Winston)
  - [ ] Create error handling middleware

### ✅ Phase 1B: Exchange Integration

- [ ] **Xeggex Client**
  - [ ] File: `src/exchange/XeggexClient.js` - Main client class
  - [ ] Implement rate limiting (100 requests/minute)
  - [ ] Add market data endpoints integration
  - [ ] Implement exponential backoff retry logic
  - [ ] Add health check for exchange connectivity
  - [ ] Handle API errors gracefully

- [ ] **Data Collection**
  - [ ] File: `src/data/MarketDataCollector.js` - Data collection engine
  - [ ] Implement real-time data fetching for 6 pairs: XMR, RVN, BEL, DOGE, KAS, SAL
  - [ ] Add data validation and cleaning
  - [ ] Create in-memory data storage with 1440 point retention
  - [ ] Implement 5-minute automatic data updates
  - [ ] Add data quality checks and error recovery

### ✅ Phase 1C: Technical Analysis Engine

- [ ] **Individual Indicators** (Create in `src/strategies/`)
  - [ ] `RSIStrategy.js` - Relative Strength Index (14-period)
  - [ ] `MACDStrategy.js` - MACD (12,26,9)
  - [ ] `BollingerStrategy.js` - Bollinger Bands (20,2)
  - [ ] `MAStrategy.js` - Moving Average Crossover (10,21)
  - [ ] `VolumeStrategy.js` - Volume Analysis (20-period)
  - [ ] `StochasticStrategy.js` - Stochastic Oscillator (14,3)
  - [ ] `WilliamsRStrategy.js` - Williams %R (14-period)
  - [ ] `IchimokuStrategy.js` - Ichimoku Cloud (9,26,52)
  - [ ] `ADXStrategy.js` - Average Directional Index (14-period)
  - [ ] `CCIStrategy.js` - Commodity Channel Index (20-period)
  - [ ] `ParabolicSARStrategy.js` - Parabolic SAR (0.02, 0.2)

- [ ] **Strategy Engine**
  - [ ] File: `src/strategies/StrategyEngine.js` - Main strategy coordinator
  - [ ] Implement signal aggregation from all indicators
  - [ ] Add confidence scoring system
  - [ ] Create ensemble decision logic (buy/sell/hold)
  - [ ] Add error isolation (failed indicators don't break others)

### ✅ Phase 1D: API Endpoints

- [ ] **Core API Routes** (Create in `src/routes/`)
  - [ ] `health.js` - GET /api/health (service health + data collection status)
  - [ ] `data.js` - GET /api/data (complete system data with all pairs)
  - [ ] `pairs.js` - GET /api/pair/:pair (individual pair analysis)
  - [ ] `pairs.js` - GET /api/pairs (available trading pairs list)

- [ ] **API Response Formats**
  - [ ] Standardize response structure across all endpoints
  - [ ] Include metadata (timestamps, data quality indicators)
  - [ ] Add proper HTTP status codes
  - [ ] Implement request validation

### ✅ Phase 1E: Testing & Production Readiness

- [ ] **Test Suite** (Create in `tests/`)
  - [ ] Unit tests for each technical indicator
  - [ ] Integration tests for Xeggex client
  - [ ] API endpoint tests
  - [ ] Data validation tests
  - [ ] Strategy engine tests

- [ ] **Production Features**
  - [ ] Winston logging configuration
  - [ ] Graceful shutdown handling
  - [ ] PM2 configuration file
  - [ ] Memory usage optimization
  - [ ] Performance monitoring

- [ ] **Documentation**
  - [ ] Complete README.md with API documentation
  - [ ] API endpoint examples with curl commands
  - [ ] Integration guide for other services
  - [ ] Configuration documentation

## 📊 Key API Endpoints to Implement

```javascript
// Health check
GET /api/health
Response: { status, timestamp, uptime, api: {...}, dataCollection: {...} }

// Complete system data
GET /api/data  
Response: { uptime, pairs, history: {...}, strategyResults: {...}, stats: {...} }

// Individual pair data
GET /api/pair/:pair
Response: { pair, history: {...}, strategies: {...}, hasEnoughData }

// Available pairs
GET /api/pairs
Response: { pairs: ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"] }
```

## 🏗️ Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRADING-BOT-CORE (Port 3000)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   XeggexClient  │  │ MarketDataCollector │ │ TechnicalStrategies ││
│  │                 │  │                 │  │                 ││
│  │ • API Connection│  │ • Data Storage  │  │ • 11 Indicators ││
│  │ • Rate Limiting │  │ • Real-time     │  │ • Ensemble      ││
│  │ • Health Checks │  │   Updates       │  │   Signals       ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                 │                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Express Server (Port 3000)                │  │
│  │  • RESTful API Endpoints                               │  │
│  │  • Health Monitoring                                   │  │
│  │  • Data Validation                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Configuration Requirements

### Environment Variables (.env)
```bash
# API Credentials (optional - works without)
X_API=your_xeggex_api_key_here
X_SECRET=your_xeggex_api_secret_here

# Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# Logging
LOG_LEVEL=info

# Trading Configuration
TRADING_ENABLED=false
PAPER_TRADING=true
```

### Default Configuration (config/default.json)
```json
{
  "api": {
    "xeggex": {
      "baseUrl": "https://api.xeggex.com/api/v2",
      "rateLimit": {
        "requests": 100,
        "window": 60000
      }
    }
  },
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "dataRetention": 1440,
    "updateInterval": 300000
  },
  "server": {
    "port": 3000,
    "updateInterval": 2000
  }
}
```

## 🧪 Testing Strategy

```bash
# Test commands to implement
npm run test:setup      # Basic setup test
npm run test:api        # API client functionality  
npm run test:data       # Data collection system
npm run test:strategies # Technical strategies
npm run test:all        # Run all tests

# Health check verification
curl http://localhost:3000/api/health
curl http://localhost:3000/api/data | jq '.pairs'
curl http://localhost:3000/api/pair/RVN | jq '.strategies | keys'
```

## 🚫 What NOT to Add (Keep Scope Focused)

- ❌ Machine learning models or predictions
- ❌ Backtesting engines or strategy testing
- ❌ Risk management calculations 
- ❌ Trade execution logic
- ❌ User interfaces or dashboards
- ❌ Portfolio management
- ❌ Order placement functionality

## ✅ Success Criteria

**Phase 1A Complete When:**
- Express server runs on port 3000
- Health endpoint returns proper status
- Basic project structure exists

**Phase 1B Complete When:**
- Xeggex API client successfully fetches data
- Real-time data collection works for all 6 pairs
- Data retention and quality checks function

**Phase 1C Complete When:**
- All 11 technical indicators calculate correctly
- Strategy engine produces ensemble signals
- Error handling prevents indicator failures from breaking system

**Phase 1D Complete When:**
- All API endpoints return properly formatted data
- Integration examples work for other services
- API documentation is complete

**Phase 1E Complete When:**
- Test suite passes with >90% coverage
- Service can run in production with PM2
- Performance meets benchmarks (<50ms API response)

## 🔗 Integration Points for Other Services

This core service will provide data to:
- **trading-bot-ml** (Port 3001) - Technical analysis for ML features
- **trading-bot-backtest** (Port 3002) - Historical data for strategy testing
- **trading-bot-risk** (Port 3003) - Market data for risk calculations
- **trading-bot-execution** (Port 3004) - Real-time signals for trade execution
- **trading-bot-dashboard** (Port 3005) - All data for visualization

**Remember**: This is the foundation. Focus on making it rock-solid, efficient, and reliable before moving to other services.

---

*Save this file as `DEVELOPMENT_GUIDE.md` in the trading-bot-core repository root*