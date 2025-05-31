require('dotenv').config();
const { XeggexClient } = require('../src/data/collectors');
const { Logger } = require('../src/utils');

async function testApiClient() {
    console.log('🚀 Testing XeggexClient...');
    
    // Initialize client with credentials from .env
    const client = new XeggexClient(
        process.env.X_API,
        process.env.X_SECRET
    );
    
    // Set up event listeners
    client.on('requestSuccess', ({ endpoint, duration }) => {
        console.log(`✅ Success: ${endpoint} (${duration}ms)`);
    });
    
    client.on('requestError', ({ endpoint, error }) => {
        console.log(`❌ Error: ${endpoint} - ${error.message}`);
    });
    
    try {
        // Test 1: Health check
        console.log('\n📊 Test 1: Health Check');
        const health = await client.healthCheck();
        console.log('Health status:', health.healthy ? '✅ Healthy' : '❌ Unhealthy');
        
        // Test 2: Get market data for RVN
        console.log('\n📊 Test 2: Get RVN Market Data');
        const rvnMarket = await client.getMarket('RVN_USDT');
        console.log('RVN Price:', rvnMarket.lastPriceNumber || 'N/A');
        console.log('24h Volume:', rvnMarket.volumeNumber || 'N/A');
        
        // Test 3: Get candle data
        console.log('\n📊 Test 3: Get RVN Candle Data');
        const candles = await client.getCandles('RVN_USDT', 5, 10);
        console.log('Candles received:', candles.bars?.length || 0);
        if (candles.bars && candles.bars.length > 0) {
            const latest = candles.bars[candles.bars.length - 1];
            console.log('Latest candle:', {
                time: new Date(latest.time).toISOString(),
                close: latest.close,
                volume: latest.volume
            });
        }
        
        // Test 4: Get client status
        console.log('\n📊 Test 4: Client Status');
        const status = client.getStatus();
        console.log('Requests made:', status.requestCount);
        console.log('Has authentication:', status.hasAuth);
        
        console.log('\n🎉 All API tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        Logger.error('API client test failed', { error: error.message });
    }
}

// Run the test
testApiClient();