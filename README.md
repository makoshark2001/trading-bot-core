core# Trading Bot Core - Technical Manual

## 🚀 Overview

The **trading-bot-core** is the foundational service of the modular trading bot architecture, providing real-time cryptocurrency market data collection, comprehensive technical analysis, and RESTful API services. Operating on **Port 3000**, it serves as the primary data source for all other modules in the ecosystem.

### Key Capabilities
- **Real-time Data Collection** from Xeggex cryptocurrency exchange
- **11 Advanced Technical Indicators** with ensemble signal generation
- **RESTful API** serving structured market data and analysis
- **Advanced Web Dashboard** with real-time visualization
- **Comprehensive Test Suite** with 16+ test scripts
- **Production-Ready Architecture** with error handling and validation

---

## 📊 Architecture Overview

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
│  │  • Real-time Dashboard                                 │  │
│  │  • Health Monitoring                                   │  │
│  │  • Data Validation                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
          ┌─────────▼─┐  ┌─────▼─────┐  ┌─▼──────────┐
          │    ML     │  │ Backtest  │  │ Dashboard  │
          │ Service   │  │ Service   │  │  Service   │
          │(Port 3001)│  │(Port 3002)│  │(Port 3005) │
          └───────────┘  └───────────┘  └────────────┘
```

---

## 🛠️ Quick Start

### Prerequisites
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Xeggex API credentials** (optional, works without)

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd trading-bot-core
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your Xeggex API credentials (optional)
```

3. **Start the Service**
```bash
npm start
```

4. **Verify Installation**
```bash
# Check service health
curl http://localhost:3000/api/health

# Access web dashboard
open http://localhost:3000
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:3000
```

### Core Endpoints

#### 1. **GET /api/health**
Service health check and system status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1704067200000,
  "uptime": "02:15:30",
  "api": {
    "healthy": true,
    "timestamp": 1704067200000
  },
  "dataCollection": {
    "isCollecting": true,
    "totalDataPoints": 15420,
    "successfulUpdates": 1542,
    "failedUpdates": 3
  }
}
```

#### 2. **GET /api/data**
Complete system data with all pairs and technical analysis.

**Response:**
```json
{
  "uptime": "02:15:30",
  "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
  "history": {
    "XMR": {
      "closes": [158.45, 159.20, 157.80, ...],
      "highs": [159.50, 160.10, 158.90, ...],
      "lows": [157.20, 158.00, 156.50, ...],
      "volumes": [1250.5, 1180.2, 1350.8, ...],
      "timestamps": [1704067200000, 1704067500000, ...]
    }
  },
  "strategyResults": {
    "XMR": {
      "rsi": {
        "value": 65.4,
        "suggestion": "hold",
        "confidence": 0.3,
        "metadata": { "interpretation": "Neutral zone" }
      },
      "macd": { /* MACD results */ },
      "bollinger": { /* Bollinger Bands results */ }
      // ... all 11 indicators
    }
  },
  "stats": { /* System statistics */ },
  "status": "running",
  "lastUpdate": "2024-01-01T12:00:00.000Z"
}
```

#### 3. **GET /api/pair/:pair**
Individual pair data with complete technical analysis.

**Parameters:**
- `pair` (string): Trading pair symbol (e.g., "RVN", "XMR")

**Response:**
```json
{
  "pair": "RVN",
  "history": {
    "closes": [0.0234, 0.0235, 0.0233, ...],
    "highs": [0.0236, 0.0237, 0.0235, ...],
    "lows": [0.0232, 0.0233, 0.0231, ...],
    "volumes": [125000, 118000, 135000, ...],
    "timestamps": [1704067200000, 1704067500000, ...]
  },
  "strategies": {
    "rsi": {
      "value": 45.2,
      "suggestion": "hold",
      "confidence": 0.15,
      "strength": 0.12,
      "metadata": {
        "avgGain": 0.000125,
        "avgLoss": 0.000098,
        "period": 14,
        "interpretation": "Neutral zone - no clear signal"
      }
    },
    "macd": {
      "macdLine": 0.000045,
      "signalLine": 0.000038,
      "histogram": 0.000007,
      "suggestion": "buy",
      "confidence": 0.65,
      "strength": 0.58,
      "metadata": {
        "interpretation": "Bullish MACD crossover",
        "crossover": "bullish"
      }
    }
    // ... all 11 indicators
  },
  "hasEnoughData": true
}
```

---

## 📈 Technical Indicators

The core service provides 11 advanced technical indicators with ensemble analysis:

### 1. **RSI (Relative Strength Index)**
- **Period**: 14 (configurable)
- **Signals**: Overbought (>70), Oversold (<30)
- **Output**: Value, suggestion, confidence, interpretation

### 2. **MACD (Moving Average Convergence Divergence)**
- **Parameters**: Fast(12), Slow(26), Signal(9)
- **Signals**: Line crossovers, histogram momentum
- **Output**: MACD line, signal line, histogram, crossover type

### 3. **Bollinger Bands**
- **Parameters**: Period(20), Standard Deviation(2)
- **Signals**: Price position vs bands, bandwidth analysis
- **Output**: Upper/lower bands, %B, bandwidth, squeeze detection

### 4. **Moving Average Crossover**
- **Parameters**: Fast(10), Slow(21)
- **Signals**: Golden cross, death cross
- **Output**: Fast/slow MA values, crossover detection, trend

### 5. **Volume Analysis**
- **Parameters**: Period(20)
- **Signals**: Volume spikes, OBV, VPT analysis
- **Output**: Volume ratio, trend, confirmation strength

### 6. **Stochastic Oscillator**
- **Parameters**: %K(14), %D(3)
- **Signals**: Overbought/oversold with crossovers
- **Output**: %K, %D values, crossover detection

### 7. **Williams %R**
- **Parameters**: Period(14)
- **Signals**: Momentum reversals, overbought/oversold
- **Output**: %R value, level interpretation

### 8. **Ichimoku Cloud**
- **Parameters**: Tenkan(9), Kijun(26), Senkou B(52)
- **Signals**: Cloud analysis, line crossovers
- **Output**: All lines, cloud color, trend strength

### 9. **ADX (Average Directional Index)**
- **Parameters**: Period(14)
- **Signals**: Trend strength measurement
- **Output**: ADX, +DI, -DI, trend direction

### 10. **CCI (Commodity Channel Index)**
- **Parameters**: Period(20)
- **Signals**: Extreme price movements
- **Output**: CCI value, level interpretation

### 11. **Parabolic SAR**
- **Parameters**: Initial AF(0.02), Max AF(0.2)
- **Signals**: Trend following, reversal points
- **Output**: SAR value, trend direction, reversal detection

### Ensemble Analysis
The core combines all indicators to generate consensus signals:
- **Buy Score**: Weighted sum of bullish signals
- **Sell Score**: Weighted sum of bearish signals
- **Confidence**: Overall signal strength
- **Valid Strategies**: Number of indicators with sufficient data

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
# API Credentials (optional)
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
```

### Configuration Files

#### config/default.json
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
  },
  "logging": {
    "level": "info",
    "file": "logs/app.log"
  }
}
```

---

## 📊 Data Structures

### Market Data Format
```javascript
// Historical data structure
{
  closes: [Number],    // Closing prices
  highs: [Number],     // High prices  
  lows: [Number],      // Low prices
  volumes: [Number],   // Trading volumes
  timestamps: [Number] // Unix timestamps
}
```

### Technical Indicator Output
```javascript
// Standard indicator response
{
  suggestion: "buy" | "sell" | "hold",
  confidence: Number,  // 0.0 to 1.0
  strength: Number,    // 0.0 to 1.0
  metadata: {
    interpretation: String,
    // Indicator-specific fields
  }
}
```

### Strategy Results Format
```javascript
// Complete strategy analysis
{
  [indicatorName]: {
    // Indicator-specific values
    suggestion: String,
    confidence: Number,
    strength: Number,
    metadata: Object,
    error?: String  // If calculation failed
  }
}
```

---

## 🏗️ Integration Guide for Other Modules

### For ML Service (trading-bot-ml)

#### Data Fetching
```javascript
const axios = require('axios');

// Get all data for feature extraction
const response = await axios.get('http://localhost:3000/api/data');
const { pairs, history, strategyResults } = response.data;

// Get specific pair data
const pairData = await axios.get('http://localhost:3000/api/pair/RVN');
const { history, strategies } = pairData.data;
```

#### Feature Engineering
```javascript
// Available features from core:
// - 11 technical indicators with confidence scores
// - Historical OHLCV data
// - Ensemble signals
// - Metadata and interpretations

const features = {
  // Price features
  currentPrice: history.closes[history.closes.length - 1],
  priceChange: /* calculate from history */,
  
  // Technical features
  rsiValue: strategies.rsi.value,
  rsiConfidence: strategies.rsi.confidence,
  macdHistogram: strategies.macd.histogram,
  bollingerPercentB: strategies.bollinger.percentB,
  
  // Ensemble features
  ensembleSignal: /* calculate from all strategies */,
  consensusStrength: /* measure agreement */
};
```

### For Backtest Service (trading-bot-backtest)

#### Historical Data Access
```javascript
// Get historical data for backtesting
const response = await axios.get('http://localhost:3000/api/pair/RVN');
const { history, strategies } = response.data;

// Use for backtesting
const backtestResults = await runBacktest({
  pair: 'RVN',
  data: history,
  signals: strategies,
  timeframe: '5m'
});
```

#### Strategy Validation
```javascript
// Validate strategy signals
const isValidStrategy = (strategies) => {
  return Object.values(strategies).some(strategy => 
    !strategy.error && strategy.confidence > 0.6
  );
};
```

### For Dashboard Service (trading-bot-dashboard)

#### Real-time Data Display
```javascript
// Aggregate data from core
const coreData = await axios.get('http://localhost:3000/api/data');

const dashboardData = {
  systemHealth: coreData.data.status,
  totalPairs: coreData.data.pairs.length,
  lastUpdate: coreData.data.lastUpdate,
  
  // Per-pair summaries
  pairSummaries: coreData.data.pairs.map(pair => ({
    pair,
    price: coreData.data.history[pair].closes.slice(-1)[0],
    signal: coreData.data.strategyResults[pair].ensemble?.suggestion,
    confidence: coreData.data.strategyResults[pair].ensemble?.confidence
  }))
};
```

### For Risk Management Service (trading-bot-risk)

#### Risk Metrics Calculation
```javascript
// Use core data for risk analysis
const allData = await axios.get('http://localhost:3000/api/data');

const riskMetrics = {
  volatility: calculateVolatility(allData.data.history),
  correlations: calculateCorrelations(allData.data.pairs),
  drawdowns: analyzeDrawdowns(allData.data.history),
  signalReliability: assessSignalQuality(allData.data.strategyResults)
};
```

---

## 🧪 Testing

### Available Test Scripts
```bash
# Basic setup test
npm run test:setup

# API client functionality
npm run test:api

# Data collection system
npm run test:data

# Technical strategies
npm run test:strategies

# Run all tests
npm run test:all
```

### Health Check Verification
```bash
# Quick health check
curl http://localhost:3000/api/health

# Data availability check
curl http://localhost:3000/api/data | jq '.pairs'

# Specific pair check
curl http://localhost:3000/api/pair/RVN | jq '.strategies | keys'
```

### Performance Benchmarks
- **API Response Time**: <50ms for individual pair data
- **Data Collection**: 5-minute intervals for all pairs
- **Technical Analysis**: <100ms for all 11 indicators
- **Memory Usage**: ~150MB under normal load
- **Data Retention**: 1440 data points (5 days at 5-min intervals)

---

## 🔍 Monitoring & Debugging

### Log Files
```bash
logs/
├── app.log      # General application logs
└── error.log    # Error-specific logs
```

### Debug Information
```javascript
// Enable debug logging
LOG_LEVEL=debug npm start

// Monitor data collection
curl http://localhost:3000/api/health | jq '.dataCollection'

// Check specific pair health
curl http://localhost:3000/api/pair/RVN | jq '.hasEnoughData'
```

### Common Issues & Solutions

#### 1. **No Data Collected**
```bash
# Check API credentials
echo $X_API $X_SECRET

# Verify network connectivity
curl https://api.xeggex.com/api/v2/market/getlist

# Check service logs
tail -f logs/app.log
```

#### 2. **Technical Indicators Not Calculating**
```bash
# Verify sufficient data points
curl http://localhost:3000/api/pair/RVN | jq '.history.closes | length'

# Check for validation errors
curl http://localhost:3000/api/pair/RVN | jq '.strategies | to_entries[] | select(.value.error)'
```

#### 3. **API Timeouts**
```bash
# Check rate limiting
curl http://localhost:3000/api/health | jq '.api'

# Monitor request frequency
grep "Rate limit" logs/app.log
```

---

## 🚀 Performance Optimization

### Data Management
- **Automatic Data Trimming**: Maintains optimal memory usage
- **Efficient Storage**: Time-series optimized data structures
- **Smart Caching**: Reduces redundant calculations

### API Optimization
- **Response Compression**: Gzip enabled for large datasets
- **Request Rate Limiting**: Prevents API overload
- **Connection Pooling**: Efficient HTTP client management

### Technical Analysis Optimization
- **Incremental Calculations**: Only recalculate when new data arrives
- **Vectorized Operations**: Batch processing for multiple indicators
- **Error Isolation**: Failed indicators don't affect others

---

## 🔒 Security & Production Considerations

### API Security
- **Rate Limiting**: 100 requests per minute
- **Input Validation**: All parameters sanitized
- **Error Handling**: No sensitive data in error messages

### Production Deployment
```bash
# Production environment
NODE_ENV=production npm start

# Process management (recommended)
npm install -g pm2
pm2 start src/main.js --name trading-bot-core

# Health monitoring
pm2 monit
```

### Environment Isolation
- **Separate API Keys**: Different credentials per environment
- **Config Management**: Environment-specific configurations
- **Log Separation**: Structured logging for production monitoring

---

## 📋 API Usage Examples

### Complete Integration Example
```javascript
const axios = require('axios');

class CoreServiceClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({ baseURL, timeout: 10000 });
  }
  
  async getSystemStatus() {
    const response = await this.client.get('/api/health');
    return response.data;
  }
  
  async getAllData() {
    const response = await this.client.get('/api/data');
    return response.data;
  }
  
  async getPairAnalysis(pair) {
    const response = await this.client.get(`/api/pair/${pair}`);
    return response.data;
  }
  
  async getEnsembleSignal(pair) {
    const data = await this.getPairAnalysis(pair);
    const strategies = data.strategies;
    
    let buyScore = 0, sellScore = 0, totalConfidence = 0;
    let validStrategies = 0;
    
    Object.entries(strategies).forEach(([name, strategy]) => {
      if (!strategy.error && strategy.confidence > 0) {
        validStrategies++;
        totalConfidence += strategy.confidence;
        
        if (strategy.suggestion === 'buy') {
          buyScore += strategy.confidence;
        } else if (strategy.suggestion === 'sell') {
          sellScore += strategy.confidence;
        }
      }
    });
    
    const avgConfidence = validStrategies > 0 ? totalConfidence / validStrategies : 0;
    const signal = buyScore > sellScore ? 'BUY' : 
                  sellScore > buyScore ? 'SELL' : 'HOLD';
    
    return {
      pair,
      signal,
      confidence: avgConfidence,
      buyScore,
      sellScore,
      validStrategies,
      strategies
    };
  }
}

// Usage
const core = new CoreServiceClient();

// Get system health
const health = await core.getSystemStatus();
console.log('Core Service Status:', health.status);

// Get trading signal
const signal = await core.getEnsembleSignal('RVN');
console.log('Trading Signal:', signal);
```

---

## 📚 Additional Resources

### Related Documentation
- **Trading-Bot-ML Integration**: See `trading-bot-ml/README.md`
- **Backtest Service Integration**: See `trading-bot-backtest/README.md`
- **Dashboard Integration**: See `trading-bot-dashboard/README.md`

### External APIs
- **Xeggex API Documentation**: https://api.xeggex.com/docs
- **Technical Analysis Reference**: Standard TA indicators documentation

### Support & Community
- **GitHub Issues**: Report bugs and feature requests
- **Wiki**: Extended documentation and examples
- **Discussions**: Community support and strategy sharing

---

## 📊 Version Information

- **Current Version**: 2.0.0
- **Node.js Compatibility**: >=16.0.0
- **Last Updated**: January 2025
- **API Stability**: Production Ready

### Changelog
- **v2.0.0**: Complete modular architecture, 11 indicators, RESTful API
- **v1.x.x**: Legacy monolithic versions (deprecated)

---

*This technical manual serves as the complete reference for integrating with the trading-bot-core service. For specific implementation examples, refer to the existing integrations in trading-bot-ml, trading-bot-backtest, and trading-bot-dashboard repositories.*