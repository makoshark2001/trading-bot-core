const TradingBotServer = require('./server/ExpressApp');
const { Logger } = require('./utils');

async function main() {
    try {
        Logger.info('🚀 Starting Trading Bot Core API Server...');
        Logger.info('📡 Service: Market Data Collection & Technical Analysis Engine');
        
        // Create and start the server
        const server = new TradingBotServer();
        global.tradingBotServer = server; // For graceful shutdown
        
        await server.start();
        
        Logger.info('✅ Trading Bot Core API Server started successfully');
        Logger.info('🔗 This service provides REST API for market data and technical analysis');
        Logger.info('📋 Available indicators: RSI, MACD, Bollinger Bands, Moving Average, Volume, Stochastic, Williams %R, Ichimoku Cloud, ADX, CCI, Parabolic SAR');
        
    } catch (error) {
        Logger.error('❌ Failed to start Trading Bot Core API Server', { 
            error: error.message 
        });
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

// Start the application
main();