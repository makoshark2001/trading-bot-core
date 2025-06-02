# Trading Bot Core API

**Market Data Collection & Technical Analysis Engine with Dynamic Pair Management, Persistent Storage & Pair Discovery**

Core infrastructure providing real-time cryptocurrency market data collection, technical analysis, and RESTful API services for the trading bot ecosystem. Features **dynamic trading pair management**, **persistent local storage**, and **automatic pair discovery** - add, remove, and discover trading pairs without restarting the server, with data preserved across restarts.

## 🎯 Purpose

This is the **data and analysis engine** that powers the trading bot ecosystem. It provides:
- Real-time cryptocurrency market data collection from Xeggex
- 11 advanced technical indicators with ensemble analysis
- RESTful API for market data and technical analysis
- Signal generation and confidence scoring
- **Dynamic trading pair management** with dashboard-ready API endpoints
- **Persistent local storage** for faster startups and data continuity
- **Automatic pair discovery** from Xeggex exchange

## 🏗️ Architecture Role

This repository is **one component** of a larger trading bot ecosystem:
- **Core** (this repo): Market data collection, technical analysis, dynamic pair management, persistent storage, and pair discovery
- **Dashboard**: Web interface and real-time visualization  
- **ML**: Machine learning predictions and AI-enhanced signals
- **Backtest**: Strategy testing and historical validation
- **Risk**: Risk management and position sizing optimization
- **Execution**: Trade execution and order management

## 🚀 Features

### Automatic Pair Discovery
- **Live Exchange Data**: Discovers all available USDT trading pairs from Xeggex in real-time
- **Market Intelligence**: Shows price, volume, 24h change, and activity status for each pair
- **Smart Filtering**: Filter by volume, price range, tracked status, and activity
- **Validation**: Verify pair availability before adding to prevent errors
- **Dashboard Ready**: Complete API for building pair browser interfaces

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
  "description": "Market data collection and technical analysis engine with dynamic pair management, persistent storage, and pair discovery",
  "endpoints": {
    "health": "/api/health",
    "data": "/api/data", 
    "pairs": "/api/pairs",
    "pair": "/api/pair/:pair",
    "config": "/api/config",
    "availablePairs": "/api/available-pairs",
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
    "Ensemble signal generation",
    "Automatic pair discovery"
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

### Pair Discovery Endpoints

#### `GET /api/available-pairs`
Get all available USDT trading pairs from Xeggex exchange
```json
{
  "availablePairs": [
    {
      "pair": "BTC",
      "symbol": "BTC/USDT", 
      "name": "Bitcoin",
      "lastPrice": 43250.50,
      "volume24h": 1250000,
      "change24h": 2.5,
      "isActive": true,
      "isTracked": false,
      "canAdd": true
    },
    {
      "pair": "ETH",
      "symbol": "ETH/USDT",
      "name": "Ethereum", 
      "lastPrice": 2580.25,
      "volume24h": 980000,
      "change24h": -1.2,
      "isActive": true,
      "isTracked": true,
      "canAdd": false
    }
    // ... more pairs
  ],
  "totalAvailable": 150,
  "currentlyTracked": 6,
  "canAdd": 144,
  "timestamp": 1674123456789
}
```

**Response Fields:**
- `pair`: Base currency symbol (e.g., "BTC")
- `symbol`: Full trading pair symbol (e.g., "BTC/USDT")
- `name`: Human-readable name (e.g., "Bitcoin")
- `lastPrice`: Current price in USDT
- `volume24h`: 24-hour trading volume
- `change24h`: 24-hour price change percentage
- `isActive`: Whether the pair is active on the exchange
- `isTracked`: Whether this pair is currently being tracked
- `canAdd`: Whether this pair can be added (not already tracked)

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

#### `POST /api/storage/cleanup`
Clean up old data files
```bash
curl -X POST http://localhost:3000/api/storage/cleanup \
  -H "Content-Type: application/json" \
  -d '{"maxAgeHours": 168}'
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
npm run test:available-pairs  # Test pair discovery
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Get current configuration
curl http://localhost:3000/api/config

# Discover available pairs
curl http://localhost:3000/api/available-pairs

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
    // Pair Discovery
    async getAvailablePairs() {
        const response = await fetch(`${CORE_API_URL}/api/available-pairs`);
        return response.json();
    }
    
    async searchPairs(searchTerm) {
        const data = await this.getAvailablePairs();
        return data.availablePairs.filter(pair =>
            pair.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pair.name && pair.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    async getHighVolumePairs(minVolume = 100000) {
        const data = await this.getAvailablePairs();
        return data.availablePairs
            .filter(pair => pair.volume24h > minVolume && pair.canAdd)
            .sort((a, b) => b.volume24h - a.volume24h);
    }
    
    // Pair Management
    async getCurrentPairs() {
        const response = await fetch(`${CORE_API_URL}/api/config`);
        const data = await response.json();
        return data.config.pairs;
    }
    
    async addPairWithValidation(pairSymbol) {
        // Check if pair is available first
        const availableData = await this.getAvailablePairs();
        const pairInfo = availableData.availablePairs.find(p => p.pair === pairSymbol.toUpperCase());
        
        if (!pairInfo) {
            throw new Error(`Pair ${pairSymbol} is not available on Xeggex`);
        }
        
        if (pairInfo.isTracked) {
            throw new Error(`Pair ${pairSymbol} is already being tracked`);
        }
        
        if (!pairInfo.isActive) {
            throw new Error(`Pair ${pairSymbol} is not active on the exchange`);
        }
        
        const response = await fetch(`${CORE_API_URL}/api/config/pairs/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pair: pairSymbol,
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
    
    // Market Data
    async getMarketData() {
        const response = await fetch(`${CORE_API_URL}/api/data`);
        return response.json();
    }
}

// Usage example
const client = new TradingBotCoreClient();

// Discover and add pairs
const highVolumePairs = await client.getHighVolumePairs(50000);
console.log('High volume pairs available:', highVolumePairs.slice(0, 5));

await client.addPairWithValidation('BTC');
await client.addPairWithValidation('ETH');
```

### Python
```python
import requests

class TradingBotCoreClient:
    def __init__(self, core_api_url='http://localhost:3000'):
        self.core_api_url = core_api_url
    
    # Pair Discovery
    def get_available_pairs(self):
        response = requests.get(f'{self.core_api_url}/api/available-pairs')
        return response.json()
    
    def search_pairs(self, search_term):
        data = self.get_available_pairs()
        return [
            pair for pair in data['availablePairs']
            if search_term.lower() in pair['pair'].lower() or 
               (pair.get('name') and search_term.lower() in pair['name'].lower())
        ]
    
    def get_high_volume_pairs(self, min_volume=100000):
        data = self.get_available_pairs()
        pairs = [
            pair for pair in data['availablePairs']
            if pair.get('volume24h', 0) > min_volume and pair.get('canAdd', False)
        ]
        return sorted(pairs, key=lambda x: x.get('volume24h', 0), reverse=True)
    
    # Pair Management
    def add_pair_with_validation(self, pair_symbol, updated_by='python_client'):
        # Check availability first
        available_data = self.get_available_pairs()
        pair_info = next(
            (p for p in available_data['availablePairs'] if p['pair'] == pair_symbol.upper()),
            None
        )
        
        if not pair_info:
            raise ValueError(f'Pair {pair_symbol} is not available on Xeggex')
        
        if pair_info.get('isTracked'):
            raise ValueError(f'Pair {pair_symbol} is already being tracked')
        
        if not pair_info.get('isActive', True):
            raise ValueError(f'Pair {pair_symbol} is not active on the exchange')
        
        response = requests.post(
            f'{self.core_api_url}/api/config/pairs/add',
            json={'pair': pair_symbol, 'updatedBy': updated_by}
        )
        return response.json()

# Usage example
client = TradingBotCoreClient()

# Discover pairs
btc_pairs = client.search_pairs('BTC')
high_volume = client.get_high_volume_pairs(50000)

# Add pairs with validation
try:
    result = client.add_pair_with_validation('BTC')
    print(f"Added BTC: {result}")
except ValueError as e:
    print(f"Could not add BTC: {e}")
```

## 🏗️ Architecture & Design

### Event-Driven Data Processing with Pair Discovery
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Xeggex API    │───▶│ MarketDataCollector │───▶│ TechnicalStrategies │
│                 │    │                 │    │                 │
│ • Market List   │    │ • Dynamic Pairs │    │ • 11 Indicators │
│ • USDT Pairs    │    │ • Smart Loading │    │ • Ensemble      │
│ • Pair Details  │    │ • Periodic Save │    │   Signals       │
│ • Live Prices   │    │ • Add/Remove    │    │ • Confidence    │
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
                                │ • 15 Endpoints  │
                                │ • Pair Discovery│
                                │ • Dynamic Pairs │
                                │ • Storage Mgmt  │
                                └─────────────────┘
```

### Data Flow with Pair Discovery
1. **Discovery**: Query Xeggex API for all available USDT pairs
2. **Validation**: Check pair availability, activity status, and current tracking
3. **Selection**: Users can browse and select pairs to add
4. **Addition**: Add new pairs with immediate data collection
5. **Storage**: Persist configuration and start collecting historical data
6. **Analysis**: Calculate technical indicators as data accumulates

## 📊 Performance

### Optimization Features
- **Smart Pair Discovery**: Cache available pairs for 5 minutes to reduce API calls
- **Smart Data Loading**: Local storage first, API fallback only when needed
- **Periodic Saving**: Batched saves every 5 minutes for optimal I/O
- **In-memory data storage** for fast indicator calculations
- **Event-driven updates** to minimize unnecessary recalculations
- **Configurable data retention** to manage memory usage
- **Rate limiting** to respect API boundaries
- **Dynamic pair management** without server restarts

### Performance Metrics
- **Startup Time**: <5 seconds with local data, <30 seconds with API preload
- **API Response Time**: <50ms average across all endpoints
- **Pair Discovery**: <2 seconds to fetch all available pairs
- **Memory Usage**: <512MB baseline, <1GB with full data retention
- **Storage Efficiency**: ~1-5KB per pair per day of data
- **Data Collection Success Rate**: 99%+ with automatic retry logic

## 🔒 Security

### API Security
- CORS headers for cross-origin requests
- Input validation for all parameters
- Error message sanitization
- Rate limiting on API endpoints
- Pair validation against exchange data

### Data Security
- API credentials stored in environment variables
- No sensitive data in logs or responses
- Secure error handling without data leakage
- Configuration file permissions
- Local storage files with appropriate permissions

## ⚠️ Important Notes

### Pair Discovery Behavior
1. **Live Data**: Available pairs are fetched live from Xeggex API
2. **Caching**: Results cached briefly (5 minutes) for performance
3. **Validation**: All pair additions validated against live exchange data
4. **Format Handling**: Supports both "BTC/USDT" and "BTC_USDT" formats
5. **Activity Status**: Only active pairs are recommended for addition

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

- **[trading-bot-dashboard](https://github.com/makoshark2001/trading-bot-dashboard)** - Web interface with dynamic pair management and discovery
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

**Trading Bot Core API** - Market Data Collection & Technical Analysis Engine with Dynamic Pair Management, Persistent Storage & Automatic Pair Discovery  
*Part of the Trading Bot Ecosystem*