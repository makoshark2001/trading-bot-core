# trading-bot-core - Development Guide

**Repository**: https://github.com/makoshark2001/trading-bot-core  
**Port**: 3000  
**Status**: ✅ **PRODUCTION READY** with **Dynamic Pair Management**

## 🎯 Service Purpose

The core trading bot service that provides market data collection, technical analysis, and **dynamic trading pair management**. This is the foundation service that all other modules depend on, now with the ability to add/remove trading pairs without server restarts.

## 💬 Chat Instructions for Claude

```
I'm working with the trading-bot-core service that provides market data collection, technical analysis, and dynamic trading pair management. This is the foundation service that all other modules depend on. The core functionality is complete and production-ready, including dynamic pair management.

Key features implemented:
- Real-time data from Xeggex exchange for configurable trading pairs
- 11 technical indicators with ensemble signals
- RESTful API on port 3000
- Dynamic trading pair management with 5 new API endpoints
- Runtime configuration management with persistence
- Clean, modular architecture
- Comprehensive error handling
- Production deployment configuration

Please help me with any enhancements or integrations needed.
```

## 📊 Implementation Status

### ✅ **COMPLETED - ALL PHASES INCLUDING DYNAMIC PAIRS**

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

#### **Phase 2: Dynamic Pair Management** - ✅ **COMPLETE**
- ✅ **ConfigManager for Runtime Configuration:**
  - Persistent storage in `config/runtime.json`
  - Fallback to default pairs if configuration fails
  - Input validation and error handling
  - Independent logging to avoid circular dependencies
- ✅ **Extended MarketDataCollector:**
  - `addPair(pair)` - Add single pair dynamically
  - `removePair(pair)` - Remove single pair dynamically
  - `updatePairs(newPairs)` - Bulk update pairs
  - Real-time data collection for new pairs
  - History cleanup for removed pairs
- ✅ **New API Endpoints:**
  - `GET /api/config` - Get current configuration
  - `PUT /api/config/pairs` - Update all trading pairs
  - `POST /api/config/pairs/add` - Add single trading pair
  - `DELETE /api/config/pairs/:pair` - Remove single trading pair
  - `POST /api/config/reset` - Reset to default pairs
- ✅ **Event-Driven Architecture:**
  - Real-time updates without server restart
  - Strategy recalculation for new pairs
  - Cleanup of removed pair data
  - Event emission for dashboard integration
- ✅ **Testing and Validation:**
  - Comprehensive test suite for dynamic pairs
  - Input validation for pair formats
  - Error handling for edge cases
  - Production testing verified

## 🚀 **Current Features**

### **Dynamic Trading Pair Management**
- **Runtime Configuration**: Add/remove pairs without server restart
- **Persistent Storage**: Configuration survives server restarts in `config/runtime.json`
- **Real-time Updates**: Data collection starts immediately for new pairs
- **Dashboard Integration**: Complete API for pair management
- **Validation**: Input validation and comprehensive error handling
- **Fallback**: Automatic fallback to default pairs if needed

### **Trading Pairs** (Configurable)
Default pairs (can be changed dynamically):
- **XMR** (Monero)
- **RVN** (Ravencoin) 
- **BEL** (Bella Protocol)
- **DOGE** (Dogecoin)
- **KAS** (Kaspa)
- **SAL** (SalmonSwap)

Runtime pairs managed via API - can be any valid cryptocurrency pairs.

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

#### **Core Endpoints**

**GET /** 
Service information and available endpoints including dynamic pair management
```bash
curl http://localhost:3000/
```

**GET /api/health**
System health check with detailed status including current pairs
```bash
curl http://localhost:3000/api/health
```

**GET /api/pairs**
List of current trading pairs (dynamic)
```bash
curl http://localhost:3000/api/pairs
```
Returns: `{"pairs": ["BTC","ETH","XMR","RVN"], "total": 4}`

**GET /api/data**
Complete system data for all current pairs
```bash
curl http://localhost:3000/api/data
```

**GET /api/pair/:pair**
Individual pair analysis (e.g., /api/pair/BTC)
```bash
curl http://localhost:3000/api/pair/BTC
```

**GET /api/pair/:pair/indicator/:indicator**
Specific indicator for a pair (e.g., /api/pair/BTC/indicator/rsi)
```bash
curl http://localhost:3000/api/pair/BTC/indicator/rsi
```

#### **Dynamic Pair Management Endpoints**

**GET /api/config**
Get current trading pair configuration
```bash
curl http://localhost:3000/api/config
```
Returns: Configuration with pairs, last updated timestamp, and metadata

**PUT /api/config/pairs**
Update all trading pairs
```bash
curl -X PUT http://localhost:3000/api/config/pairs \
  -H "Content-Type: application/json" \
  -d '{"pairs": ["BTC", "ETH", "XMR"], "updatedBy": "dashboard"}'
```

**POST /api/config/pairs/add**
Add a single trading pair
```bash
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "DOGE", "updatedBy": "dashboard"}'
```

**DELETE /api/config/pairs/:pair**
Remove a single trading pair
```bash
curl -X DELETE http://localhost:3000/api/config/pairs/DOGE \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "dashboard"}'
```

**POST /api/config/reset**
Reset to default trading pairs
```bash
curl -X POST http://localhost:3000/api/config/reset \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "dashboard"}'
```

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

### **Static Configuration (config/default.json)**
```json
{
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "dataRetention": 1440,
    "updateInterval": 300000
  }
}
```

### **Dynamic Configuration (config/runtime.json - auto-created)**
```json
{
  "trading": {
    "pairs": ["BTC", "ETH", "XMR", "RVN"],
    "lastUpdated": 1674123456789,
    "updatedBy": "dashboard"
  }
}
```

**Note**: Runtime configuration overrides static configuration for trading pairs.

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
npm run test:pairs     # Test dynamic pairs management
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
npm run test:pairs      # Dynamic pairs management
npm run test:all        # Run complete test suite
```

### **Manual API Testing**
```bash
# Verify core endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/pairs  
curl http://localhost:3000/api/data

# Test dynamic pair management
curl http://localhost:3000/api/config
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "BTC"}'
curl http://localhost:3000/api/pairs
curl -X DELETE http://localhost:3000/api/config/pairs/BTC \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Performance Verification**
- API response times: <50ms average
- Memory usage: <1GB with full data retention
- Data collection: 99%+ success rate
- Indicator calculations: Error-free processing
- Dynamic pair updates: Immediate effect, full data collection within 5 minutes

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                TRADING-BOT-CORE (Port 3000)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   XeggexClient  │  │ MarketDataCollector │ │ TechnicalStrategies ││
│  │                 │  │                 │  │                 ││
│  │ • Rate Limiting │  │ • Dynamic Pairs │  │ • 11 Indicators ││
│  │ • Health Checks │  │ • 1440 Points   │  │ • Ensemble      ││
│  │ • Error Retry   │  │ • 5min Updates  │  │   Signals       ││
│  │ • API Client    │  │ • Add/Remove    │  │ • Confidence    ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                 │                             │
│  ┌─────────────────┐            │            ┌─────────────────┐│
│  │  ConfigManager  │◄───────────┼───────────►│   Express API   ││
│  │                 │            │            │   Server        ││
│  │ • Runtime Pairs │            │            │ • 11 Endpoints  ││
│  │ • Persistence   │            │            │ • JSON Responses││
│  │ • Validation    │            │            │ • Error Handling││
│  │ • Fallback      │            │            │ • CORS Support  ││
│  └─────────────────┘            │            └─────────────────┘│
│                                 │                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Dynamic Pair Management Flow                 │  │
│  │  1. API Request → 2. Config Update → 3. Data Collector │  │
│  │  4. Strategy Calc → 5. Real-time Data Available        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 **Integration Points for Other Services**

This core service provides data to:
- **trading-bot-ml** (Port 3001) - Technical analysis data for ML features
- **trading-bot-backtest** (Port 3002) - Historical data for strategy testing
- **trading-bot-risk** (Port 3003) - Market data for risk calculations
- **trading-bot-execution** (Port 3004) - Real-time signals for trade execution
- **trading-bot-dashboard** (Port 3005) - All data for visualization + pair management

### **Integration Examples**

#### **JavaScript/Node.js Service Integration**
```javascript
const CORE_API_URL = 'http://localhost:3000';

class TradingCoreClient {
    // Get all market data
    async getMarketData() {
        const response = await fetch(`${CORE_API_URL}/api/data`);
        return response.json();
    }
    
    // Dynamic pair management
    async getCurrentPairs() {
        const response = await fetch(`${CORE_API_URL}/api/config`);
        const data = await response.json();
        return data.config.pairs;
    }
    
    async addPair(pair) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pair, updatedBy: 'service' })
        });
        return response.json();
    }
    
    async updatePairs(pairs) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pairs, updatedBy: 'service' })
        });
        return response.json();
    }
    
    // Get specific analysis
    async getPairAnalysis(pair) {
        const response = await fetch(`${CORE_API_URL}/api/pair/${pair}`);
        return response.json();
    }
    
    async getIndicator(pair, indicator) {
        const response = await fetch(`${CORE_API_URL}/api/pair/${pair}/indicator/${indicator}`);
        return response.json();
    }
}

// Usage example
const coreClient = new TradingCoreClient();

// Dynamic pair management
await coreClient.addPair('BTC');
await coreClient.updatePairs(['BTC', 'ETH', 'XMR']);
const currentPairs = await coreClient.getCurrentPairs();

// Market data
const marketData = await coreClient.getMarketData();
const btcAnalysis = await coreClient.getPairAnalysis('BTC');
const btcRSI = await coreClient.getIndicator('BTC', 'rsi');
```

#### **Python Service Integration**
```python
import requests

class TradingCoreClient:
    def __init__(self, core_api_url='http://localhost:3000'):
        self.core_api_url = core_api_url
    
    def get_market_data(self):
        response = requests.get(f'{self.core_api_url}/api/data')
        return response.json()
    
    def get_current_pairs(self):
        response = requests.get(f'{self.core_api_url}/api/config')
        return response.json()['config']['pairs']
    
    def add_pair(self, pair, updated_by='service'):
        response = requests.post(
            f'{self.core_api_url}/api/config/pairs/add',
            json={'pair': pair, 'updatedBy': updated_by}
        )
        return response.json()
    
    def update_pairs(self, pairs, updated_by='service'):
        response = requests.put(
            f'{self.core_api_url}/api/config/pairs',
            json={'pairs': pairs, 'updatedBy': updated_by}
        )
        return response.json()

# Usage example
core_client = TradingCoreClient()

# Dynamic pair management
current_pairs = core_client.get_current_pairs()
core_client.add_pair('BTC')
core_client.update_pairs(['BTC', 'ETH', 'XMR'])

# Market data
market_data = core_client.get_market_data()
```

## 📈 **Performance Metrics**

### **System Performance**
- **Startup Time**: <10 seconds with full initialization
- **API Response**: <50ms average response time
- **Memory Usage**: <512MB baseline, <1GB with full data
- **Data Collection**: 99%+ success rate, 5-minute intervals
- **Error Recovery**: Automatic retry with exponential backoff

### **Dynamic Pair Management Performance**
- **Pair Addition**: Immediate configuration update, data collection starts within 5 seconds
- **Pair Removal**: Immediate configuration update and data cleanup
- **Configuration Persistence**: <100ms save to runtime.json
- **Technical Analysis**: Full indicators available within 5-10 minutes for new pairs
- **Concurrent Operations**: Multiple pair operations supported simultaneously

### **Production Readiness Checklist**
- ✅ Handles API rate limits (100 requests/minute)
- ✅ Graceful error handling and recovery
- ✅ Memory management with data retention limits
- ✅ Comprehensive logging for debugging
- ✅ Health monitoring for service availability
- ✅ PM2 configuration for process management
- ✅ CORS headers for cross-service communication
- ✅ Dynamic pair management without downtime
- ✅ Configuration validation and error handling
- ✅ Fallback mechanisms for failed configurations

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

### **Dynamic Pair Management Errors**
```json
{
  "error": "Invalid pair format detected",
  "message": "pairs must be 2-10 characters, alphanumeric",
  "timestamp": 1674123456789
}

{
  "error": "Pair already exists",
  "pair": "BTC",
  "timestamp": 1674123456789
}
```

### **Health Monitoring**
The `/api/health` endpoint provides:
- Service status and uptime
- API connectivity status  
- Data collection statistics
- Memory usage information
- Indicator availability status
- Current trading pairs and configuration status

### **Logging Levels**
- **ERROR**: API failures, calculation errors, critical issues, configuration failures
- **WARN**: Rate limit warnings, retry attempts, degraded performance
- **INFO**: Service start/stop, data collection status, major events, pair updates
- **DEBUG**: Detailed calculation logs, API request details, configuration changes

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
- Real-time data collection for configurable trading pairs
- 11 technical indicators calculating correctly
- Ensemble signal generation working
- RESTful API serving all endpoints

**✅ Dynamic Pair Management:**
- Add/remove pairs without server restart
- Persistent configuration with fallback
- Real-time data collection for new pairs
- Complete API for dashboard integration
- Input validation and error handling

**✅ Production Readiness:**
- PM2 configuration for deployment
- Comprehensive error handling
- Health monitoring and logging
- Performance optimized (<50ms response)
- Dynamic configuration management

**✅ Integration Ready:**
- CORS enabled for cross-service communication
- Standardized JSON API responses
- Clear documentation for other services
- Stable API endpoints for ecosystem integration
- Dynamic pair management API for dashboards

## 🎯 **Next Steps for Ecosystem**

With trading-bot-core complete including dynamic pairs, the ecosystem can now expand:

1. **trading-bot-dashboard** - Web interface with dynamic pair management UI
2. **trading-bot-ml** - Machine learning service using technical analysis data
3. **trading-bot-backtest** - Strategy testing using historical data
4. **trading-bot-risk** - Risk management using market data
5. **trading-bot-execution** - Trade execution using signals

## 📞 **Support & Maintenance**

### **Monitoring Commands**
```bash
# Check service health
curl http://localhost:3000/api/health

# Check current configuration
curl http://localhost:3000/api/config

# View logs
npm run pm2:logs

# Check memory usage
npm run pm2:status

# Test dynamic pairs
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "TEST"}'
```

### **Common Maintenance Tasks**
- Monitor API rate limits via health endpoint
- Check data collection success rates
- Review error logs for issues
- Verify configuration file integrity
- Test dynamic pair management functionality
- Restart service if needed: `npm run pm2:restart`

### **Configuration Management**
- **Runtime config location**: `config/runtime.json`
- **Default config location**: `config/default.json`
- **Backup**: Runtime configuration is automatically backed up on changes
- **Recovery**: Service falls back to default pairs if runtime config fails

---

**Trading Bot Core** - Foundation service providing market data collection, technical analysis, and dynamic pair management for the trading bot ecosystem.

*Status: ✅ Production Ready with Dynamic Pair Management | Last Updated: January 2025*