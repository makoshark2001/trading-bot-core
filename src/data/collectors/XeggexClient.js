const got = require("got");
const EventEmitter = require('events');
const { Logger } = require('../../utils');

class XeggexClient extends EventEmitter {
    constructor(apiKey = null, apiSecret = null, config = {}) {
        super();
        
        this.config = {
            baseUrl: "https://api.xeggex.com/api/v2",
            rateLimit: { requests: 100, window: 60000 },
            timeout: 10000,
            ...config
        };
        
        this.setupAuth(apiKey, apiSecret);
        this.setupRateLimit();
        
        Logger.info('XeggexClient initialized', {
            hasAuth: !!this.auth,
            baseUrl: this.config.baseUrl
        });
    }
    
    setupAuth(apiKey, apiSecret) {
        if (apiKey && apiSecret) {
            this.auth = "Basic " + Buffer.from(apiKey + ":" + apiSecret).toString("base64");
            this.options = {
                prefixUrl: this.config.baseUrl,
                headers: { Authorization: this.auth },
                timeout: { request: this.config.timeout },
                retry: { limit: 2 }
            };
            Logger.info('XeggexClient authentication configured');
        } else {
            this.options = {
                prefixUrl: this.config.baseUrl,
                timeout: { request: this.config.timeout },
                retry: { limit: 2 }
            };
            Logger.warn('XeggexClient running without authentication');
        }
    }
    
    setupRateLimit() {
        this.requestCount = 0;
        this.rateLimitWindow = Date.now();
        
        // Reset rate limit counter every window
        setInterval(() => {
            this.requestCount = 0;
            this.rateLimitWindow = Date.now();
        }, this.config.rateLimit.window);
    }
    
    async checkRateLimit() {
        if (this.requestCount >= this.config.rateLimit.requests) {
            const waitTime = this.config.rateLimit.window - (Date.now() - this.rateLimitWindow);
            if (waitTime > 0) {
                Logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        this.requestCount++;
    }
    
    async makeRequest(endpoint, options = {}) {
        await this.checkRateLimit();
        
        const startTime = Date.now();
        
        try {
            Logger.debug(`Making request to ${endpoint}`);
            
            const response = await got.get(endpoint, { 
                ...this.options, 
                ...options 
            }).json();
            
            const duration = Date.now() - startTime;
            
            Logger.debug(`Request successful: ${endpoint}`, {
                duration: `${duration}ms`,
                endpoint
            });
            
            this.emit('requestSuccess', { endpoint, response, duration });
            return response;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            Logger.error(`Request failed: ${endpoint}`, {
                error: error.message,
                duration: `${duration}ms`,
                statusCode: error.response?.statusCode,
                endpoint
            });
            
            this.emit('requestError', { endpoint, error, duration });
            throw error;
        }
    }
    
    async getMarket(symbol) {
        const encodedSymbol = encodeURIComponent(symbol);
        return this.makeRequest(`market/getbysymbol/${encodedSymbol}`);
    }
    
    async getCandles(symbol, resolution = 5, countBack = 1440) {
        const params = new URLSearchParams({
            symbol: symbol,
            resolution: resolution.toString(),
            countBack: countBack.toString(),
            firstDataRequest: '1'
        });
        
        return this.makeRequest(`market/candles?${params}`);
    }
    
    async getMarkets() {
        return this.makeRequest("market/getlist");
    }
    
    async getUSDTPairs() {
        try {
            const markets = await this.getMarkets();
            
            if (!markets || !Array.isArray(markets)) {
                throw new Error('Invalid markets response');
            }
            
            // Filter for USDT pairs and extract the base currency
            const usdtPairs = markets
                .filter(market => {
                    // Check if symbol ends with _USDT and is active
                    return market.symbol && 
                           market.symbol.endsWith('/USDT') && 
                           market.isActive !== false; // Include if isActive is true or undefined
                })
                .map(market => {
                    // Extract the base currency (everything before _USDT)
                    const baseCurrency = market.symbol.replace('/USDT', '');
                    return {
                        pair: baseCurrency,
                        symbol: market.symbol,
                        name: market.primaryCurrencyName || baseCurrency,
                        lastPrice: market.lastPrice ? parseFloat(market.lastPrice) : null,
                        volume24h: market.volume ? parseFloat(market.volume) : null,
                        change24h: market.change ? parseFloat(market.change) : null,
                        isActive: market.isActive
                    };
                })
                .sort((a, b) => a.pair.localeCompare(b.pair)); // Sort alphabetically
            
            Logger.debug('Retrieved USDT pairs', {
                totalPairs: usdtPairs.length,
                samplePairs: usdtPairs.slice(0, 5).map(p => p.pair)
            });
            
            return usdtPairs;
            
        } catch (error) {
            Logger.error('Failed to get USDT pairs', { error: error.message });
            throw error;
        }
    }
    
    async getOrderBook(symbol) {
        const encodedSymbol = encodeURIComponent(symbol);
        return this.makeRequest(`market/getorderbookbysymbol/${encodedSymbol}`);
    }
    
    // Add health check method
    async healthCheck() {
        try {
            await this.getMarkets();
            return { healthy: true, timestamp: Date.now() };
        } catch (error) {
            return { 
                healthy: false, 
                error: error.message, 
                timestamp: Date.now() 
            };
        }
    }
    
    // Get API status
    getStatus() {
        return {
            requestCount: this.requestCount,
            rateLimitWindow: this.rateLimitWindow,
            hasAuth: !!this.auth,
            config: {
                baseUrl: this.config.baseUrl,
                rateLimit: this.config.rateLimit
            }
        };
    }
}

module.exports = XeggexClient;