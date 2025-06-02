const EventEmitter = require('events');
const { DataValidator } = require('../validators');
const DataStorage = require('../../utils/DataStorage'); // Direct import
const path = require('path');

// Simple logger function to avoid import issues
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] MarketDataCollector ${level.toUpperCase()}: ${message}`, data);
}

function Logger(level) {
    return {
        info: (msg, data) => log('info', msg, data),
        error: (msg, data) => log('error', msg, data),
        debug: (msg, data) => {
            // Reduce debug logging for cleaner output
            if (msg.includes('calculated') || msg.includes('round completed') || msg.includes('Trimmed')) {
                return; // Skip noisy debug messages
            }
            log('debug', msg, data);
        },
        warn: (msg, data) => log('warn', msg, data)
    };
}

const logger = Logger();

class MarketDataCollector extends EventEmitter {
    constructor(apiClient, config = {}) {
        super();
        this.apiClient = apiClient;
        this.config = {
            pairs: ["XMR","RVN", "BEL", "DOGE","KAS","SAL"],
            updateInterval: 300000, // 5 minutes
            dataRetention: 1440, // Keep 1440 data points (about 5 days at 5min intervals)
            saveInterval: 300000, // Save to disk every 5 minutes
            enablePersistence: true, // Enable persistent storage
            ...config
        };
        
        this.history = {};
        this.isCollecting = false;
        this.collectionInterval = null;
        this.saveInterval = null;
        this.dataStorage = new DataStorage();
        this.stats = {
            totalDataPoints: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            lastUpdate: null,
            lastSave: null
        };
        
        this.setupEventHandlers();
        
        logger.info('MarketDataCollector initialized', {
            pairs: this.config.pairs,
            updateInterval: this.config.updateInterval,
            dataRetention: this.config.dataRetention,
            persistenceEnabled: this.config.enablePersistence
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
        logger.info('Initializing market data collector...');
        
        try {
            await this.loadOrPreloadHistoricalData();
            this.startRealTimeCollection();
            this.startPeriodicSaving();
            
            logger.info('Market data collector initialized successfully', {
                totalPairs: this.config.pairs.length,
                totalDataPoints: this.stats.totalDataPoints
            });
            
            this.emit('initialized');
        } catch (error) {
            logger.error('Failed to initialize market data collector', { error: error.message });
            this.emit('initializationError', error);
            throw error;
        }
    }
    
    async loadOrPreloadHistoricalData() {
        logger.info('Loading or preloading historical data...');
        
        for (const pair of this.config.pairs) {
            try {
                await this.loadOrPreloadSinglePair(pair);
            } catch (error) {
                logger.error(`Error loading/preloading data for ${pair}`, { 
                    pair, 
                    error: error.message 
                });
                this.emit('preloadError', { pair, error });
            }
        }
        
        logger.info('Historical data load/preload completed', {
            totalDataPoints: this.stats.totalDataPoints
        });
    }
    
    async loadOrPreloadSinglePair(pair) {
        logger.debug(`Processing data for ${pair}...`);
        
        this.initializeHistoryForPair(pair);
        
        // Try to load from persistent storage first
        if (this.config.enablePersistence) {
            const storedData = await this.dataStorage.loadPairData(pair);
            
            if (storedData && storedData.closes && storedData.closes.length > 0) {
                // Use stored data
                this.history[pair] = storedData;
                this.stats.totalDataPoints += storedData.closes.length;
                
                // Only log significant loads
                logger.info(`📁 Loaded ${storedData.closes.length} stored data points for ${pair}`);
                this.emit('dataLoaded', { 
                    pair, 
                    dataPoints: storedData.closes.length,
                    source: 'storage'
                });
                return;
            }
        }
        
        // Fallback to API preload if no stored data
        logger.info(`📡 No stored data found for ${pair}, preloading from API...`);
        await this.preloadFromAPI(pair);
    }
    
    async preloadFromAPI(pair) {
        const response = await this.apiClient.getCandles(`${pair}_USDT`, 5, 180);
        
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
            
            // Save immediately after preloading from API
            if (this.config.enablePersistence && validBars > 0) {
                await this.dataStorage.savePairData(pair, this.history[pair]);
            }
            
            logger.info(`📡 Preloaded ${validBars} data points from API for ${pair}`);
            this.emit('dataPreloaded', { 
                pair, 
                dataPoints: validBars,
                totalPoints: this.history[pair].closes.length,
                source: 'api'
            });
        }
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
            
            logger.debug(`Initialized history for ${pair}`);
        }
    }
    
    addDataPoint(pair, data, emitEvent = true) {
        if (!DataValidator.isValidPriceData(data)) {
            logger.warn(`Invalid data for ${pair}`, { data });
            return false;
        }
        
        const history = this.history[pair];
        if (!history) {
            logger.error(`No history initialized for ${pair}`);
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
            // Remove the debug logging for every data point to reduce noise
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
                
                // Remove noisy trim logging
                // if (removedCount > 0) {
                //     logger.debug(`Trimmed ${removedCount} old data points for ${pair}.${key}`);
                // }
            }
        });
    }
    
    startRealTimeCollection() {
        if (this.isCollecting) {
            logger.warn('Real-time collection already running');
            return;
        }
        
        this.isCollecting = true;
        logger.info('Starting real-time data collection', {
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
    
    startPeriodicSaving() {
        if (!this.config.enablePersistence) {
            logger.debug('Persistent storage disabled, skipping periodic saves');
            return;
        }
        
        logger.info('Starting periodic data saving', {
            interval: this.config.saveInterval
        });
        
        this.saveInterval = setInterval(async () => {
            await this.saveAllPairData();
        }, this.config.saveInterval);
    }
    
    async saveAllPairData() {
        if (!this.config.enablePersistence) {
            return;
        }
        
        try {
            // Remove the debug log about starting save
            let savedCount = 0;
            
            for (const pair of this.config.pairs) {
                if (this.history[pair] && this.history[pair].closes.length > 0) {
                    const success = await this.dataStorage.savePairData(pair, this.history[pair]);
                    if (success) {
                        savedCount++;
                    }
                }
            }
            
            this.stats.lastSave = new Date();
            
            // Only log saves when manually triggered or significant
            if (savedCount > 0) {
                logger.debug(`💾 Saved data for ${savedCount} pairs`);
            }
            
            this.emit('dataSaved', { savedCount });
            
        } catch (error) {
            logger.error('Failed to save pair data', { error: error.message });
        }
    }
    
    async collectCurrentData() {
        // Remove debug log for every collection round
        
        const promises = this.config.pairs.map(pair => this.fetchCurrentData(pair));
        const results = await Promise.allSettled(promises);
        
        let successful = 0;
        let failed = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successful++;
            } else {
                failed++;
                logger.error(`Failed to fetch data for ${this.config.pairs[index]}`, {
                    error: result.reason?.message
                });
            }
        });
        
        // Only log collection results if there are failures
        if (failed > 0) {
            logger.debug(`Data collection round completed`, {
                successful,
                failed,
                total: this.config.pairs.length
            });
        }
        
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
            logger.error(`Error fetching current data for ${pair}`, {
                pair,
                error: error.message
            });
            this.emit('fetchError', { pair, error });
            throw error;
        }
    }
    
    // Dynamic pair management methods
    async addPair(pair) {
        if (this.config.pairs.includes(pair)) {
            logger.warn(`Pair ${pair} already exists in configuration`);
            return false;
        }
        
        try {
            logger.info(`Adding new trading pair: ${pair}`);
            
            // Add to config
            this.config.pairs.push(pair);
            
            // Load or preload data for new pair
            await this.loadOrPreloadSinglePair(pair);
            
            logger.info(`Successfully added trading pair: ${pair}`);
            this.emit('pairAdded', { pair });
            
            return true;
        } catch (error) {
            logger.error(`Failed to add pair ${pair}`, { error: error.message });
            // Remove from config if it was added
            this.config.pairs = this.config.pairs.filter(p => p !== pair);
            throw error;
        }
    }
    
    async removePair(pair) {
        if (!this.config.pairs.includes(pair)) {
            logger.warn(`Pair ${pair} not found in configuration`);
            return false;
        }
        
        try {
            logger.info(`Removing trading pair: ${pair}`);
            
            // Remove from config
            this.config.pairs = this.config.pairs.filter(p => p !== pair);
            
            // Remove history
            delete this.history[pair];
            
            // Optionally delete stored data (comment out if you want to keep files)
            if (this.config.enablePersistence) {
                await this.dataStorage.deletePairData(pair);
            }
            
            logger.info(`Successfully removed trading pair: ${pair}`);
            this.emit('pairRemoved', { pair });
            
            return true;
        } catch (error) {
            logger.error(`Failed to remove pair ${pair}`, { error: error.message });
            throw error;
        }
    }
    
    async updatePairs(newPairs) {
        try {
            logger.info('Updating trading pairs configuration', {
                oldPairs: this.config.pairs,
                newPairs
            });
            
            const oldPairs = [...this.config.pairs];
            const added = newPairs.filter(p => !oldPairs.includes(p));
            const removed = oldPairs.filter(p => !newPairs.includes(p));
            
            // Remove pairs that are no longer needed
            for (const pair of removed) {
                delete this.history[pair];
                // Optionally delete stored data
                if (this.config.enablePersistence) {
                    await this.dataStorage.deletePairData(pair);
                }
                logger.debug(`Removed history for ${pair}`);
            }
            
            // Update config
            this.config.pairs = [...newPairs];
            
            // Load or preload data for new pairs
            for (const pair of added) {
                try {
                    await this.loadOrPreloadSinglePair(pair);
                } catch (error) {
                    logger.error(`Failed to load/preload data for new pair ${pair}`, {
                        error: error.message
                    });
                }
            }
            
            logger.info('Successfully updated trading pairs', {
                added,
                removed,
                totalPairs: newPairs.length
            });
            
            this.emit('pairsUpdated', {
                oldPairs,
                newPairs,
                changes: { added, removed }
            });
            
            return {
                success: true,
                changes: { added, removed }
            };
            
        } catch (error) {
            logger.error('Failed to update trading pairs', { error: error.message });
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
    
    async getStorageStats() {
        return await this.dataStorage.getStorageStats();
    }
    
    // Control methods
    pause() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        
        this.isCollecting = false;
        
        logger.info('Market data collection paused');
        this.emit('collectionPaused');
    }
    
    resume() {
        if (!this.isCollecting) {
            this.startRealTimeCollection();
            this.startPeriodicSaving();
        }
    }
    
    async stop() {
        this.pause();
        
        // Save all data before stopping
        if (this.config.enablePersistence) {
            await this.saveAllPairData();
            logger.info('💾 Final data save completed');
        }
        
        logger.info('Market data collection stopped');
        this.emit('collectionStopped');
    }
    
    // Utility method to check if we have enough data for analysis
    hasEnoughDataForAnalysis(pair, minDataPoints = 52) {
        const history = this.getHistoryForPair(pair);
        return history && history.closes && history.closes.length >= minDataPoints;
    }
    
    // Manual save trigger
    async forceSave() {
        await this.saveAllPairData();
        logger.info('💾 Manual data save completed');
    }
    
    // Clean up old stored files
    async cleanupOldData(maxAgeHours = 168) {
        return await this.dataStorage.cleanupOldData(maxAgeHours);
    }
}

module.exports = MarketDataCollector;