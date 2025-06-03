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
            try {
                const storedData = await this.dataStorage.loadPairData(pair);
                
                if (storedData && storedData.closes && storedData.closes.length > 0) {
                    // Additional validation for stored data
                    if (this.validateStoredData(storedData, pair)) {
                        // Use stored data
                        this.history[pair] = storedData;
                        this.stats.totalDataPoints += storedData.closes.length;
                        
                        logger.info(`📁 Loaded ${storedData.closes.length} stored data points for ${pair}`);
                        this.emit('dataLoaded', { 
                            pair, 
                            dataPoints: storedData.closes.length,
                            source: 'storage'
                        });
                        return;
                    } else {
                        logger.warn(`📁 Stored data for ${pair} failed validation, falling back to API`);
                    }
                }
            } catch (storageError) {
                logger.error(`📁 Error loading stored data for ${pair}`, { 
                    error: storageError.message 
                });
            }
        }
        
        // Fallback to API preload if no stored data or validation failed
        logger.info(`📡 No valid stored data found for ${pair}, preloading from API...`);
        await this.preloadFromAPI(pair);
    }
    
    validateStoredData(data, pair) {
        try {
            if (!data || typeof data !== 'object') {
                logger.warn(`Invalid stored data structure for ${pair} - not object`);
                return false;
            }
            
            const { closes, highs, lows, volumes, timestamps } = data;
            
            if (!closes || !Array.isArray(closes) || closes.length === 0) {
                logger.warn(`Invalid stored data for ${pair} - missing/empty closes`);
                return false;
            }
            
            // Check for valid numbers in closes array
            for (let i = 0; i < Math.min(closes.length, 5); i++) {
                if (typeof closes[i] !== 'number' || !isFinite(closes[i]) || closes[i] <= 0) {
                    logger.warn(`Invalid price data in stored file for ${pair}`, { 
                        sampleValue: closes[i],
                        index: i 
                    });
                    return false;
                }
            }
            
            // Check array length consistency
            if (highs && highs.length !== closes.length) {
                logger.warn(`Array length mismatch for ${pair} - highs`);
                return false;
            }
            
            if (lows && lows.length !== closes.length) {
                logger.warn(`Array length mismatch for ${pair} - lows`);
                return false;
            }
            
            if (volumes && volumes.length !== closes.length) {
                logger.warn(`Array length mismatch for ${pair} - volumes`);
                return false;
            }
            
            if (timestamps && timestamps.length !== closes.length) {
                logger.warn(`Array length mismatch for ${pair} - timestamps`);
                return false;
            }
            
            logger.debug(`✅ Stored data validation passed for ${pair}`);
            return true;
            
        } catch (error) {
            logger.error(`Error validating stored data for ${pair}`, { error: error.message });
            return false;
        }
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
    
    // Get available USDT trading pairs from exchange
    async getAvailableUSDTPairs() {
        try {
            return await this.apiClient.getUSDTPairs();
        } catch (error) {
            logger.error('Failed to get available USDT pairs', { error: error.message });
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
        
        // Save all data before stopping with extra validation
        if (this.config.enablePersistence) {
            logger.info('💾 Starting final data save before shutdown...');
            
            const savePromises = [];
            
            for (const pair of this.config.pairs) {
                if (this.history[pair] && this.history[pair].closes && this.history[pair].closes.length > 0) {
                    logger.debug(`💾 Saving ${pair} - ${this.history[pair].closes.length} data points`);
                    
                    // Create individual promise for each pair to avoid race conditions
                    const savePromise = this.dataStorage.savePairData(pair, this.history[pair])
                        .then(success => {
                            if (success) {
                                logger.debug(`✅ Successfully saved ${pair} during shutdown`);
                            } else {
                                logger.error(`❌ Failed to save ${pair} during shutdown`);
                            }
                            return { pair, success };
                        })
                        .catch(error => {
                            logger.error(`❌ Error saving ${pair} during shutdown`, { error: error.message });
                            return { pair, success: false, error: error.message };
                        });
                    
                    savePromises.push(savePromise);
                } else {
                    logger.warn(`⚠️  Skipping save for ${pair} - no valid data`, {
                        hasHistory: !!this.history[pair],
                        hasCloses: !!(this.history[pair] && this.history[pair].closes),
                        closesLength: this.history[pair] && this.history[pair].closes ? this.history[pair].closes.length : 0
                    });
                }
            }
            
            if (savePromises.length > 0) {
                logger.info(`💾 Waiting for ${savePromises.length} files to save...`);
                
                try {
                    const results = await Promise.allSettled(savePromises);
                    let successCount = 0;
                    let failCount = 0;
                    
                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value.success) {
                            successCount++;
                        } else {
                            failCount++;
                            const pair = this.config.pairs[index];
                            logger.error(`💾 Failed to save ${pair}`, { 
                                status: result.status,
                                error: result.reason || (result.value && result.value.error)
                            });
                        }
                    });
                    
                    logger.info(`💾 Final data save completed - ${successCount} successful, ${failCount} failed`);
                } catch (error) {
                    logger.error('💾 Error during final save', { error: error.message });
                }
            } else {
                logger.warn('💾 No data to save during shutdown');
            }
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