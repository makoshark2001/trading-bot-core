require('dotenv').config();
const express = require('express');
const path = require('path');
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
        // Serve static files from public directory
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
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
                    lastUpdate: this.lastUpdate
                };
                
                res.json(data);
            } catch (error) {
                Logger.error('Error in /api/data endpoint', { error: error.message });
                res.status(500).json({ 
                    error: 'Internal server error',
                    message: error.message 
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
                    return res.status(404).json({ error: 'Pair not found' });
                }
                
                res.json({
                    pair,
                    history,
                    strategies,
                    hasEnoughData: this.technicalStrategies.hasEnoughData(history)
                });
            } catch (error) {
                Logger.error(`Error getting data for pair ${req.params.pair}`, { 
                    error: error.message 
                });
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        
        // Health check endpoint
        this.app.get('/api/health', async (req, res) => {
            try {
                const apiHealth = await this.apiClient.healthCheck();
                const dataStats = this.dataCollector.getStats();
                
                res.json({
                    status: 'healthy',
                    timestamp: Date.now(),
                    uptime: this.getUptime(),
                    api: apiHealth,
                    dataCollection: {
                        isCollecting: dataStats.isCollecting,
                        totalDataPoints: dataStats.totalDataPoints,
                        successfulUpdates: dataStats.successfulUpdates,
                        failedUpdates: dataStats.failedUpdates
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
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
            pairs: config.get('trading.pairs').length
        };
    }
    
    async start() {
        try {
            Logger.info('Starting Trading Bot Server...');
            
            // Initialize data collection
            await this.dataCollector.initialize();
            
            // Start updating strategies for existing data
            const pairs = config.get('trading.pairs');
            pairs.forEach(pair => {
                this.updateStrategiesForPair(pair);
            });
            
            // Start HTTP server
            this.server = this.app.listen(this.port, () => {
                Logger.info(`Trading Bot Server running at http://localhost:${this.port}`);
                console.log(`🚀 Dashboard available at: http://localhost:${this.port}`);
                console.log(`📊 API health check: http://localhost:${this.port}/api/health`);
            });
            
        } catch (error) {
            Logger.error('Failed to start server', { error: error.message });
            process.exit(1);
        }
    }
    
    async stop() {
        Logger.info('Stopping Trading Bot Server...');
        
        if (this.dataCollector) {
            this.dataCollector.stop();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        Logger.info('Trading Bot Server stopped');
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