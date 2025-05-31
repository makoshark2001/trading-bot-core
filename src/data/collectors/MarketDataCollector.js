const EventEmitter = require('events');
const { Logger } = require('../../utils');
const { DataValidator } = require('../validators');

class MarketDataCollector extends EventEmitter {
    constructor(apiClient, config = {}) {
        super();
        this.apiClient = apiClient;
        this.config = {
            pairs: ["XMR","RVN", "BEL", "DOGE","KAS","SAL"],
            updateInterval: 300000, // 5 minutes
            dataRetention: 1440, // Keep 1440 data points (about 5 days at 5min intervals)
            ...config
        };
        
        this.history = {};
        this.isCollecting = false;
        this.collectionInterval = null;
        this.stats = {
            totalDataPoints: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            lastUpdate: null
        };
        
        this.setupEventHandlers();
        
        Logger.info('MarketDataCollector initialized', {
            pairs: this.config.pairs,
            updateInterval: this.config.updateInterval,
            dataRetention: this.config.dataRetention
        });
    }
    
    setupEventHandlers() {
        this.apiClient.on('requestError', (error) => {
            this.emit('dataError', error);
            this.stats.failedUpdates++;
        });
        
        this.apiClient.on('requestSuccess', () => {
            this.stats.successfulUpdates++;
        });
    }
    
    async initialize() {
        Logger.info('Initializing market data collector...');
        
        try {
            await this.preloadHistoricalData();
            this.startRealTimeCollection();
            
            Logger.info('Market data collector initialized successfully', {
                totalPairs: this.config.pairs.length,
                totalDataPoints: this.stats.totalDataPoints
            });
            
            this.emit('initialized');
        } catch (error) {
            Logger.error('Failed to initialize market data collector', { error: error.message });
            this.emit('initializationError', error);
            throw error;
        }
    }
    
    async preloadHistoricalData() {
        Logger.info('Preloading historical data...');
        
        for (const pair of this.config.pairs) {
            try {
                Logger.debug(`Preloading data for ${pair}...`);
                
                const response = await this.apiClient.getCandles(`${pair}_USDT`, 5, 180);
                
                this.initializeHistoryForPair(pair);
                
                if (response.bars && Array.isArray(response.bars)) {
                    let validBars = 0;
                    
                    response.bars.forEach(bar => {
                        const dataPoint = {
                            timestamp: bar.time,
                            close: parseFloat(bar.close),
                            high: parseFloat(bar.high),
                            low: parseFloat(bar.low),
                            volume: parseFloat(bar.volume)
                        };
                        
                        if (this.addDataPoint(pair, dataPoint, false)) {
                            validBars++;
                        }
                    });
                    
                    Logger.info(`Preloaded ${validBars} data points for ${pair}`);
                    this.emit('dataPreloaded', { 
                        pair, 
                        dataPoints: validBars,
                        totalPoints: this.history[pair].closes.length 
                    });
                }
                
            } catch (error) {
                Logger.error(`Error preloading data for ${pair}`, { 
                    pair, 
                    error: error.message 
                });
                this.emit('preloadError', { pair, error });
            }
        }
        
        Logger.info('Historical data preload completed', {
            totalDataPoints: this.stats.totalDataPoints
        });
    }
    
    initializeHistoryForPair(pair) {
        if (!this.history[pair]) {
            this.history[pair] = {
                closes: [],
                highs: [],
                lows: [],
                prices: [], // Same as closes, for backwards compatibility
                volumes: [],
                timestamps: []
            };
            
            Logger.debug(`Initialized history for ${pair}`);
        }
    }
    
    addDataPoint(pair, data, emitEvent = true) {
        if (!DataValidator.isValidPriceData(data)) {
            Logger.warn(`Invalid data for ${pair}`, { data });
            return false;
        }
        
        const history = this.history[pair];
        if (!history) {
            Logger.error(`No history initialized for ${pair}`);
            return false;
        }
        
        // Add the data point
        history.closes.push(data.close);
        history.highs.push(data.high);
        history.lows.push(data.low);
        history.prices.push(data.close); // Backwards compatibility
        history.volumes.push(data.volume);
        history.timestamps.push(data.timestamp);
        
        // Maintain data retention limit
        this.trimHistory(pair);
        
        this.stats.totalDataPoints++;
        this.stats.lastUpdate = new Date();
        
        if (emitEvent) {
            Logger.debug(`New data point added for ${pair}`, {
                price: data.close,
                volume: data.volume,
                timestamp: new Date(data.timestamp).toISOString()
            });
            
            this.emit('newData', { pair, data });
        }
        
        return true;
    }
    
    trimHistory(pair) {
        const history = this.history[pair];
        const maxLength = this.config.dataRetention;
        
        Object.keys(history).forEach(key => {
            if (history[key].length > maxLength) {
                const removedCount = history[key].length - maxLength;
                history[key] = history[key].slice(-maxLength);
                
                if (removedCount > 0) {
                    Logger.debug(`Trimmed ${removedCount} old data points for ${pair}.${key}`);
                }
            }
        });
    }
    
    startRealTimeCollection() {
        if (this.isCollecting) {
            Logger.warn('Real-time collection already running');
            return;
        }
        
        this.isCollecting = true;
        Logger.info('Starting real-time data collection', {
            interval: this.config.updateInterval,
            pairs: this.config.pairs
        });
        
        // Start collection immediately, then at intervals
        this.collectCurrentData();
        
        this.collectionInterval = setInterval(async () => {
            await this.collectCurrentData();
        }, this.config.updateInterval);
        
        this.emit('collectionStarted');
    }
    
    async collectCurrentData() {
        Logger.debug('Collecting current market data...');
        
        const promises = this.config.pairs.map(pair => this.fetchCurrentData(pair));
        const results = await Promise.allSettled(promises);
        
        let successful = 0;
        let failed = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successful++;
            } else {
                failed++;
                Logger.error(`Failed to fetch data for ${this.config.pairs[index]}`, {
                    error: result.reason?.message
                });
            }
        });
        
        Logger.debug(`Data collection round completed`, {
            successful,
            failed,
            total: this.config.pairs.length
        });
        
        this.emit('collectionRoundComplete', { successful, failed });
    }
    
    async fetchCurrentData(pair) {
        try {
            const response = await this.apiClient.getMarket(`${pair}_USDT`);
            
            if (response && response.lastPriceNumber) {
                const data = {
                    timestamp: Date.now(),
                    close: parseFloat(response.lastPriceNumber),
                    high: parseFloat(response.highPriceNumber) || parseFloat(response.lastPriceNumber),
                    low: parseFloat(response.lowPriceNumber) || parseFloat(response.lastPriceNumber),
                    volume: parseFloat(response.volumeNumber) || 0
                };
                
                this.addDataPoint(pair, data);
                return data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            Logger.error(`Error fetching current data for ${pair}`, {
                pair,
                error: error.message
            });
            this.emit('fetchError', { pair, error });
            throw error;
        }
    }
    
    // Getter methods
    getHistoryForPair(pair) {
        return this.history[pair] || null;
    }
    
    getAllHistory() {
        return this.history;
    }
    
    getStats() {
        return {
            ...this.stats,
            isCollecting: this.isCollecting,
            pairs: this.config.pairs,
            dataPointsPerPair: Object.fromEntries(
                Object.entries(this.history).map(([pair, data]) => [
                    pair, 
                    data.closes ? data.closes.length : 0
                ])
            )
        };
    }
    
    // Control methods
    pause() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        this.isCollecting = false;
        
        Logger.info('Market data collection paused');
        this.emit('collectionPaused');
    }
    
    resume() {
        if (!this.isCollecting) {
            this.startRealTimeCollection();
        }
    }
    
    stop() {
        this.pause();
        Logger.info('Market data collection stopped');
        this.emit('collectionStopped');
    }
    
    // Utility method to check if we have enough data for analysis
    hasEnoughDataForAnalysis(pair, minDataPoints = 52) {
        const history = this.getHistoryForPair(pair);
        return history && history.closes && history.closes.length >= minDataPoints;
    }
}

module.exports = MarketDataCollector;