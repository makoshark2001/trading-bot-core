require('dotenv').config();
const express = require('express');
const config = require('config');

const { XeggexClient, MarketDataCollector } = require('../data/collectors');
const { TechnicalStrategies } = require('../strategies/technical');
const { Logger, ConfigManager } = require('../utils');

class TradingBotServer {
    constructor() {
        this.app = express();
        this.port = config.get('server.port') || 3000;
        this.startTime = Date.now();
        
        this.strategyResults = {};
        this.lastUpdate = null;
        
        this.setupRoutes();
        // Note: setupEventHandlers() is now called after services are initialized
    }
    
    async initializeServices() {
        try {
            Logger.info('Initializing services...');
            
            // Initialize configuration manager
            this.configManager = new ConfigManager();
            Logger.debug('ConfigManager initialized');
            
            // Load current pairs configuration
            const currentPairs = await this.configManager.getCurrentPairs();
            Logger.info('Loaded current trading pairs', { pairs: currentPairs });
            
            // Initialize API client
            this.apiClient = new XeggexClient(
                process.env.X_API,
                process.env.X_SECRET,
                config.get('api.xeggex')
            );
            Logger.debug('XeggexClient initialized');
            
            // Initialize data collector with current pairs
            const tradingConfig = {
                ...config.get('trading'),
                pairs: currentPairs  // Use dynamic pairs instead of static config
            };
            
            this.dataCollector = new MarketDataCollector(this.apiClient, tradingConfig);
            Logger.debug('MarketDataCollector initialized');
            
            // Initialize technical strategies
            this.technicalStrategies = new TechnicalStrategies();
            Logger.debug('TechnicalStrategies initialized');
            
            // Setup event handlers after all services are initialized
            this.setupEventHandlers();
            
            Logger.info('Services initialized successfully');
        } catch (error) {
            const errorMessage = error && error.message ? error.message : 'Unknown error during service initialization';
            Logger.error('Failed to initialize services', { 
                error: errorMessage,
                stack: error && error.stack ? error.stack : 'No stack trace available'
            });
            throw new Error(`Service initialization failed: ${errorMessage}`);
        }
    }
    
    setupRoutes() {
        // Enable JSON parsing for API requests
        this.app.use(express.json());
        
        // CORS headers for cross-service communication
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        
        // API documentation root
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Trading Bot Core API',
                version: '2.0.0',
                description: 'Market data collection and technical analysis engine with dynamic pair management and persistent storage',
                endpoints: {
                    health: '/api/health',
                    data: '/api/data',
                    pairs: '/api/pairs',
                    pair: '/api/pair/:pair',
                    config: '/api/config',
                    updatePairs: 'PUT /api/config/pairs',
                    addPair: 'POST /api/config/pairs/add',
                    removePair: 'DELETE /api/config/pairs/:pair',
                    reset: 'POST /api/config/reset',
                    storageStats: '/api/storage/stats',
                    forceSave: 'POST /api/storage/save',
                    cleanup: 'POST /api/storage/cleanup'
                },
                indicators: [
                    'RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume Analysis',
                    'Stochastic', 'Williams %R', 'Ichimoku Cloud', 'ADX', 'CCI', 'Parabolic SAR'
                ],
                features: [
                    'Real-time data collection',
                    'Dynamic pair management', 
                    'Persistent local storage',
                    '11 technical indicators',
                    'Ensemble signal generation'
                ],
                documentation: 'https://github.com/makoshark2001/trading-bot-core'
            });
        });
        
        // Configuration management endpoints
        this.app.get('/api/config', async (req, res) => {
            try {
                const configInfo = await this.configManager.getConfigInfo();
                res.json({
                    config: configInfo,
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error('Error getting configuration', { error: error.message });
                res.status(500).json({
                    error: 'Failed to get configuration',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        this.app.put('/api/config/pairs', async (req, res) => {
            try {
                const { pairs, updatedBy = 'dashboard' } = req.body;
                
                if (!pairs || !Array.isArray(pairs)) {
                    return res.status(400).json({
                        error: 'Invalid request',
                        message: 'pairs must be an array',
                        timestamp: Date.now()
                    });
                }
                
                // Update configuration
                const updateResult = await this.configManager.updatePairs(pairs, updatedBy);
                
                // Update data collector
                await this.dataCollector.updatePairs(pairs);
                
                // Clear strategy results for removed pairs
                const { removed } = updateResult.changes;
                removed.forEach(pair => {
                    delete this.strategyResults[pair];
                });
                
                // Update strategies for new pairs
                const { added } = updateResult.changes;
                setTimeout(() => {
                    added.forEach(pair => {
                        this.updateStrategiesForPair(pair);
                    });
                }, 5000); // Give time for data collection to start
                
                Logger.info('Trading pairs updated via API', updateResult);
                
                res.json({
                    success: true,
                    message: 'Trading pairs updated successfully',
                    ...updateResult,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error('Error updating trading pairs', { error: error.message });
                res.status(500).json({
                    error: 'Failed to update trading pairs',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        this.app.post('/api/config/pairs/add', async (req, res) => {
            try {
                const { pair, updatedBy = 'dashboard' } = req.body;
                
                if (!pair || typeof pair !== 'string') {
                    return res.status(400).json({
                        error: 'Invalid request',
                        message: 'pair must be a string',
                        timestamp: Date.now()
                    });
                }
                
                const normalizedPair = pair.toUpperCase();
                
                // Get current pairs and add new one
                const currentPairs = await this.configManager.getCurrentPairs();
                
                if (currentPairs.includes(normalizedPair)) {
                    return res.status(400).json({
                        error: 'Pair already exists',
                        pair: normalizedPair,
                        timestamp: Date.now()
                    });
                }
                
                const newPairs = [...currentPairs, normalizedPair];
                
                // Update configuration
                const updateResult = await this.configManager.updatePairs(newPairs, updatedBy);
                
                // Add to data collector
                await this.dataCollector.addPair(normalizedPair);
                
                // Update strategies for new pair after some time
                setTimeout(() => {
                    this.updateStrategiesForPair(normalizedPair);
                }, 5000);
                
                Logger.info('Trading pair added via API', { pair: normalizedPair });
                
                res.json({
                    success: true,
                    message: `Trading pair ${normalizedPair} added successfully`,
                    pair: normalizedPair,
                    totalPairs: newPairs.length,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error('Error adding trading pair', { error: error.message });
                res.status(500).json({
                    error: 'Failed to add trading pair',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        this.app.delete('/api/config/pairs/:pair', async (req, res) => {
            try {
                const pair = req.params.pair.toUpperCase();
                const { updatedBy = 'dashboard' } = req.body;
                
                // Get current pairs and remove the specified one
                const currentPairs = await this.configManager.getCurrentPairs();
                
                if (!currentPairs.includes(pair)) {
                    return res.status(404).json({
                        error: 'Pair not found',
                        pair: pair,
                        availablePairs: currentPairs,
                        timestamp: Date.now()
                    });
                }
                
                const newPairs = currentPairs.filter(p => p !== pair);
                
                // Update configuration
                const updateResult = await this.configManager.updatePairs(newPairs, updatedBy);
                
                // Remove from data collector
                await this.dataCollector.removePair(pair);
                
                // Clear strategy results
                delete this.strategyResults[pair];
                
                Logger.info('Trading pair removed via API', { pair });
                
                res.json({
                    success: true,
                    message: `Trading pair ${pair} removed successfully`,
                    pair: pair,
                    totalPairs: newPairs.length,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error('Error removing trading pair', { error: error.message });
                res.status(500).json({
                    error: 'Failed to remove trading pair',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        this.app.post('/api/config/reset', async (req, res) => {
            try {
                const { updatedBy = 'dashboard' } = req.body;
                
                // Reset to default pairs
                const resetResult = await this.configManager.resetToDefault();
                
                // Update data collector
                await this.dataCollector.updatePairs(resetResult.pairs);
                
                // Clear all strategy results and recalculate
                this.strategyResults = {};
                
                setTimeout(() => {
                    resetResult.pairs.forEach(pair => {
                        this.updateStrategiesForPair(pair);
                    });
                }, 5000);
                
                Logger.info('Trading pairs reset to default via API');
                
                res.json({
                    success: true,
                    message: 'Trading pairs reset to default successfully',
                    pairs: resetResult.pairs,
                    totalPairs: resetResult.pairs.length,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                Logger.error('Error resetting trading pairs', { error: error.message });
                res.status(500).json({
                    error: 'Failed to reset trading pairs',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // API route for dashboard data
        this.app.get('/api/data', async (req, res) => {
            try {
                const currentPairs = await this.configManager.getCurrentPairs();
                
                const data = {
                    uptime: this.getUptime(),
                    pairs: currentPairs,  // Use dynamic pairs
                    history: this.dataCollector.getAllHistory(),
                    strategyResults: this.strategyResults,
                    stats: this.getSystemStats(),
                    status: 'running',
                    lastUpdate: this.lastUpdate,
                    timestamp: Date.now()
                };
                
                res.json(data);
            } catch (error) {
                Logger.error('Error in /api/data endpoint', { error: error.message });
                res.status(500).json({ 
                    error: 'Internal server error',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // API route for available pairs list
        this.app.get('/api/pairs', async (req, res) => {
            try {
                const currentPairs = await this.configManager.getCurrentPairs();
                
                res.json({
                    pairs: currentPairs,  // Use dynamic pairs
                    total: currentPairs.length,
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error('Error in /api/pairs endpoint', { error: error.message });
                res.status(500).json({ 
                    error: 'Internal server error',
                    timestamp: Date.now()
                });
            }
        });
        
        // API route for individual pair data
        this.app.get('/api/pair/:pair', async (req, res) => {
            try {
                const pair = req.params.pair.toUpperCase();
                const currentPairs = await this.configManager.getCurrentPairs();
                const history = this.dataCollector.getHistoryForPair(pair);
                const strategies = this.strategyResults[pair];
                
                if (!history) {
                    return res.status(404).json({ 
                        error: 'Pair not found',
                        pair: pair,
                        availablePairs: currentPairs,  // Use dynamic pairs
                        timestamp: Date.now()
                    });
                }
                
                res.json({
                    pair,
                    history,
                    strategies,
                    hasEnoughData: this.technicalStrategies.hasEnoughData(history),
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error(`Error getting data for pair ${req.params.pair}`, { 
                    error: error.message 
                });
                res.status(500).json({ 
                    error: 'Internal server error',
                    pair: req.params.pair,
                    timestamp: Date.now()
                });
            }
        });
        
        // Health check endpoint
        this.app.get('/api/health', async (req, res) => {
            try {
                const apiHealth = await this.apiClient.healthCheck();
                const dataStats = this.dataCollector.getStats();
                
                res.json({
                    status: 'healthy',
                    service: 'Trading Bot Core',
                    version: '2.0.0',
                    timestamp: Date.now(),
                    uptime: this.getUptime(),
                    api: apiHealth,
                    dataCollection: {
                        isCollecting: dataStats.isCollecting,
                        totalDataPoints: dataStats.totalDataPoints,
                        successfulUpdates: dataStats.successfulUpdates,
                        failedUpdates: dataStats.failedUpdates,
                        pairs: dataStats.pairs,
                        dataPointsPerPair: dataStats.dataPointsPerPair
                    },
                    indicators: {
                        available: Object.keys(this.technicalStrategies.indicators),
                        count: Object.keys(this.technicalStrategies.indicators).length
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    service: 'Trading Bot Core',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // API route for specific indicator data
        this.app.get('/api/pair/:pair/indicator/:indicator', async (req, res) => {
            try {
                const pair = req.params.pair.toUpperCase();
                const indicator = req.params.indicator.toLowerCase();
                
                const strategies = this.strategyResults[pair];
                if (!strategies || !strategies[indicator]) {
                    return res.status(404).json({
                        error: 'Indicator data not found',
                        pair: pair,
                        indicator: indicator,
                        availableIndicators: strategies ? Object.keys(strategies) : [],
                        timestamp: Date.now()
                    });
                }
                
                res.json({
                    pair,
                    indicator,
                    data: strategies[indicator],
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error(`Error getting ${req.params.indicator} for ${req.params.pair}`, {
                    error: error.message
                });
                res.status(500).json({
                    error: 'Internal server error',
                    timestamp: Date.now()
                });
            }
        });

        // Storage management endpoints
        this.app.get('/api/storage/stats', async (req, res) => {
            try {
                const stats = await this.dataCollector.getStorageStats();
                res.json({
                    storage: stats,
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error('Error getting storage stats', { error: error.message });
                res.status(500).json({
                    error: 'Failed to get storage statistics',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });

        this.app.post('/api/storage/save', async (req, res) => {
            try {
                await this.dataCollector.forceSave();
                res.json({
                    success: true,
                    message: 'Data saved successfully',
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error('Error forcing save', { error: error.message });
                res.status(500).json({
                    error: 'Failed to save data',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });

        this.app.post('/api/storage/cleanup', async (req, res) => {
            try {
                const { maxAgeHours = 168 } = req.body; // Default 7 days
                const cleanedCount = await this.dataCollector.cleanupOldData(maxAgeHours);
                res.json({
                    success: true,
                    message: `Cleaned up ${cleanedCount} old data files`,
                    cleanedCount,
                    maxAgeHours,
                    timestamp: Date.now()
                });
            } catch (error) {
                Logger.error('Error cleaning up data', { error: error.message });
                res.status(500).json({
                    error: 'Failed to cleanup data',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // Catch-all for undefined routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                service: 'Trading Bot Core API',
                availableEndpoints: [
                    'GET /',
                    'GET /api/health',
                    'GET /api/data',
                    'GET /api/pairs',
                    'GET /api/pair/:pair',
                    'GET /api/pair/:pair/indicator/:indicator',
                    'GET /api/config',
                    'PUT /api/config/pairs',
                    'POST /api/config/pairs/add',
                    'DELETE /api/config/pairs/:pair',
                    'POST /api/config/reset',
                    'GET /api/storage/stats',
                    'POST /api/storage/save',
                    'POST /api/storage/cleanup'
                ],
                timestamp: Date.now()
            });
        });
    }
    
    setupEventHandlers() {
        // Only set up event handlers if dataCollector exists
        if (!this.dataCollector) {
            Logger.warn('DataCollector not initialized, skipping event handler setup');
            return;
        }
        
        // Update strategies when new data arrives
        this.dataCollector.on('newData', ({ pair }) => {
            this.updateStrategiesForPair(pair);
        });
        
        // Handle data collection events
        this.dataCollector.on('dataError', (error) => {
            Logger.error('Data collection error', { error: error.message });
        });
        
        this.dataCollector.on('collectionRoundComplete', ({ successful, failed }) => {
            Logger.debug('Data collection round completed', { successful, failed });
            this.lastUpdate = new Date().toISOString();
        });
        
        // Handle pair management events
        this.dataCollector.on('pairAdded', ({ pair }) => {
            Logger.info(`Pair ${pair} added to data collection`);
        });
        
        this.dataCollector.on('pairRemoved', ({ pair }) => {
            Logger.info(`Pair ${pair} removed from data collection`);
        });
        
        this.dataCollector.on('pairsUpdated', ({ oldPairs, newPairs, changes }) => {
            Logger.info('Data collection pairs updated', { oldPairs, newPairs, changes });
        });
        
        // Handle API client events
        if (this.apiClient) {
            this.apiClient.on('requestError', ({ endpoint, error }) => {
                Logger.warn('API request failed', { endpoint, error: error.message });
            });
        }
        
        Logger.debug('Event handlers setup completed');
    }
    
    updateStrategiesForPair(pair) {
        try {
            const data = this.dataCollector.getHistoryForPair(pair);
            
            if (data && this.technicalStrategies.hasEnoughData(data, 15)) {
                this.strategyResults[pair] = this.technicalStrategies.calculateAll(data);
                
                Logger.debug(`Updated strategies for ${pair}`, {
                    indicators: Object.keys(this.strategyResults[pair]),
                    rsiValue: this.strategyResults[pair].rsi?.value,
                    rsiSuggestion: this.strategyResults[pair].rsi?.suggestion
                });
            }
        } catch (error) {
            Logger.error(`Error updating strategies for ${pair}`, { 
                error: error.message 
            });
        }
    }
    
    getUptime() {
        const uptimeMs = Date.now() - this.startTime;
        const hours = Math.floor(uptimeMs / 3600000);
        const minutes = Math.floor((uptimeMs % 3600000) / 60000);
        const seconds = Math.floor((uptimeMs % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    getSystemStats() {
        const dataStats = this.dataCollector.getStats();
        const strategyStats = this.technicalStrategies.getStats();
        
        return {
            dataCollection: dataStats,
            strategies: strategyStats,
            memory: process.memoryUsage(),
            pairs: this.dataCollector.config.pairs.length,
            indicators: Object.keys(this.technicalStrategies.indicators).length
        };
    }
    
    async start() {
        try {
            Logger.info('Starting Trading Bot Core API Server...');
            
            // Initialize services (now async)
            await this.initializeServices();
            
            // Initialize data collection
            await this.dataCollector.initialize();
            
            // Start updating strategies for existing data
            const currentPairs = await this.configManager.getCurrentPairs();
            currentPairs.forEach(pair => {
                this.updateStrategiesForPair(pair);
            });
            
            // Start HTTP server
            this.server = this.app.listen(this.port, () => {
                Logger.info(`Trading Bot Core API Server running at http://localhost:${this.port}`);
                console.log(`🚀 Trading Bot Core API available at: http://localhost:${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
                console.log(`📡 Market data: http://localhost:${this.port}/api/data`);
                console.log(`📋 Available pairs: http://localhost:${this.port}/api/pairs`);
                console.log(`⚙️  Configuration: http://localhost:${this.port}/api/config`);
                console.log(`🔍 Individual pair: http://localhost:${this.port}/api/pair/RVN`);
            });
            
        } catch (error) {
            const errorMessage = error && error.message ? error.message : 'Unknown error occurred';
            Logger.error('Failed to start server', { 
                error: errorMessage,
                stack: error && error.stack ? error.stack : 'No stack trace available'
            });
            console.error('Fatal error:', errorMessage);
            if (error && error.stack) {
                console.error('Stack trace:', error.stack);
            }
            process.exit(1);
        }
    }
    
    async stop() {
        Logger.info('Stopping Trading Bot Core API Server...');
        
        try {
            if (this.dataCollector) {
                Logger.info('💾 Stopping data collector and saving final data...');
                await this.dataCollector.stop();
                Logger.info('✅ Data collector stopped and data saved');
            }
            
            if (this.server) {
                Logger.info('🔌 Closing HTTP server...');
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
                Logger.info('✅ HTTP server closed');
            }
            
            Logger.info('✅ Trading Bot Core API Server stopped gracefully');
        } catch (error) {
            Logger.error('❌ Error during server shutdown', { error: error.message });
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    if (global.tradingBotServer) {
        await global.tradingBotServer.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    if (global.tradingBotServer) {
        await global.tradingBotServer.stop();
    }
    process.exit(0);
});

module.exports = TradingBotServer;