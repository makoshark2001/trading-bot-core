# trading-bot-core - Development Guide

**Repository**: https://github.com/makoshark2001/trading-bot-core  
**Port**: 3000  
**Status**: ✅ **PRODUCTION READY**

## 🎯 Service Purpose

The core trading bot service that provides market data collection and technical analysis. This is the foundation service that all other modules depend on.

## 💬 Chat Instructions for Claude

```
I'm working with the trading-bot-core service that provides market data collection and technical analysis. This is the foundation service that all other modules depend on. The core functionality is complete and production-ready.

Key features implemented:
- Real-time data from Xeggex exchange for 6 trading pairs
- 11 technical indicators with ensemble signals
- RESTful API on port 3000
- Clean, modular architecture
- Comprehensive error handling
- Production deployment configuration

Please help me with any enhancements or integrations needed.
```

## 📊 Implementation Status

### ✅ **COMPLETED - ALL PHASES**

#### **Phase 1A: Basic Infrastructure** - ✅ **COMPLETE**
- ✅ Node.js project initialized with proper dependencies
- ✅ Complete folder structure: src/{server,data,strategies,utils}
- ✅ Environment configuration (.env.example, config/default.json)
- ✅ Main entry point (src/main.js)
- ✅ Express server setup with CORS and middleware
- ✅ Winston logging and error handling

#### **Phase 1B: Exchange Integration** - ✅ **COMPLETE**
- ✅ XeggexClient with rate limiting (100 requests/minute)
- ✅ Market data endpoints integration
- ✅ Exponential backoff retry logic and health checks
- ✅ MarketDataCollector with real-time data fetching
- ✅ Data validation, cleaning, and quality checks
- ✅ In-memory storage with 1440 point retention
- ✅ Automatic 5-minute data updates
- ✅ Robust error recovery mechanisms

#### **Phase 1C: Technical Analysis Engine** - ✅ **COMPLETE**
- ✅ **All 11 Technical Indicators Implemented:**
  - RSI (Relative Strength Index) - 14 period
  - MACD (Moving Average Convergence Divergence) - 12,26,9
  - Bollinger Bands - 20 period, 2 std dev
  - Moving Average Crossover - 10,21 periods
  - Volume Analysis - 20 period with OBV/VPT
  - Stochastic Oscillator - 14,3 periods
  - Williams %R - 14 period
  - Ichimoku Cloud - 9,26,52,26 periods
  - ADX (Average Directional Index) - 14 period
  - CCI (Commodity Channel Index) - 20 period
  - Parabolic SAR - 0.02, 0.2, 0.02 parameters
- ✅ TechnicalStrategies engine with signal aggregation
- ✅ Confidence scoring system (0-1 scale)
- ✅ Ensemble decision logic with weighted signals
- ✅ Error isolation between indicators

#### **Phase 1D: API Endpoints** - ✅ **COMPLETE**
- ✅ **Core API Routes:**
  - `GET /` - Service documentation and info
  - `GET /api/health` - System health and status
  - `GET /api/data` - Complete system data for all pairs
  - `GET /api/pairs` - Available trading pairs list
  - `GET /api/pair/:pair` - Individual pair analysis
  - `GET /api/pair/:pair/indicator/:indicator` - Specific indicator data
- ✅ Standardized JSON response formats
- ✅ Proper HTTP status codes (200, 404, 500)
- ✅ Input validation and error handling
- ✅ CORS headers for cross-service communication

#### **Phase 1E: Production Readiness** - ✅ **COMPLETE**
- ✅ Comprehensive test scripts for all components
- ✅ Winston logging with file and console output
- ✅ Graceful shutdown handling (SIGINT/SIGTERM)
- ✅ PM2 production configuration (ecosystem.config.js)
- ✅ Memory usage monitoring and optimization
- ✅ Performance monitoring and health checks
- ✅ Complete API documentation in README.md

## 🚀 **Current Features**

### **Trading Pairs** (6 Total)
Currently collecting real-time data for:
- **XMR** (Monero)
- **RVN** (Ravencoin) 
- **BEL** (Bella Protocol)
- **DOGE** (Dogecoin)
- **KAS** (Kaspa)
- **SAL** (SalmonSwap)

### **Technical Indicators** (11 Total)
All indicators provide:
- Trading signals (buy/sell/hold)
- Confidence scores (0-1)
- Signal strength ratings
- Detailed interpretation metadata

### **Ensemble Signal System**
- Weighted combination of all 11 indicators
- Dynamic confidence scoring
- Strategy weight customization
- Error-resilient signal generation

## 📡 **API Reference**

### **Base URL:** `http://localhost:3000`

#### **GET /** 
Service information and available endpoints
```bash
curl http://localhost:3000/
```

#### **GET /api/health**
System health check with detailed status
```bash
curl http://localhost:3000/api/health
```
Returns: Service status, uptime, API health, data collection stats, indicator count

#### **GET /api/pairs**
List of available trading pairs
```bash
curl http://localhost:3000/api/pairs
```
Returns: `{"pairs": ["XMR","RVN","BEL","DOGE","KAS","SAL"], "total": 6}`

#### **GET /api/data**
Complete system data for all pairs
```bash
curl http://localhost:3000/api/data
```
Returns: All pairs history, strategy results, system stats, uptime

#### **GET /api/pair/:pair**
Individual pair analysis (e.g., /api/pair/RVN)
```bash
curl http://localhost:3000/api/pair/RVN
```
Returns: Price history, all technical indicators, analysis metadata

#### **GET /api/pair/:pair/indicator/:indicator**
Specific indicator for a pair (e.g., /api/pair/RVN/indicator/rsi)
```bash
curl http://localhost:3000/api/pair/RVN/indicator/rsi
```
Returns: RSI value, signal, confidence, interpretation

## ⚙️ **Configuration**

### **Environment Variables (.env)**
```bash
# API Credentials (optional - public endpoints work without)
X_API=your_xeggex_api_key_here
X_SECRET=your_xeggex_api_secret_here

# Environment
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### **Trading Configuration (config/default.json)**
```json
{
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "dataRetention": 1440,
    "updateInterval": 300000
  }
}
```

## 🚀 **Deployment**

### **Development**
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### **Production with PM2**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2:start

# Management commands
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
npm run pm2:status
```

### **Available Scripts**
```bash
npm start              # Start in production mode
npm run dev            # Start with nodemon (development)
npm run test:all       # Run all test suites
npm run pm2:start      # Start with PM2
npm run pm2:stop       # Stop PM2 process
npm run pm2:restart    # Restart PM2 process
npm run pm2:logs       # View PM2 logs
npm run pm2:status     # Check PM2 status
```

## 🧪 **Testing**

### **Automated Test Suite**
```bash
npm run test:setup      # Basic setup and configuration test
npm run test:api        # Xeggex API client functionality
npm run test:data       # Data collection and validation
npm run test:strategies # All 11 technical indicators
npm run test:all        # Run complete test suite
```

### **Manual API Testing**
```bash
# Verify all endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/pairs  
curl http://localhost:3000/api/data
curl http://localhost:3000/api/pair/RVN
curl http://localhost:3000/api/pair/RVN/indicator/rsi
```

### **Performance Verification**
- API response times: <50ms average
- Memory usage: <1GB with full data retention
- Data collection: 99%+ success rate
- Indicator calculations: Error-free processing

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                TRADING-BOT-CORE (Port 3000)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   XeggexClient  │  │ MarketDataCollector │ │ TechnicalStrategies ││
│  │                 │  │                 │  │                 ││
│  │ • Rate Limiting │  │ • 6 Trading     │  │ • 11 Indicators ││
│  │ • Health Checks │  │   Pairs         │  │ • Ensemble      ││
│  │ • Error Retry   │  │ • 1440 Points   │  │   Signals       ││
│  │ • API Client    │  │ • 5min Updates  │  │ • Confidence    ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                 │                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Express API Server (Port 3000)              │  │
│  │  • 6 REST Endpoints                                    │  │
│  │  • JSON Responses                                      │  │
│  │  • Error Handling                                      │  │
│  │  • CORS Support                                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 **Integration Points for Other Services**

This core service provides data to:
- **trading-bot-ml** (Port 3001) - Technical analysis data for ML features
- **trading-bot-backtest** (Port 3002) - Historical data for strategy testing
- **trading-bot-risk** (Port 3003) - Market data for risk calculations
- **trading-bot-execution** (Port 3004) - Real-time signals for trade execution
- **trading-bot-dashboard** (Port 3005) - All data for visualization

### **Integration Examples**

#### **JavaScript/Node.js Service Integration**
```javascript
const CORE_API_URL = 'http://localhost:3000';

// Get all market data
async function getMarketData() {
  const response = await fetch(`${CORE_API_URL}/api/data`);
  return response.json();
}

// Get specific pair analysis
async function getPairAnalysis(pair) {
  const response = await fetch(`${CORE_API_URL}/api/pair/${pair}`);
  return response.json();
}

// Get specific indicator
async function getIndicator(pair, indicator) {
  const response = await fetch(`${CORE_API_URL}/api/pair/${pair}/indicator/${indicator}`);
  return response.json();
}
```

#### **Python Service Integration**
```python
import requests

CORE_API_URL = 'http://localhost:3000'

def get_market_data():
    response = requests.get(f'{CORE_API_URL}/api/data')
    return response.json()

def get_pair_analysis(pair):
    response = requests.get(f'{CORE_API_URL}/api/pair/{pair}')
    return response.json()
```

## 📈 **Performance Metrics**

### **System Performance**
- **Startup Time**: <10 seconds with full initialization
- **API Response**: <50ms average response time
- **Memory Usage**: <512MB baseline, <1GB with full data
- **Data Collection**: 99%+ success rate, 5-minute intervals
- **Error Recovery**: Automatic retry with exponential backoff

### **Technical Indicators Performance**
- **Calculation Speed**: All 11 indicators complete in <5ms
- **Data Requirements**: Minimum 52 data points for full analysis
- **Signal Generation**: Real-time ensemble signals with each data update
- **Accuracy**: Error-free mathematical calculations with validation

### **Production Readiness Checklist**
- ✅ Handles API rate limits (100 requests/minute)
- ✅ Graceful error handling and recovery
- ✅ Memory management with data retention limits
- ✅ Comprehensive logging for debugging
- ✅ Health monitoring for service availability
- ✅ PM2 configuration for process management
- ✅ CORS headers for cross-service communication

## 🚨 **Error Handling & Monitoring**

### **API Error Responses**
All endpoints return standardized error formats:
```json
{
  "error": "Description of error",
  "timestamp": 1674123456789,
  "statusCode": 404|500
}
```

### **Health Monitoring**
The `/api/health` endpoint provides:
- Service status and uptime
- API connectivity status  
- Data collection statistics
- Memory usage information
- Indicator availability status

### **Logging Levels**
- **ERROR**: API failures, calculation errors, critical issues
- **WARN**: Rate limit warnings, retry attempts, degraded performance
- **INFO**: Service start/stop, data collection status, major events
- **DEBUG**: Detailed calculation logs, API request details

## 🚫 **What NOT to Add (Maintain Focus)**

This service should **NOT** include:
- ❌ Machine learning models or predictions
- ❌ Backtesting engines or strategy testing
- ❌ Risk management calculations
- ❌ Trade execution logic
- ❌ User interfaces or dashboards
- ❌ Portfolio management
- ❌ Order placement functionality

## ✅ **Success Criteria (ALL MET)**

**✅ Core Functionality:**
- Real-time data collection for 6 trading pairs
- 11 technical indicators calculating correctly
- Ensemble signal generation working
- RESTful API serving all endpoints

**✅ Production Readiness:**
- PM2 configuration for deployment
- Comprehensive error handling
- Health monitoring and logging
- Performance optimized (<50ms response)

**✅ Integration Ready:**
- CORS enabled for cross-service communication
- Standardized JSON API responses
- Clear documentation for other services
- Stable API endpoints for ecosystem integration

## 🎯 **Next Steps for Ecosystem**

With trading-bot-core complete, the ecosystem can now expand:

1. **trading-bot-dashboard** - Web interface consuming this API
2. **trading-bot-ml** - Machine learning service using technical analysis data
3. **trading-bot-backtest** - Strategy testing using historical data
4. **trading-bot-risk** - Risk management using market data
5. **trading-bot-execution** - Trade execution using signals

## 📞 **Support & Maintenance**

### **Monitoring Commands**
```bash
# Check service health
curl http://localhost:3000/api/health

# View logs
npm run pm2:logs

# Check memory usage
npm run pm2:status
```

### **Common Maintenance Tasks**
- Monitor API rate limits via health endpoint
- Check data collection success rates
- Review error logs for issues
- Restart service if needed: `npm run pm2:restart`

---

**Trading Bot Core** - Foundation service providing market data collection and technical analysis for the trading bot ecosystem.

*Status: ✅ Production Ready | Last Updated: January 2025*