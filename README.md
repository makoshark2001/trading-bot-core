# Trading Bot Core API

**Market Data Collection & Technical Analysis Engine with Dynamic Pair Management & Persistent Storage**

Core infrastructure providing real-time cryptocurrency market data collection, technical analysis, and RESTful API services for the trading bot ecosystem. Features **dynamic trading pair management** and **persistent local storage** - add, remove, and modify trading pairs without restarting the server, with data preserved across restarts.

## 🎯 Purpose

This is the **data and analysis engine** that powers the trading bot ecosystem. It provides:
- Real-time cryptocurrency market data collection from Xeggex
- 11 advanced technical indicators with ensemble analysis
- RESTful API for market data and technical analysis
- Signal generation and confidence scoring
- **Dynamic trading pair management** with dashboard-ready API endpoints
- **Persistent local storage** for faster startups and data continuity

## 🏗️ Architecture Role

This repository is **one component** of a larger trading bot ecosystem:
- **Core** (this repo): Market data collection, technical analysis, dynamic pair management, and persistent storage
- **Dashboard**: Web interface and real-time visualization  
- **ML**: Machine learning predictions and AI-enhanced signals
- **Backtest**: Strategy testing and historical validation
- **Risk**: Risk management and position sizing optimization
- **Execution**: Trade execution and order management

## 🚀 Features

### Persistent Local Storage
- **Smart Data Loading**: Loads from local storage first, API fallback only when needed
- **Fast Startup**: No waiting for API preloads after first run
- **Data Continuity**: Historical data preserved across server restarts
- **Automatic Saving**: Periodic saves every 5 minutes + graceful shutdown saves
- **Storage Management**: APIs to monitor storage stats and cleanup old files
- **Performance Optimized**: Reduces API calls and improves reliability

### Dynamic Trading Pair Management
- **Runtime Configuration**: Add/remove pairs without server restart
- **Persistent Storage**: Configuration survives server restarts
- **Real-time Updates**: Data collection starts immediately for new pairs
- **Dashboard Integration**: Complete API for pair management
- **Validation**: Input validation and error handling
- **Fallback**: Automatic fallback to default pairs if needed

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
  "description": "Market data collection and technical analysis engine with dynamic pair management and persistent storage",
  "endpoints": {
    "health": "/api/health",
    "data": "/api/data", 
    "pairs": "/api/pairs",
    "pair": "/api/pair/:pair",
    "config": "/api/config",
    "updatePairs": "PUT /api/config/pairs",
    "addPair": "POST /api/config/pairs/add",
    "removePair": "DELETE /api/config/pairs/:pair",
    "reset": "POST /api/config/reset",
    "storageStats": "/api/storage/stats",
    "forceSave": "POST /api/storage/save",
    "cleanup": "POST /api/storage/cleanup"
  },
  "indicators": ["RSI", "MACD", "Bollinger Bands", ...],
  "features": [
    "Real-time data collection",
    "Dynamic pair management", 
    "Persistent local storage",
    "11 technical indicators",
    "Ensemble signal generation"
  ]
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
    "pairs": ["BTC", "ETH", "XMR", "RVN"]
  },
  "indicators": {
    "available": ["rsi", "macd", "bollinger", ...],
    "count": 11
  }
}
```

### Persistent Storage Endpoints

#### `GET /api/storage/stats`
Get storage statistics and file information
```json
{
  "storage": {
    "totalPairs": 4,
    "totalSizeBytes": 15360,
    "pairs": [
      {
        "pair": "BTC",
        "sizeBytes": 4096,
        "dataPoints": 120,
        "lastModified": "2025-06-02T06:55:49.651Z"
      }
    ]
  },
  "timestamp": 1674123456789
}
```

#### `POST /api/storage/save`
Force save all current data to disk
```bash
curl -X POST http://localhost:3000/api/storage/save
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "timestamp": 1674123456789
}
```

#### `POST /api/storage/cleanup`
Clean up old data files
```bash
curl -X POST http://localhost:3000/api/storage/cleanup \
  -H "Content-Type: application/json" \
  -d '{"maxAgeHours": 168}'
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 2 old data files",
  "cleanedCount": 2,
  "maxAgeHours": 168,
  "timestamp": 1674123456789
}
```

### Dynamic Pair Management Endpoints

#### `GET /api/config`
Get current trading pair configuration
```json
{
  "config": {
    "pairs": ["BTC", "ETH", "XMR", "RVN"],
    "lastUpdated": 1674123456789,
    "updatedBy": "dashboard",
    "totalPairs": 4
  },
  "timestamp": 1674123456789
}
```

#### `PUT /api/config/pairs`
Update all trading pairs
```bash
curl -X PUT http://localhost:3000/api/config/pairs \
  -H "Content-Type: application/json" \
  -d '{"pairs": ["BTC", "ETH", "XMR"], "updatedBy": "dashboard"}'
```

#### `POST /api/config/pairs/add`
Add a single trading pair
```bash
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "DOGE", "updatedBy": "dashboard"}'
```

#### `DELETE /api/config/pairs/:pair`
Remove a single trading pair
```bash
curl -X DELETE http://localhost:3000/api/config/pairs/DOGE \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "dashboard"}'
```

#### `POST /api/config/reset`
Reset to default trading pairs
```bash
curl -X POST http://localhost:3000/api/config/reset \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "dashboard"}'
```

### Market Data Endpoints

#### `GET /api/data`
All pairs with complete market data and technical analysis
```json
{
  "pairs": ["BTC", "ETH", "XMR", "RVN"],
  "strategyResults": {
    "BTC": {
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
    "BTC": {
      "closes": [45234.5, 45441.2, ...],
      "highs": [45445.0, 45550.0, ...],
      "lows": [45130.0, 45235.0, ...],
      "volumes": [15420, 16830, ...],
      "timestamps": [1672531200000, ...]
    }
  },
  "stats": { ... },
  "uptime": "02:45:30",
  "lastUpdate": "2025-01-15T10:30:45.123Z"
}
```

#### `GET /api/pairs`
List of current trading pairs
```json
{
  "pairs": ["BTC", "ETH", "XMR", "RVN"],
  "total": 4,
  "timestamp": 1674123456789
}
```

#### `GET /api/pair/:pair`
Individual pair analysis and history
```json
{
  "pair": "BTC",
  "history": {
    "closes": [45234.5, 45441.2, ...],
    "highs": [45445.0, 45550.0, ...],
    "lows": [45130.0, 45235.0, ...],
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
  "pair": "BTC",
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
npm run test:pairs        # Test dynamic pairs management
npm run test:storage      # Test persistent storage
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Get current configuration
curl http://localhost:3000/api/config

# Get storage statistics
curl http://localhost:3000/api/storage/stats

# Add a trading pair
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "BTC"}'

# Get all market data
curl http://localhost:3000/api/data

# Get specific pair
curl http://localhost:3000/api/pair/BTC

# Get specific indicator
curl http://localhost:3000/api/pair/BTC/indicator/rsi
```

## 🔧 Configuration

### Default Trading Pairs
The system starts with default pairs defined in `config/default.json`, but runtime pairs are managed dynamically in `config/runtime.json`.

**Default Configuration** (`config/default.json`):
```json
{
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "dataRetention": 1440,
    "updateInterval": 300000,
    "saveInterval": 300000,
    "enablePersistence": true
  },
  "storage": {
    "enabled": true,
    "cleanupMaxAge": 168,
    "autoCleanup": true
  }
}
```

**Runtime Configuration** (`config/runtime.json` - auto-created):
```json
{
  "trading": {
    "pairs": ["BTC", "ETH", "XMR", "RVN"],
    "lastUpdated": 1674123456789,
    "updatedBy": "dashboard"
  }
}
```

### Persistent Storage Configuration
- **Storage Location**: `data/pairs/{pair}_history.json`
- **Save Frequency**: Every 5 minutes (configurable)
- **Auto-cleanup**: Files older than 7 days (configurable)
- **Data Format**: JSON with metadata and full history arrays

### Technical Indicators
All indicators are configurable with custom periods and parameters. See individual indicator files in `src/strategies/technical/indicators/`.

## 🔗 Dashboard Integration Examples

### JavaScript/Node.js
```javascript
const CORE_API_URL = 'http://localhost:3000';

class TradingBotCoreClient {
    // Pair Management
    async getCurrentPairs() {
        const response = await fetch(`${CORE_API_URL}/api/config`);
        const data = await response.json();
        return data.config.pairs;
    }
    
    async addPair(pair) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pair: pair,
                updatedBy: 'dashboard'
            })
        });
        return response.json();
    }
    
    // Storage Management
    async getStorageStats() {
        const response = await fetch(`${CORE_API_URL}/api/storage/stats`);
        return response.json();
    }
    
    async forceSave() {
        const response = await fetch(`${CORE_API_URL}/api/storage/save`, {
            method: 'POST'
        });
        return response.json();
    }
    
    async cleanupOldData(maxAgeHours = 168) {
        const response = await fetch(`${CORE_API_URL}/api/storage/cleanup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxAgeHours })
        });
        return response.json();
    }
    
    // Market Data
    async getMarketData() {
        const response = await fetch(`${CORE_API_URL}/api/data`);
        return response.json();
    }
    
    async getPairAnalysis(pair) {
        const response = await fetch(`${CORE_API_URL}/api/pair/${pair}`);
        return response.json();
    }
}

// Usage example
const client = new TradingBotCoreClient();

// Dynamic pair management
await client.addPair('BTC');
const currentPairs = await client.getCurrentPairs();

// Storage management
const storageStats = await client.getStorageStats();
await client.forceSave();
await client.cleanupOldData(24); // Clean files older than 24 hours

// Market data
const marketData = await client.getMarketData();
const btcAnalysis = await client.getPairAnalysis('BTC');
```

### Python
```python
import requests

class TradingBotCoreClient:
    def __init__(self, core_api_url='http://localhost:3000'):
        self.core_api_url = core_api_url
    
    # Pair Management
    def get_current_pairs(self):
        response = requests.get(f'{self.core_api_url}/api/config')
        return response.json()['config']['pairs']
    
    def add_pair(self, pair, updated_by='dashboard'):
        response = requests.post(
            f'{self.core_api_url}/api/config/pairs/add',
            json={'pair': pair, 'updatedBy': updated_by}
        )
        return response.json()
    
    # Storage Management
    def get_storage_stats(self):
        response = requests.get(f'{self.core_api_url}/api/storage/stats')
        return response.json()
    
    def force_save(self):
        response = requests.post(f'{self.core_api_url}/api/storage/save')
        return response.json()
    
    def cleanup_old_data(self, max_age_hours=168):
        response = requests.post(
            f'{self.core_api_url}/api/storage/cleanup',
            json={'maxAgeHours': max_age_hours}
        )
        return response.json()
    
    # Market Data
    def get_market_data(self):
        response = requests.get(f'{self.core_api_url}/api/data')
        return response.json()

# Usage example
client = TradingBotCoreClient()

# Dynamic pair management
current_pairs = client.get_current_pairs()
client.add_pair('BTC')

# Storage management
storage_stats = client.get_storage_stats()
client.force_save()
client.cleanup_old_data(24)

# Market data
market_data = client.get_market_data()
```

## 🏗️ Architecture & Design

### Event-Driven Data Processing with Persistent Storage
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Xeggex API    │───▶│ MarketDataCollector │───▶│ TechnicalStrategies │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                       ┌─────────────────┐              ▼
                       │  ConfigManager  │    ┌─────────────────┐
                       │  (Runtime Pairs)│    │ Signal Generation│
                       └─────────────────┘    └─────────────────┘
                                │                        │
                       ┌─────────────────┐              │
                       │  DataStorage    │              │
                       │(Persistent Files)│              │
                       └─────────────────┘              │
                                │                        │
                                └────────┬───────────────┘
                                         ▼
                                ┌─────────────────┐
                                │   REST API      │
                                │(Dynamic Pairs + │
                                │   Storage Mgmt) │
                                └─────────────────┘
```

### Data Flow with Persistent Storage
1. **Startup**: Load data from `data/pairs/{pair}_history.json` OR fetch from API if no local data
2. **Real-time**: Collect new data every 5 minutes, add to memory
3. **Periodic Save**: Save all data to disk every 5 minutes
4. **Graceful Shutdown**: Save all current data before stopping
5. **Dynamic Pairs**: New pairs immediately get storage files, removed pairs optionally delete files

### File Structure with Persistent Storage
```
trading-bot-core/
├── config/
│   ├── default.json          # Static default configuration
│   └── runtime.json          # Dynamic runtime configuration (auto-created)
├── data/
│   └── pairs/                # Persistent storage directory (auto-created)
│       ├── rvn_history.json      # Ravencoin historical data
│       ├── xmr_history.json      # Monero historical data
│       ├── bel_history.json      # Bella Protocol historical data
│       ├── doge_history.json     # Dogecoin historical data
│       ├── kas_history.json      # Kaspa historical data
│       └── sal_history.json      # SalmonSwap historical data
├── src/
│   ├── utils/
│   │   ├── ConfigManager.js       # Dynamic pair configuration management
│   │   ├── DataStorage.js         # Persistent storage management
│   │   ├── Logger.js              # Winston logging
│   │   └── index.js
│   ├── data/collectors/
│   │   ├── XeggexClient.js            # API client for Xeggex
│   │   ├── MarketDataCollector.js     # Real-time data collection with persistence
│   │   └── index.js
│   ├── strategies/
│   │   └── technical/
│   │       ├── TechnicalStrategies.js     # Main strategy engine
│   │       ├── indicators/                # Individual indicator implementations
│   │       │   ├── RSI.js
│   │       │   ├── MACD.js
│   │       │   ├── BollingerBands.js
│   │       │   ├── MovingAverage.js
│   │       │   ├── Volume.js
│   │       │   ├── Stochastic.js
│   │       │   ├── WilliamsR.js
│   │       │   ├── IchimokuCloud.js
│   │       │   ├── ADX.js
│   │       │   ├── CCI.js
│   │       │   ├── ParabolicSAR.js
│   │       │   └── index.js
│   │       └── index.js
│   ├── server/
│   │   └── ExpressApp.js                  # Express API server with all endpoints
│   └── main.js                            # Application entry point
└── scripts/
    ├── test-persistent-storage.js         # Test persistent storage
    ├── test-storage-integration.js        # Test storage integration
    ├── test-dynamic-pairs.js              # Test dynamic pair management
    ├── test-api-client.js                 # Test API client
    ├── test-data-collector.js             # Test data collection
    └── test-technical-strategies.js       # Test technical analysis
```

## 📊 Data Structures

### Persistent Storage File Format
```javascript
// Example: data/pairs/btc_history.json
{
  "pair": "BTC",
  "lastUpdated": 1674123456789,
  "dataPoints": 120,
  "history": {
    "closes": [45234.5, 45441.2, ...],     // Closing prices
    "highs": [45445.0, 45550.0, ...],      // High prices
    "lows": [45130.0, 45235.0, ...],       // Low prices  
    "prices": [45234.5, 45441.2, ...],     // Same as closes (compatibility)
    "volumes": [15420, 16830, ...],        // Trading volumes
    "timestamps": [1672531200000, ...]     // Unix timestamps
  }
}
```

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

### Configuration Format
```javascript
{
  "pairs": ["BTC", "ETH", "XMR", "RVN"],
  "lastUpdated": 1674123456789,
  "updatedBy": "dashboard",
  "totalPairs": 4
}
```

## 🚨 Error Handling

### API Error Responses
```javascript
// 404 - Pair not found
{
  "error": "Pair not found",
  "pair": "INVALID",
  "availablePairs": ["BTC", "ETH", "XMR", "RVN"],
  "timestamp": 1672531200000
}

// 400 - Invalid request
{
  "error": "Invalid request",
  "message": "pairs must be an array",
  "timestamp": 1672531200000
}

// 500 - Internal server error
{
  "error": "Internal server error",
  "message": "Calculation failed",
  "timestamp": 1672531200000
}
```

### Storage Error Handling
- **File Access Errors**: Graceful fallback to API preloading
- **Corrupted Data**: Validation and re-creation from API
- **Disk Space**: Automatic cleanup of old files
- **Permission Issues**: Clear error messages and fallback options

## 📈 Performance

### Optimization Features
- **Smart Data Loading**: Local storage first, API fallback only when needed
- **Periodic Saving**: Batched saves every 5 minutes for optimal I/O
- **In-memory data storage** for fast indicator calculations
- **Event-driven updates** to minimize unnecessary recalculations
- **Configurable data retention** to manage memory usage
- **Rate limiting** to respect API boundaries
- **Dynamic pair management** without server restarts

### Performance Metrics
- **Startup Time**: <5 seconds with local data, <30 seconds with API preload
- **API Response Time**: <50ms average
- **Memory Usage**: <512MB baseline, <1GB with full data retention
- **Storage Efficiency**: ~1-5KB per pair per day of data
- **Data Collection Success Rate**: 99%+ with automatic retry logic

### Monitoring
- Real-time health checks via `/api/health`
- Storage statistics via `/api/storage/stats`
- Memory usage tracking in system stats
- API request success/failure rates
- Data collection statistics and error rates
- Configuration change tracking

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
- Configuration file permissions
- Local storage files with appropriate permissions

## ⚠️ Important Notes

### Persistent Storage Behavior
1. **Smart Loading**: System tries local storage first, then API if no data exists
2. **Data Integrity**: Files include validation metadata and timestamps
3. **Automatic Cleanup**: Optional cleanup of files older than specified age
4. **Graceful Degradation**: Falls back to API if storage fails
5. **Performance**: Saves only every 5 minutes to optimize disk I/O

### Dynamic Pairs Behavior
1. **Data Collection**: New pairs start collecting data immediately but need ~5 minutes for technical analysis
2. **Historical Data**: Removed pairs can optionally preserve or delete stored files
3. **Configuration Persistence**: Changes are saved to `config/runtime.json` and survive restarts
4. **Fallback Mechanism**: If `runtime.json` is corrupted, system falls back to default pairs
5. **Validation**: Invalid pair formats are rejected with detailed error messages

### Performance Considerations
- **Memory Usage**: Each pair stores up to 1440 data points (5 days at 5-minute intervals)
- **Disk Usage**: ~1-5KB per pair per day, automatic cleanup available
- **API Rate Limits**: Respects Xeggex rate limits (100 requests/minute)
- **Real-time Updates**: Changes take effect immediately but full data collection may take minutes
- **Concurrent Operations**: Multiple pair operations can be performed simultaneously

## 🤝 Contributing

### Adding New Features
1. Follow existing code patterns and structure
2. Add comprehensive tests for new functionality
3. Update documentation and API examples
4. Ensure backward compatibility

### Code Standards
- ESLint configuration for consistent formatting
- Comprehensive error handling required
- JSDoc comments for all public methods
- Unit tests for all new functionality

## 📜 License

ISC License - See LICENSE file for details.

## 🔗 Related Repositories

- **[trading-bot-dashboard](https://github.com/makoshark2001/trading-bot-dashboard)** - Web interface with dynamic pair management
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

**Trading Bot Core API** - Market Data Collection & Technical Analysis Engine with Dynamic Pair Management & Persistent Storage  
*Part of the Trading Bot Ecosystem*