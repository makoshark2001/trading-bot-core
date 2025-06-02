const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config', 'runtime.json');
        this.defaultPairs = ["XMR", "RVN", "BEL", "DOGE", "KAS", "SAL"];
        this.cache = null;
    }
    
    // Simple logger methods to avoid import issues
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    }
    
    info(message, data) {
        this.log('info', message, data);
    }
    
    error(message, data) {
        this.log('error', message, data);
    }
    
    debug(message, data) {
        this.log('debug', message, data);
    }
    
    async loadConfig() {
        try {
            const configExists = await this.fileExists(this.configPath);
            
            if (!configExists) {
                // Create default runtime config
                const defaultConfig = {
                    trading: {
                        pairs: [...this.defaultPairs],
                        lastUpdated: Date.now(),
                        updatedBy: "system"
                    }
                };
                
                await this.saveConfig(defaultConfig);
                this.info('Created default runtime configuration');
                return defaultConfig;
            }
            
            const data = await fs.readFile(this.configPath, 'utf8');
            this.cache = JSON.parse(data);
            
            this.debug('Loaded runtime configuration', {
                pairs: this.cache.trading.pairs,
                lastUpdated: new Date(this.cache.trading.lastUpdated).toISOString()
            });
            
            return this.cache;
            
        } catch (err) {
            console.error('Failed to load configuration:', err);
            this.error('Failed to load configuration', { error: String(err) });
            // Fallback to default
            return {
                trading: {
                    pairs: [...this.defaultPairs],
                    lastUpdated: Date.now(),
                    updatedBy: "fallback"
                }
            };
        }
    }
    
    async saveConfig(config) {
        try {
            // Ensure config directory exists
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });
            
            // Add metadata
            config.trading.lastUpdated = Date.now();
            
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            this.cache = config;
            
            this.info('Saved runtime configuration', {
                pairs: config.trading.pairs,
                updatedBy: config.trading.updatedBy
            });
            
            return true;
        } catch (err) {
            console.error('Failed to save configuration:', err);
            this.error('Failed to save configuration', { error: String(err) });
            return false;
        }
    }
    
    async getCurrentPairs() {
        const config = await this.loadConfig();
        return config.trading.pairs;
    }
    
    async updatePairs(newPairs, updatedBy = "api") {
        try {
            // Validate pairs format
            if (!Array.isArray(newPairs) || newPairs.length === 0) {
                throw new Error('Pairs must be a non-empty array');
            }
            
            // Validate each pair format (basic validation)
            const validPairs = newPairs.filter(pair => {
                return typeof pair === 'string' && 
                       pair.length >= 2 && 
                       pair.length <= 10 && 
                       /^[A-Z0-9]+$/.test(pair.toUpperCase());
            });
            
            if (validPairs.length !== newPairs.length) {
                throw new Error('Invalid pair format detected');
            }
            
            // Normalize to uppercase
            const normalizedPairs = validPairs.map(pair => pair.toUpperCase());
            
            const config = await this.loadConfig();
            const oldPairs = [...config.trading.pairs];
            
            config.trading.pairs = normalizedPairs;
            config.trading.updatedBy = updatedBy;
            
            const saved = await this.saveConfig(config);
            
            if (saved) {
                this.info('Trading pairs updated', {
                    oldPairs,
                    newPairs: normalizedPairs,
                    updatedBy,
                    added: normalizedPairs.filter(p => !oldPairs.includes(p)),
                    removed: oldPairs.filter(p => !normalizedPairs.includes(p))
                });
                
                return {
                    success: true,
                    oldPairs,
                    newPairs: normalizedPairs,
                    changes: {
                        added: normalizedPairs.filter(p => !oldPairs.includes(p)),
                        removed: oldPairs.filter(p => !normalizedPairs.includes(p))
                    }
                };
            }
            
            throw new Error('Failed to save configuration');
            
        } catch (error) {
            const errorMessage = error && error.message ? error.message : 'Unknown error updating trading pairs';
            this.error('Failed to update trading pairs', { 
                error: errorMessage,
                newPairs,
                updatedBy 
            });
            throw new Error(errorMessage);
        }
    }
    
    async getConfigInfo() {
        const config = await this.loadConfig();
        return {
            pairs: config.trading.pairs,
            lastUpdated: config.trading.lastUpdated,
            updatedBy: config.trading.updatedBy,
            totalPairs: config.trading.pairs.length
        };
    }
    
    async resetToDefault() {
        try {
            const config = {
                trading: {
                    pairs: [...this.defaultPairs],
                    updatedBy: "reset"
                }
            };
            
            await this.saveConfig(config);
            
            this.info('Reset trading pairs to default', { pairs: this.defaultPairs });
            
            return {
                success: true,
                pairs: this.defaultPairs
            };
        } catch (error) {
            const errorMessage = error && error.message ? error.message : 'Unknown error resetting to default pairs';
            this.error('Failed to reset to default pairs', { error: errorMessage });
            throw new Error(errorMessage);
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = ConfigManager;