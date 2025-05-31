const TradingBotServer = require('./server/ExpressApp');
const { Logger } = require('./utils');

async function main() {
    try {
        Logger.info('🚀 Starting Advanced Trading Bot Core...');
        
        // Create and start the server
        const server = new TradingBotServer();
        global.tradingBotServer = server; // For graceful shutdown
        
        await server.start();
        
        Logger.info('✅ Advanced Trading Bot Core started successfully');
        
    } catch (error) {
        Logger.error('❌ Failed to start Advanced Trading Bot Core', { 
            error: error.message 
        });
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

// Start the application
main();