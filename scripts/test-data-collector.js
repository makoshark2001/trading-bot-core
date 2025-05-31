require('dotenv').config();
const config = require('config');
const { XeggexClient, MarketDataCollector } = require('../src/data/collectors');
const { Logger } = require('../src/utils');

async function testDataCollector() {
    console.log('🚀 Testing Market Data Collector...');
    
    // Initialize API client
    const apiClient = new XeggexClient(
        process.env.X_API,
        process.env.X_SECRET,
        config.get('api.xeggex')
    );
    
    // Initialize data collector with test config
    const testConfig = {
        pairs: ['RVN'], // Test with just one pair for now
        updateInterval: 10000, // 10 seconds for testing
        dataRetention: 100 // Keep fewer data points for testing
    };
    
    const dataCollector = new MarketDataCollector(apiClient, testConfig);
    
    // Set up event listeners
    dataCollector.on('initialized', () => {
        console.log('✅ Data collector initialized');
    });
    
    dataCollector.on('dataPreloaded', ({ pair, dataPoints, totalPoints }) => {
        console.log(`✅ Preloaded ${dataPoints} data points for ${pair} (total: ${totalPoints})`);
    });
    
    dataCollector.on('newData', ({ pair, data }) => {
        console.log(`📊 New data for ${pair}: Price=${data.close}, Volume=${data.volume}`);
    });
    
    dataCollector.on('collectionRoundComplete', ({ successful, failed }) => {
        console.log(`📊 Collection round: ${successful} successful, ${failed} failed`);
    });
    
    dataCollector.on('dataError', (error) => {
        console.log(`❌ Data error: ${error.error?.message || error.message}`);
    });
    
    try {
        // Test initialization
        console.log('\n📊 Test 1: Initializing data collector...');
        await dataCollector.initialize();
        
        // Test data access
        console.log('\n📊 Test 2: Checking collected data...');
        const stats = dataCollector.getStats();
        console.log('Stats:', {
            totalDataPoints: stats.totalDataPoints,
            isCollecting: stats.isCollecting,
            pairs: stats.pairs,
            dataPointsPerPair: stats.dataPointsPerPair
        });
        
        // Test individual pair data
        const rvnHistory = dataCollector.getHistoryForPair('RVN');
        if (rvnHistory) {
            console.log('RVN Data:', {
                dataPoints: rvnHistory.closes.length,
                latestPrice: rvnHistory.closes[rvnHistory.closes.length - 1],
                priceRange: {
                    min: Math.min(...rvnHistory.closes),
                    max: Math.max(...rvnHistory.closes)
                }
            });
        }
        
        // Test analysis readiness
        console.log('\n📊 Test 3: Analysis readiness check...');
        const hasEnoughData = dataCollector.hasEnoughDataForAnalysis('RVN', 10);
        console.log('Has enough data for analysis (10+ points):', hasEnoughData ? '✅ YES' : '❌ NO');
        
        // Let it collect a few real-time updates
        console.log('\n📊 Test 4: Collecting real-time data for 30 seconds...');
        console.log('Watch for new data points above...');
        
        setTimeout(() => {
            // Show final stats
            const finalStats = dataCollector.getStats();
            console.log('\n📊 Final Stats:', {
                totalDataPoints: finalStats.totalDataPoints,
                successfulUpdates: finalStats.successfulUpdates,
                failedUpdates: finalStats.failedUpdates,
                lastUpdate: finalStats.lastUpdate
            });
            
            // Stop collection
            dataCollector.stop();
            console.log('\n🎉 Data collector test completed!');
            
            // Force exit since we have intervals running
            process.exit(0);
        }, 30000);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        Logger.error('Data collector test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testDataCollector();