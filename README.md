# Trading Bot Core API

**Market Data Collection & Technical Analysis Engine**

Core infrastructure providing real-time cryptocurrency market data collection, technical analysis, and RESTful API services for the trading bot ecosystem.

## 🎯 Purpose

This is the **data and analysis engine** that powers the trading bot ecosystem. It provides:
- Real-time cryptocurrency market data collection from Xeggex
- 11 advanced technical indicators with ensemble analysis
- RESTful API for market data and technical analysis
- Signal generation and confidence scoring

## 🏗️ Architecture Role

This repository is **one component** of a larger trading bot ecosystem:
- **Core** (this repo): Market data collection and technical analysis
- **Dashboard**: Web interface and real-time visualization  
- **ML**: Machine learning predictions and AI-enhanced signals
- **Backtest**: Strategy testing and historical validation
- **Risk**: Risk management and position sizing optimization
- **Execution**: Trade execution and order management

## 🚀 Features

### Technical Indicators (11 Total)
1. **RSI** (Relative Strength Index) - Momentum oscillator
2. **MACD** (Moving Average Convergence Divergence) - Trend following
3. **Bollinger Bands** - Volatility and mean reversion
4. **Moving Average** - Trend direction and crossovers
5. **Volume Analysis** - Volume-price relationship and OBV
6. **Stochastic Oscillator** - Momentum and overbought/oversold
7. **Williams %R** - Momentum oscillator
8. **Ichimoku Cloud** - Comprehensive trend analysis
9. **ADX** (Average Directional Index) - Trend strength
10. **CCI** (Commodity Channel Index) - Momentum and reversal
11. **Parabolic SAR** - Stop and reverse trend following

### Signal Generation
- Individual indicator signals with confidence scores
- Ensemble signal generation combining all indicators
- Weighted scoring system for signal strength
- Metadata including interpretation and trend analysis

### Market Data Collection
- Real-time data collection from Xeggex API
- Configurable update intervals and data retention
- Automatic error handling and retry logic
- Data validation and quality checks

## 📡 API Endpoints

### Core Endpoints

#### `GET /`
Service information and API documentation
```json
{
  "service": "Trading Bot Core API",
  "version": "2.0.0",
  "endpoints": {
    "health": "/api/health",
    "data": "/api/data", 
    "pair": "/api/pair/:pair"
  },
  "indicators": ["RSI", "MACD", "Bollinger Bands", ...]
}
```

#### `GET /api/health`
System health and status information
```json
{
  "status": "healthy",
  "service": "Trading Bot Core",
  "uptime": "02:45:30",
  "api": { "healthy": true },
  "dataCollection": {
    "isCollecting": true,
    "totalDataPoints": 1250,
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"]
  },
  "indicators": {
    "available": ["rsi", "macd", "bollinger", ...],
    "count": 11
  }
}
```

#### `GET /api/data`
All pairs with complete market data and technical analysis
```json
{
  "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
  "strategyResults": {
    "RVN": {
      "rsi": {
        "value": 45.2,
        "suggestion": "hold",
        "confidence": 0.3,
        "strength": 0.25,
        "metadata": {
          "interpretation": "Neutral zone - no clear signal"
        }
      },
      "macd": {
        "macdLine": 0.000123,
        "signalLine": 0.000098,
        "histogram": 0.000025,
        "suggestion": "buy",
        "confidence": 0.7,
        "strength": 0.65
      }
    }
  },
  "history": {
    "RVN": {
      "closes": [0.02434, 0.02441, ...],
      "highs": [0.02445, 0.02450, ...],
      "lows": [0.02430, 0.02435, ...],
      "volumes": [15420, 16830, ...],
      "timestamps": [1672531200000, ...]
    }
  },
  "stats": { ... },
  "uptime": "02:45:30",
  "lastUpdate": "2025-01-15T10:30:45.123Z"
}
```

#### `GET /api/pair/:pair`
Individual pair analysis and history
```json
{
  "pair": "RVN",
  "history": {
    "closes": [0.02434, 0.02441, ...],
    "highs": [0.02445, 0.02450, ...],
    "lows": [0.02430, 0.02435, ...],
    "volumes": [15420, 16830, ...],
    "timestamps": [1672531200000, ...]
  },
  "strategies": {
    "rsi": { ... },
    "macd": { ... },
    "bollinger": { ... }
  },
  "hasEnoughData": true
}
```

#### `GET /api/pair/:pair/indicator/:indicator`
Specific indicator data for a pair
```json
{
  "pair": "RVN",
  "indicator": "rsi",
  "data": {
    "value": 45.2,
    "suggestion": "hold",
    "confidence": 0.3,
    "strength": 0.25,
    "metadata": {
      "avgGain": 0.000123,
      "avgLoss": 0.000098,
      "period": 14,
      "interpretation": "Neutral zone - no clear signal"
    }
  }
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation
```bash
git clone https://github.com/makoshark2001/trading-bot-core
cd trading-bot-core
npm install
```

### Configuration
```bash
cp .env.example .env
# Edit .env with your API credentials
```

Required environment variables:
```bash
X_API=your_xeggex_api_key_here
X_SECRET=your_xeggex_api_secret_here
NODE_ENV=development
LOG_LEVEL=info
```

### Start the API Server
```bash
# Production
npm start

# Development with auto-reload
npm run dev
```

The API will be available at `http://localhost:3000`

## 🧪 Testing

### Run All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
npm run test:api          # Test API client
npm run test:data         # Test data collection
npm run test:strategies   # Test technical indicators
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Get all market data
curl http://localhost:3000/api/data

# Get specific pair
curl http://localhost:3000/api/pair/RVN

# Get specific indicator
curl http://localhost:3000/api/pair/RVN/indicator/rsi
```

## 🔧 Configuration

### Trading Pairs
Edit `config/default.json`:
```json
{
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "updateInterval": 300000,
    "dataRetention": 1440
  }
}
```

### Technical Indicators
All indicators are configurable with custom periods and parameters. See individual indicator files in `src/strategies/technical/indicators/`.

## 🔗 Integration Examples

### Consuming the API from Other Services

#### JavaScript/Node.js
```javascript
const CORE_API_URL = 'http://localhost:3000';

// Get market data
async function getMarketData() {
  const response = await fetch(`${CORE_API_URL}/api/data`);
  return response.json();
}

// Get specific pair analysis
async function getPairAnalysis(pair) {
  const response = await fetch(`${CORE_API_URL}/api/pair/${pair}`);
  return response.json();
}

// Get RSI for RVN
async function getRSI(pair) {
  const response = await fetch(`${CORE_API_URL}/api/pair/${pair}/indicator/rsi`);
  return response.json();
}
```

#### Python
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

#### Dashboard Service Example
```javascript
// How a dashboard service would consume this API
class TradingDashboard {
  constructor() {
    this.coreAPI = 'http://localhost:3000';
  }
  
  async updateCharts() {
    const data = await fetch(`${this.coreAPI}/api/data`);
    const marketData = await data.json();
    
    // Update charts with technical analysis
    this.updateCharts(marketData.strategyResults);
    this.updatePriceData(marketData.history);
  }
}
```

## 🏗️ Architecture & Design

### Event-Driven Data Processing
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Xeggex API    │───▶│ MarketDataCollector │───▶│ TechnicalStrategies │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Data Storage  │    │ Signal Generation│
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                └────────┬───────────────┘
                                         ▼
                                ┌─────────────────┐
                                │   REST API      │
                                └─────────────────┘
```

### Data Flow
1. **Market Data Collection**: Real-time data from Xeggex API
2. **Data Validation**: Quality checks and error handling
3. **Technical Analysis**: Calculate all 11 indicators
4. **Signal Generation**: Ensemble analysis and confidence scoring
5. **API Serving**: RESTful endpoints for other services

### Microservice Architecture
This core service is designed to be consumed by other specialized services:
- **Stateless**: No session management, pure API
- **Scalable**: Can handle multiple concurrent requests
- **Focused**: Single responsibility (data + analysis)
- **Independent**: Runs standalone without dependencies on other services

## 📊 Data Structures

### Technical Indicator Response Format
```javascript
{
  "value": 45.2,              // Primary indicator value
  "suggestion": "hold",       // Trading suggestion: buy/sell/hold  
  "confidence": 0.3,          // Confidence score (0-1)
  "strength": 0.25,           // Signal strength (0-1)
  "metadata": {               // Indicator-specific metadata
    "period": 14,
    "interpretation": "Neutral zone - no clear signal",
    // ... additional indicator-specific fields
  }
}
```

### Market Data Format
```javascript
{
  "closes": [0.02434, 0.02441, ...],     // Closing prices
  "highs": [0.02445, 0.02450, ...],      // High prices
  "lows": [0.02430, 0.02435, ...],       // Low prices  
  "volumes": [15420, 16830, ...],        // Trading volumes
  "timestamps": [1672531200000, ...]     // Unix timestamps
}
```

## 🔧 Advanced Configuration

### Custom Indicator Periods
```javascript
// Modify indicator periods in TechnicalStrategies.js
constructor() {
  this.indicators = {
    rsi: new RSI(21),           // Custom 21-period RSI
    macd: new MACD(8, 21, 5),   // Custom MACD parameters
    bollinger: new BollingerBands(15, 2.5), // Custom Bollinger settings
    // ... other indicators
  };
}
```

### Rate Limiting Configuration
```json
{
  "api": {
    "xeggex": {
      "rateLimit": {
        "requests": 100,
        "window": 60000
      }
    }
  }
}
```

### Data Retention Settings
```json
{
  "trading": {
    "dataRetention": 1440,     // Keep 1440 data points (5 days at 5min intervals)
    "updateInterval": 300000   // Update every 5 minutes
  }
}
```

## 🚨 Error Handling

### API Error Responses
```javascript
// 404 - Pair not found
{
  "error": "Pair not found",
  "pair": "INVALID",
  "availablePairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
  "timestamp": 1672531200000
}

// 500 - Internal server error
{
  "error": "Internal server error",
  "message": "Calculation failed",
  "timestamp": 1672531200000
}

// 404 - Endpoint not found
{
  "error": "Endpoint not found",
  "service": "Trading Bot Core API",
  "availableEndpoints": ["GET /", "GET /api/health", ...],
  "timestamp": 1672531200000
}
```

### Health Check Failure
```javascript
{
  "status": "unhealthy",
  "service": "Trading Bot Core",
  "error": "API connection failed",
  "timestamp": 1672531200000
}
```

## 📈 Performance

### Optimization Features
- **In-memory data storage** for fast indicator calculations
- **Event-driven updates** to minimize unnecessary recalculations
- **Configurable data retention** to manage memory usage
- **Rate limiting** to respect API boundaries
- **Connection pooling** for database operations

### Monitoring
- Real-time health checks via `/api/health`
- Memory usage tracking in system stats
- API request success/failure rates
- Data collection statistics and error rates

## 🔒 Security

### API Security
- CORS headers for cross-origin requests
- Input validation for all parameters
- Error message sanitization
- Rate limiting on API endpoints

### Data Security
- API credentials stored in environment variables
- No sensitive data in logs or responses
- Secure error handling without data leakage

## 📚 Technical Documentation

### Project Structure
```
src/
├── data/
│   ├── collectors/
│   │   ├── XeggexClient.js          # API client for Xeggex
│   │   ├── MarketDataCollector.js   # Real-time data collection
│   │   └── index.js
│   └── validators/
│       ├── DataValidator.js         # Data validation utilities
│       └── index.js
├── strategies/
│   └── technical/
│       ├── TechnicalStrategies.js   # Main strategy engine
│       ├── indicators/              # Individual indicator implementations
│       │   ├── RSI.js
│       │   ├── MACD.js
│       │   ├── BollingerBands.js
│       │   ├── MovingAverage.js
│       │   ├── Volume.js
│       │   ├── Stochastic.js
│       │   ├── WilliamsR.js
│       │   ├── IchimokuCloud.js
│       │   ├── ADX.js
│       │   ├── CCI.js
│       │   ├── ParabolicSAR.js
│       │   └── index.js
│       └── index.js
├── utils/
│   ├── Logger.js                    # Winston-based logging
│   └── index.js
├── server/
│   └── ExpressApp.js                # Express API server
└── main.js                          # Application entry point
```

### Key Classes

#### `TechnicalStrategies`
Main engine for calculating all technical indicators and generating ensemble signals.

#### `MarketDataCollector`
Handles real-time data collection, storage, and event emission for new data.

#### `XeggexClient`
API client with rate limiting, error handling, and health checks.

#### Individual Indicators
Each indicator is implemented as a separate class with consistent interface:
- `calculate(data)` - Main calculation method
- `generateSignal()` - Trading signal generation
- Validation and error handling

## 🤝 Contributing

### Adding New Indicators
1. Create new indicator class in `src/strategies/technical/indicators/`
2. Follow the existing indicator interface pattern
3. Add to `TechnicalStrategies.js` indicators list
4. Create comprehensive tests
5. Update documentation

### Code Standards
- ESLint configuration for consistent formatting
- Comprehensive error handling required
- JSDoc comments for all public methods
- Unit tests for all new functionality

## 📜 License

ISC License - See LICENSE file for details.

## 🔗 Related Repositories

- **[trading-bot-dashboard](https://github.com/makoshark2001/trading-bot-dashboard)** - Web interface and visualization
- **[trading-bot-ml](https://github.com/makoshark2001/trading-bot-ml)** - Machine learning predictions  
- **[trading-bot-backtest](https://github.com/makoshark2001/trading-bot-backtest)** - Strategy testing and validation
- **[trading-bot-risk](https://github.com/makoshark2001/trading-bot-risk)** - Risk management and position sizing
- **[trading-bot-execution](https://github.com/makoshark2001/trading-bot-execution)** - Trade execution and order management

## 📞 Support

For issues, questions, or contributions:
- Create GitHub issues for bugs or feature requests
- Check existing documentation before asking questions
- Follow the contributing guidelines for pull requests

---

**Trading Bot Core API** - Market Data Collection & Technical Analysis Engine  
*Part of the Trading Bot Ecosystem*