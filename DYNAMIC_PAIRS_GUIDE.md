# Dynamic Trading Pairs Management

The trading-bot-core now supports dynamic management of trading pairs through API endpoints. You can add, remove, and modify trading pairs without restarting the server.

## 🎯 Features

- **Runtime Configuration**: Pairs are stored in `config/runtime.json` and persist between restarts
- **Live Updates**: Changes take effect immediately without server restart
- **Data Preservation**: Historical data is preserved when removing/adding pairs
- **Dashboard Integration**: API endpoints designed for dashboard integration
- **Validation**: Input validation ensures pair format correctness
- **Fallback**: Automatic fallback to default pairs if configuration fails

## 📡 API Endpoints

### Get Current Configuration
```bash
GET /api/config
```

**Response:**
```json
{
  "config": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "lastUpdated": 1674123456789,
    "updatedBy": "dashboard",
    "totalPairs": 6
  },
  "timestamp": 1674123456789
}
```

### Update All Trading Pairs
```bash
PUT /api/config/pairs
Content-Type: application/json

{
  "pairs": ["BTC", "ETH", "XMR", "RVN"],
  "updatedBy": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trading pairs updated successfully",
  "oldPairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
  "newPairs": ["BTC", "ETH", "XMR", "RVN"],
  "changes": {
    "added": ["BTC", "ETH"],
    "removed": ["BEL", "DOGE", "KAS", "SAL"]
  },
  "timestamp": 1674123456789
}
```

### Add Single Trading Pair
```bash
POST /api/config/pairs/add
Content-Type: application/json

{
  "pair": "LTC",
  "updatedBy": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trading pair LTC added successfully",
  "pair": "LTC",
  "totalPairs": 7,
  "timestamp": 1674123456789
}
```

### Remove Single Trading Pair
```bash
DELETE /api/config/pairs/RVN
Content-Type: application/json

{
  "updatedBy": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trading pair RVN removed successfully",
  "pair": "RVN",
  "totalPairs": 5,
  "timestamp": 1674123456789
}
```

### Reset to Default Pairs
```bash
POST /api/config/reset
Content-Type: application/json

{
  "updatedBy": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trading pairs reset to default successfully",
  "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
  "totalPairs": 6,
  "timestamp": 1674123456789
}
```

## 🛠️ Usage Examples

### JavaScript/Node.js Dashboard Integration

```javascript
const CORE_API_URL = 'http://localhost:3000';

class TradingPairsManager {
    async getCurrentPairs() {
        const response = await fetch(`${CORE_API_URL}/api/config`);
        const data = await response.json();
        return data.config.pairs;
    }
    
    async updatePairs(newPairs) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pairs: newPairs,
                updatedBy: 'dashboard'
            })
        });
        
        return response.json();
    }
    
    async addPair(pair) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pair: pair,
                updatedBy: 'dashboard'
            })
        });
        
        return response.json();
    }
    
    async removePair(pair) {
        const response = await fetch(`${CORE_API_URL}/api/config/pairs/${pair}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                updatedBy: 'dashboard'
            })
        });
        
        return response.json();
    }
    
    async resetToDefault() {
        const response = await fetch(`${CORE_API_URL}/api/config/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                updatedBy: 'dashboard'
            })
        });
        
        return response.json();
    }
}

// Usage example
const pairsManager = new TradingPairsManager();

// Add a new pair
await pairsManager.addPair('BTC');

// Update all pairs
await pairsManager.updatePairs(['BTC', 'ETH', 'XMR']);

// Remove a pair
await pairsManager.removePair('ETH');

// Reset to defaults
await pairsManager.resetToDefault();
```

### Python Dashboard Integration

```python
import requests
import json

class TradingPairsManager:
    def __init__(self, core_api_url='http://localhost:3000'):
        self.core_api_url = core_api_url
    
    def get_current_pairs(self):
        response = requests.get(f'{self.core_api_url}/api/config')
        return response.json()['config']['pairs']
    
    def update_pairs(self, new_pairs, updated_by='dashboard'):
        response = requests.put(
            f'{self.core_api_url}/api/config/pairs',
            json={
                'pairs': new_pairs,
                'updatedBy': updated_by
            }
        )
        return response.json()
    
    def add_pair(self, pair, updated_by='dashboard'):
        response = requests.post(
            f'{self.core_api_url}/api/config/pairs/add',
            json={
                'pair': pair,
                'updatedBy': updated_by
            }
        )
        return response.json()
    
    def remove_pair(self, pair, updated_by='dashboard'):
        response = requests.delete(
            f'{self.core_api_url}/api/config/pairs/{pair}',
            json={'updatedBy': updated_by}
        )
        return response.json()
    
    def reset_to_default(self, updated_by='dashboard'):
        response = requests.post(
            f'{self.core_api_url}/api/config/reset',
            json={'updatedBy': updated_by}
        )
        return response.json()

# Usage example
pairs_manager = TradingPairsManager()

# Get current pairs
current_pairs = pairs_manager.get_current_pairs()
print(f"Current pairs: {current_pairs}")

# Add a new pair
result = pairs_manager.add_pair('BTC')
print(f"Added BTC: {result['success']}")

# Update all pairs
result = pairs_manager.update_pairs(['BTC', 'ETH', 'XMR'])
print(f"Updated pairs: {result['newPairs']}")
```

### curl Examples

```bash
# Get current configuration
curl http://localhost:3000/api/config

# Add a new pair
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "BTC", "updatedBy": "manual"}'

# Update all pairs
curl -X PUT http://localhost:3000/api/config/pairs \
  -H "Content-Type: application/json" \
  -d '{"pairs": ["BTC", "ETH", "XMR", "RVN"], "updatedBy": "manual"}'

# Remove a pair
curl -X DELETE http://localhost:3000/api/config/pairs/ETH \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "manual"}'

# Reset to defaults
curl -X POST http://localhost:3000/api/config/reset \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "manual"}'
```

## 📁 File Structure

The dynamic pairs feature adds these files:

```
config/
├── default.json          # Static configuration (unchanged)
└── runtime.json          # Dynamic runtime configuration (auto-created)

src/
├── utils/
│   ├── ConfigManager.js   # NEW: Manages runtime configuration
│   └── index.js          # Updated: Exports ConfigManager
├── data/collectors/
│   └── MarketDataCollector.js  # Updated: Dynamic pair methods
└── server/
    └── ExpressApp.js     # Updated: Dynamic pair API endpoints

scripts/
└── test-dynamic-pairs.js # NEW: Test script for dynamic pairs
```

## 🔄 How It Works

1. **Initialization**: On startup, ConfigManager loads or creates `config/runtime.json`
2. **API Calls**: Dashboard makes HTTP requests to modify pairs
3. **Configuration Update**: ConfigManager validates and saves new configuration
4. **Data Collector Update**: MarketDataCollector adds/removes pairs dynamically
5. **Strategy Updates**: Technical strategies are recalculated for new pairs
6. **Persistence**: Changes are saved to `config/runtime.json` and persist across restarts

## 🧪 Testing

Test the dynamic pairs functionality:

```bash
# Test the ConfigManager directly
npm run test:pairs

# Test all functionality including dynamic pairs
npm run test:all

# Start the server and test API endpoints
npm start

# In another terminal, test the API
curl http://localhost:3000/api/config
```

## ⚠️ Important Notes

1. **Pair Format**: Pairs must be 2-10 characters, alphanumeric, uppercase (e.g., "BTC", "ETH")
2. **Data Collection**: New pairs start collecting data immediately, but need ~5 minutes for technical analysis
3. **Historical Data**: Removed pairs lose their data, added pairs start fresh
4. **Validation**: Invalid pair formats are rejected with error messages
5. **Fallback**: If `runtime.json` is corrupted, system falls back to default pairs
6. **Performance**: Changes take effect immediately but may take a few minutes for full data collection

## 🔧 Configuration Files

### Default Configuration (`config/default.json`)
```json
{
  "trading": {
    "pairs": ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"],
    "dataRetention": 1440,
    "updateInterval": 300000
  }
}
```

### Runtime Configuration (`config/runtime.json`) - Auto-generated
```json
{
  "trading": {
    "pairs": ["BTC", "ETH", "XMR", "RVN"],
    "lastUpdated": 1674123456789,
    "updatedBy": "dashboard"
  }
}
```

## 🚀 Getting Started

### Step 1: Create the Files

1. **Create ConfigManager**: Save the `ConfigManager.js` file to `src/utils/ConfigManager.js`
2. **Update utils index**: Replace `src/utils/index.js` with the updated version
3. **Update MarketDataCollector**: Replace `src/data/collectors/MarketDataCollector.js` with the updated version
4. **Update ExpressApp**: Replace `src/server/ExpressApp.js` with the updated version
5. **Update package.json**: Replace `package.json` with the updated version
6. **Create test script**: Save the test script to `scripts/test-dynamic-pairs.js`

### Step 2: Test the Implementation

```bash
# Test the ConfigManager functionality
npm run test:pairs

# Start the server
npm start

# In another terminal, test the API endpoints
curl http://localhost:3000/api/config
curl -X POST http://localhost:3000/api/config/pairs/add \
  -H "Content-Type: application/json" \
  -d '{"pair": "BTC"}'
```

### Step 3: Verify Dynamic Pairs Work

1. **Check initial pairs**: `curl http://localhost:3000/api/pairs`
2. **Add a pair**: Use POST to `/api/config/pairs/add`
3. **Verify addition**: Check `/api/pairs` again
4. **Check data collection**: Look for new pair in `/api/data`
5. **Remove a pair**: Use DELETE to `/api/config/pairs/:pair`
6. **Reset**: Use POST to `/api/config/reset`

## 🎯 Dashboard Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const TradingPairsManager = () => {
    const [pairs, setPairs] = useState([]);
    const [newPair, setNewPair] = useState('');
    const [loading, setLoading] = useState(false);
    
    const API_BASE = 'http://localhost:3000';
    
    useEffect(() => {
        loadCurrentPairs();
    }, []);
    
    const loadCurrentPairs = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/config`);
            const data = await response.json();
            setPairs(data.config.pairs);
        } catch (error) {
            console.error('Failed to load pairs:', error);
        }
    };
    
    const addPair = async () => {
        if (!newPair.trim()) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/config/pairs/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pair: newPair.toUpperCase(),
                    updatedBy: 'dashboard'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                setNewPair('');
                loadCurrentPairs();
            } else {
                alert('Failed to add pair: ' + result.message);
            }
        } catch (error) {
            alert('Error adding pair: ' + error.message);
        }
        setLoading(false);
    };
    
    const removePair = async (pair) => {
        if (!confirm(`Remove ${pair}?`)) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/config/pairs/${pair}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updatedBy: 'dashboard' })
            });
            
            const result = await response.json();
            if (result.success) {
                loadCurrentPairs();
            } else {
                alert('Failed to remove pair: ' + result.message);
            }
        } catch (error) {
            alert('Error removing pair: ' + error.message);
        }
        setLoading(false);
    };
    
    const resetToDefault = async () => {
        if (!confirm('Reset to default pairs?')) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/config/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updatedBy: 'dashboard' })
            });
            
            const result = await response.json();
            if (result.success) {
                loadCurrentPairs();
            }
        } catch (error) {
            alert('Error resetting pairs: ' + error.message);
        }
        setLoading(false);
    };
    
    return (
        <div className="trading-pairs-manager">
            <h3>Trading Pairs Management</h3>
            
            <div className="add-pair">
                <input
                    type="text"
                    value={newPair}
                    onChange={(e) => setNewPair(e.target.value)}
                    placeholder="Enter pair (e.g., BTC)"
                    disabled={loading}
                />
                <button onClick={addPair} disabled={loading || !newPair.trim()}>
                    Add Pair
                </button>
            </div>
            
            <div className="current-pairs">
                <h4>Current Pairs ({pairs.length})</h4>
                <div className="pairs-list">
                    {pairs.map(pair => (
                        <div key={pair} className="pair-item">
                            <span>{pair}</span>
                            <button 
                                onClick={() => removePair(pair)}
                                disabled={loading}
                                className="remove-btn"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={resetToDefault}
                disabled={loading}
                className="reset-btn"
            >
                Reset to Default
            </button>
            
            {loading && <p>Processing...</p>}
        </div>
    );
};

export default TradingPairsManager;
```

### Vue.js Component Example

```vue
<template>
  <div class="trading-pairs-manager">
    <h3>Trading Pairs Management</h3>
    
    <div class="add-pair">
      <input
        v-model="newPair"
        @keyup.enter="addPair"
        placeholder="Enter pair (e.g., BTC)"
        :disabled="loading"
      />
      <button @click="addPair" :disabled="loading || !newPair.trim()">
        Add Pair
      </button>
    </div>
    
    <div class="current-pairs">
      <h4>Current Pairs ({{ pairs.length }})</h4>
      <div class="pairs-list">
        <div v-for="pair in pairs" :key="pair" class="pair-item">
          <span>{{ pair }}</span>
          <button @click="removePair(pair)" :disabled="loading">
            Remove
          </button>
        </div>
      </div>
    </div>
    
    <button @click="resetToDefault" :disabled="loading">
      Reset to Default
    </button>
    
    <p v-if="loading">Processing...</p>
  </div>
</template>

<script>
export default {
  name: 'TradingPairsManager',
  data() {
    return {
      pairs: [],
      newPair: '',
      loading: false,
      API_BASE: 'http://localhost:3000'
    };
  },
  mounted() {
    this.loadCurrentPairs();
  },
  methods: {
    async loadCurrentPairs() {
      try {
        const response = await fetch(`${this.API_BASE}/api/config`);
        const data = await response.json();
        this.pairs = data.config.pairs;
      } catch (error) {
        console.error('Failed to load pairs:', error);
      }
    },
    
    async addPair() {
      if (!this.newPair.trim()) return;
      
      this.loading = true;
      try {
        const response = await fetch(`${this.API_BASE}/api/config/pairs/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pair: this.newPair.toUpperCase(),
            updatedBy: 'dashboard'
          })
        });
        
        const result = await response.json();
        if (result.success) {
          this.newPair = '';
          this.loadCurrentPairs();
        } else {
          alert('Failed to add pair: ' + result.message);
        }
      } catch (error) {
        alert('Error adding pair: ' + error.message);
      }
      this.loading = false;
    },
    
    async removePair(pair) {
      if (!confirm(`Remove ${pair}?`)) return;
      
      this.loading = true;
      try {
        const response = await fetch(`${this.API_BASE}/api/config/pairs/${pair}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updatedBy: 'dashboard' })
        });
        
        const result = await response.json();
        if (result.success) {
          this.loadCurrentPairs();
        } else {
          alert('Failed to remove pair: ' + result.message);
        }
      } catch (error) {
        alert('Error removing pair: ' + error.message);
      }
      this.loading = false;
    },
    
    async resetToDefault() {
      if (!confirm('Reset to default pairs?')) return;
      
      this.loading = true;
      try {
        const response = await fetch(`${this.API_BASE}/api/config/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updatedBy: 'dashboard' })
        });
        
        const result = await response.json();
        if (result.success) {
          this.loadCurrentPairs();
        }
      } catch (error) {
        alert('Error resetting pairs: ' + error.message);
      }
      this.loading = false;
    }
  }
};
</script>
```

## 🔍 Troubleshooting

### Common Issues

1. **Pairs not updating**: Check server logs for errors, verify API endpoints are accessible
2. **Invalid pair format**: Ensure pairs are 2-10 characters, alphanumeric only
3. **Data not collecting**: Wait 5-10 minutes for new pairs to start collecting data
4. **Configuration lost**: Check if `config/runtime.json` exists and is valid JSON
5. **API errors**: Verify Content-Type headers and JSON body format

### Debug Commands

```bash
# Check current configuration
curl http://localhost:3000/api/config

# Check system health
curl http://localhost:3000/api/health

# View server logs
npm run pm2:logs

# Test configuration manager
npm run test:pairs

# Check if runtime config exists
ls -la config/runtime.json
cat config/runtime.json
```

### Error Messages

- **"Pairs must be a non-empty array"**: Ensure you're sending an array of strings
- **"Invalid pair format detected"**: Check pair naming (2-10 chars, alphanumeric)
- **"Pair already exists"**: The pair is already in the configuration
- **"Pair not found"**: Trying to remove a pair that doesn't exist
- **"Failed to save configuration"**: File system permissions or disk space issue

## 🎉 Summary

You now have a fully functional dynamic trading pairs management system! The key benefits:

- ✅ **No server restarts** needed for pair changes
- ✅ **Persistent configuration** survives restarts
- ✅ **Dashboard-ready API** for easy integration
- ✅ **Data preservation** for existing pairs
- ✅ **Input validation** prevents errors
- ✅ **Comprehensive testing** ensures reliability

The system is production-ready and can be integrated with any dashboard framework. All changes are logged and tracked for audit purposes.