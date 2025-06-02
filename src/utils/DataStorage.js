const fs = require('fs').promises;
const path = require('path');

class DataStorage {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data', 'pairs');
        this.ensureDataDirectory();
    }
    
    // Reduced logging - only important events
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        
        // Only log important events, not debug operations
        if (level === 'error' || level === 'warn') {
            console.log(`[${timestamp}] DataStorage ${level.toUpperCase()}: ${message}`, data);
        } else if (level === 'info') {
            // Only log significant operations
            if (message.includes('Saved') || message.includes('Loaded') || message.includes('Deleted') || message.includes('Cleaned up')) {
                console.log(`[${timestamp}] DataStorage ${level.toUpperCase()}: ${message}`, data);
            }
        }
        // Skip debug messages entirely
    }
    
    info(message, data) {
        this.log('info', message, data);
    }
    
    error(message, data) {
        this.log('error', message, data);
    }
    
    debug(message, data) {
        // Skip debug logging entirely to reduce noise
        return;
    }
    
    warn(message, data) {
        this.log('warn', message, data);
    }
    
    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            // Don't log directory creation - too noisy
        } catch (error) {
            this.error('Failed to create data directory', { 
                error: error.message,
                path: this.dataDir 
            });
        }
    }
    
    getFilePath(pair) {
        return path.join(this.dataDir, `${pair.toLowerCase()}_history.json`);
    }
    
    async savePairData(pair, historyData) {
        try {
            const filePath = this.getFilePath(pair);
            const dataToSave = {
                pair: pair,
                lastUpdated: Date.now(),
                dataPoints: historyData.closes.length,
                history: {
                    closes: historyData.closes,
                    highs: historyData.highs,
                    lows: historyData.lows,
                    prices: historyData.prices || historyData.closes, // Backwards compatibility
                    volumes: historyData.volumes,
                    timestamps: historyData.timestamps
                }
            };
            
            await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
            
            // Only log saves during significant operations (not periodic saves)
            // Remove the detailed logging to reduce noise
            
            return true;
        } catch (error) {
            this.error(`Failed to save ${pair} data`, { 
                pair,
                error: error.message 
            });
            return false;
        }
    }
    
    async loadPairData(pair) {
        try {
            const filePath = this.getFilePath(pair);
            
            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                // Don't log missing files - too noisy
                return null;
            }
            
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            // Validate data structure
            if (!data.history || !data.history.closes || !Array.isArray(data.history.closes)) {
                this.error(`Invalid data structure in ${pair} file`, { filePath });
                return null;
            }
            
            // Only log successful loads during startup, not every access
            // Reduced logging for cleaner output
            
            return data.history;
            
        } catch (error) {
            this.error(`Failed to load ${pair} data`, { 
                pair,
                error: error.message 
            });
            return null;
        }
    }
    
    async deletePairData(pair) {
        try {
            const filePath = this.getFilePath(pair);
            await fs.unlink(filePath);
            this.info(`Deleted stored data for ${pair}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Don't log missing files
                return true; // File didn't exist, which is fine
            }
            this.error(`Failed to delete ${pair} data`, { 
                pair,
                error: error.message 
            });
            return false;
        }
    }
    
    async listStoredPairs() {
        try {
            const files = await fs.readdir(this.dataDir);
            const pairs = files
                .filter(file => file.endsWith('_history.json'))
                .map(file => file.replace('_history.json', '').toUpperCase());
            
            // Don't log listing operations
            return pairs;
        } catch (error) {
            this.error('Failed to list stored pairs', { error: error.message });
            return [];
        }
    }
    
    async getStorageStats() {
        try {
            const pairs = await this.listStoredPairs();
            const stats = {
                totalPairs: pairs.length,
                pairs: [],
                totalSizeBytes: 0
            };
            
            for (const pair of pairs) {
                try {
                    const filePath = this.getFilePath(pair);
                    const fileStats = await fs.stat(filePath);
                    const data = await this.loadPairData(pair);
                    
                    stats.pairs.push({
                        pair,
                        sizeBytes: fileStats.size,
                        dataPoints: data ? data.closes.length : 0,
                        lastModified: fileStats.mtime
                    });
                    
                    stats.totalSizeBytes += fileStats.size;
                } catch (error) {
                    this.error(`Failed to get stats for ${pair}`, { error: error.message });
                }
            }
            
            return stats;
        } catch (error) {
            this.error('Failed to get storage stats', { error: error.message });
            return { totalPairs: 0, pairs: [], totalSizeBytes: 0 };
        }
    }
    
    async cleanupOldData(maxAgeHours = 168) { // Default 7 days
        try {
            const pairs = await this.listStoredPairs();
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            let cleanedCount = 0;
            
            for (const pair of pairs) {
                try {
                    const filePath = this.getFilePath(pair);
                    const fileStats = await fs.stat(filePath);
                    const fileAge = Date.now() - fileStats.mtime.getTime();
                    
                    if (fileAge > maxAge) {
                        await this.deletePairData(pair);
                        cleanedCount++;
                        this.info(`Cleaned up old data for ${pair}`, {
                            pair,
                            ageHours: Math.round(fileAge / (60 * 60 * 1000))
                        });
                    }
                } catch (error) {
                    this.error(`Failed to check age for ${pair}`, { error: error.message });
                }
            }
            
            if (cleanedCount > 0) {
                this.info('Cleanup completed', { cleanedCount });
            }
            return cleanedCount;
        } catch (error) {
            this.error('Failed to cleanup old data', { error: error.message });
            return 0;
        }
    }
}

module.exports = DataStorage;