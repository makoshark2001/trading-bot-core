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