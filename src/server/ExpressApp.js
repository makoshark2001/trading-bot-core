require('dotenv').config();
const express = require('express');
const config = require('config');

const { XeggexClient, MarketDataCollector } = require('../data/collectors');
const { TechnicalStrategies } = require('../strategies/technical');
const { Logger } = require('../utils');

class TradingBotServer {
    constructor() {
        this.app = express();
        this.port = config.get('server.port') || 3000;
        this.startTime = Date.now();
        
        this.strategyResults = {};
        this.lastUpdate = null;
        
        this.initializeServices();
        this.setupRoutes();
        this.setupEventHandlers();
    }
    
    initializeServices() {
        Logger.info('Initializing services...');
        
        // Initialize API client
        this.apiClient = new XeggexClient(
            process.env.X_API,
            process.env.X_SECRET,
            config.get('api.xeggex')
        );
        
        // Initialize data collector
        this.dataCollector = new MarketDataCollector(
            this.apiClient,
            config.get('trading')
        );
        
        // Initialize technical strategies
        this.technicalStrategies = new TechnicalStrategies();
        
        Logger.info('Services initialized successfully');
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
                description: 'Market data collection and technical analysis engine',
                endpoints: {
                    health: '/api/health',
                    data: '/api/data',
                    pair: '/api/pair/:pair'
                },
                indicators: [
                    'RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume Analysis',
                    'Stochastic', 'Williams %R', 'Ichimoku Cloud', 'ADX', 'CCI', 'Parabolic SAR'
                ],
                documentation: 'https://github.com/makoshark2001/trading-bot-core'
            });
        });
        
        // API route for dashboard data
        this.app.get('/api/data', (req, res) => {
            try {
                const data = {
                    uptime: this.getUptime(),
                    pairs: config.get('trading.pairs'),
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
        
        // API route for individual pair data
        this.app.get('/api/pair/:pair', (req, res) => {
            try {
                const pair = req.params.pair.toUpperCase();
                const history = this.dataCollector.getHistoryForPair(pair);
                const strategies = this.strategyResults[pair];
                
                if (!history) {
                    return res.status(404).json({ 
                        error: 'Pair not found',
                        pair: pair,
                        availablePairs: config.get('trading.pairs'),
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
        this.app.get('/api/pair/:pair/indicator/:indicator', (req, res) => {
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
        
        // Catch-all for undefined routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                service: 'Trading Bot Core API',
                availableEndpoints: [
                    'GET /',
                    'GET /api/health',
                    'GET /api/data',
                    'GET /api/pair/:pair',
                    'GET /api/pair/:pair/indicator/:indicator'
                ],
                timestamp: Date.now()
            });
        });
    }
    
    setupEventHandlers() {
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
        
        // Handle API client events
        this.apiClient.on('requestError', ({ endpoint, error }) => {
            Logger.warn('API request failed', { endpoint, error: error.message });
        });
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
            pairs: config.get('trading.pairs').length,
            indicators: Object.keys(this.technicalStrategies.indicators).length
        };
    }
    
    async start() {
        try {
            Logger.info('Starting Trading Bot Core API Server...');
            
            // Initialize data collection
            await this.dataCollector.initialize();
            
            // Start updating strategies for existing data
            const pairs = config.get('trading.pairs');
            pairs.forEach(pair => {
                this.updateStrategiesForPair(pair);
            });
            
            // Start HTTP server
            this.server = this.app.listen(this.port, () => {
                Logger.info(`Trading Bot Core API Server running at http://localhost:${this.port}`);
                console.log(`🚀 Trading Bot Core API available at: http://localhost:${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
                console.log(`📡 Market data: http://localhost:${this.port}/api/data`);
                console.log(`🔍 Individual pair: http://localhost:${this.port}/api/pair/RVN`);
            });
            
        } catch (error) {
            Logger.error('Failed to start server', { error: error.message });
            process.exit(1);
        }
    }
    
    async stop() {
        Logger.info('Stopping Trading Bot Core API Server...');
        
        if (this.dataCollector) {
            this.dataCollector.stop();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        Logger.info('Trading Bot Core API Server stopped');
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