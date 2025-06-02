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
            const tempFilePath = filePath + '.tmp';
            
            // Validate input data before saving
            if (!historyData || !historyData.closes || !Array.isArray(historyData.closes) || historyData.closes.length === 0) {
                this.warn(`Attempted to save empty/invalid data for ${pair}`, {
                    hasData: !!historyData,
                    hasCloses: !!(historyData && historyData.closes),
                    isArray: historyData && historyData.closes && Array.isArray(historyData.closes),
                    length: historyData && historyData.closes ? historyData.closes.length : 0
                });
                return false;
            }
            
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
            
            // Validate the data structure we're about to save
            if (!this.validateDataBeforeSave(dataToSave, pair)) {
                return false;
            }
            
            const jsonContent = JSON.stringify(dataToSave, null, 2);
            
            // Ensure config directory exists
            const configDir = path.dirname(filePath);
            await fs.mkdir(configDir, { recursive: true });
            
            // Write to temporary file first (atomic write)
            await fs.writeFile(tempFilePath, jsonContent, 'utf8');
            
            // Verify the temporary file was written correctly
            try {
                const verifyContent = await fs.readFile(tempFilePath, 'utf8');
                const verifyData = JSON.parse(verifyContent);
                if (!verifyData.history || !verifyData.history.closes || verifyData.history.closes.length !== historyData.closes.length) {
                    throw new Error('Verification failed - data mismatch');
                }
            } catch (verifyError) {
                this.error(`File verification failed for ${pair}`, { error: verifyError.message });
                // Clean up the bad temp file
                try {
                    await fs.unlink(tempFilePath);
                } catch {}
                return false;
            }
            
            // Only now move the temp file to final location (atomic operation)
            await fs.rename(tempFilePath, filePath);
            
            // Log only significant saves
            this.info(`💾 Saved ${historyData.closes.length} data points for ${pair}`, {
                pair,
                dataPoints: historyData.closes.length,
                fileSize: Math.round(jsonContent.length / 1024) + 'KB'
            });
            
            return true;
            
        } catch (error) {
            this.error(`Failed to save ${pair} data`, { 
                pair,
                error: error.message,
                dataPoints: historyData?.closes?.length || 0
            });
            
            // Clean up any temp files
            try {
                const tempFilePath = this.getFilePath(pair) + '.tmp';
                await fs.unlink(tempFilePath);
            } catch {}
            
            return false;
        }
    }
    
    validateDataBeforeSave(dataToSave, pair) {
        try {
            if (!dataToSave || typeof dataToSave !== 'object') {
                this.error(`Invalid data structure for ${pair} - not object`);
                return false;
            }
            
            if (!dataToSave.history || typeof dataToSave.history !== 'object') {
                this.error(`Invalid data structure for ${pair} - missing history`);
                return false;
            }
            
            const { closes, highs, lows, volumes, timestamps } = dataToSave.history;
            
            if (!closes || !Array.isArray(closes) || closes.length === 0) {
                this.error(`Invalid closes data for ${pair}`, { 
                    hasCloses: !!closes,
                    isArray: Array.isArray(closes),
                    length: closes ? closes.length : 0
                });
                return false;
            }
            
            // Check for valid numbers in first few entries
            for (let i = 0; i < Math.min(closes.length, 3); i++) {
                if (typeof closes[i] !== 'number' || !isFinite(closes[i]) || closes[i] <= 0) {
                    this.error(`Invalid price data in ${pair}`, { 
                        sampleValue: closes[i],
                        index: i 
                    });
                    return false;
                }
            }
            
            // Check array length consistency
            if (highs && highs.length !== closes.length) {
                this.error(`Array length mismatch for ${pair} - highs: ${highs.length} vs closes: ${closes.length}`);
                return false;
            }
            
            if (lows && lows.length !== closes.length) {
                this.error(`Array length mismatch for ${pair} - lows: ${lows.length} vs closes: ${closes.length}`);
                return false;
            }
            
            if (volumes && volumes.length !== closes.length) {
                this.error(`Array length mismatch for ${pair} - volumes: ${volumes.length} vs closes: ${closes.length}`);
                return false;
            }
            
            if (timestamps && timestamps.length !== closes.length) {
                this.error(`Array length mismatch for ${pair} - timestamps: ${timestamps.length} vs closes: ${closes.length}`);
                return false;
            }
            
            return true;
            
        } catch (error) {
            this.error(`Error validating data for ${pair}`, { error: error.message });
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
            
            // Check if file is empty or too small
            if (!fileContent || fileContent.trim().length < 10) {
                this.error(`Empty or too small data file for ${pair}`, { 
                    filePath,
                    size: fileContent.length 
                });
                // Delete corrupted file
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                this.error(`JSON parse error for ${pair}`, { 
                    pair,
                    error: parseError.message,
                    fileSize: fileContent.length,
                    preview: fileContent.substring(0, 100) + '...'
                });
                // Delete corrupted file
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            // Validate data structure
            if (!data || typeof data !== 'object') {
                this.error(`Invalid data structure in ${pair} file - not an object`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            if (!data.history || typeof data.history !== 'object') {
                this.error(`Invalid data structure in ${pair} file - missing history`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            if (!data.history.closes || !Array.isArray(data.history.closes)) {
                this.error(`Invalid data structure in ${pair} file - missing closes array`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            // Check if arrays have consistent lengths
            const { closes, highs, lows, volumes, timestamps } = data.history;
            if (highs && highs.length !== closes.length) {
                this.error(`Inconsistent array lengths in ${pair} file - highs`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            if (lows && lows.length !== closes.length) {
                this.error(`Inconsistent array lengths in ${pair} file - lows`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            if (volumes && volumes.length !== closes.length) {
                this.error(`Inconsistent array lengths in ${pair} file - volumes`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            if (timestamps && timestamps.length !== closes.length) {
                this.error(`Inconsistent array lengths in ${pair} file - timestamps`, { filePath });
                await this.deleteCorruptedFile(filePath, pair);
                return null;
            }
            
            // Log successful load only for significant files
            if (closes.length > 10) {
                this.info(`📁 Loaded ${closes.length} data points for ${pair}`, {
                    pair,
                    dataPoints: closes.length,
                    fileSize: Math.round(fileContent.length / 1024) + 'KB'
                });
            }
            
            return data.history;
            
        } catch (error) {
            this.error(`Failed to load ${pair} data`, { 
                pair,
                error: error.message 
            });
            return null;
        }
    }
    
    async deleteCorruptedFile(filePath, pair) {
        try {
            await fs.unlink(filePath);
            this.warn(`🗑️  Deleted corrupted data file for ${pair}`, { filePath });
        } catch (deleteError) {
            this.error(`Failed to delete corrupted file for ${pair}`, { 
                filePath,
                error: deleteError.message 
            });
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