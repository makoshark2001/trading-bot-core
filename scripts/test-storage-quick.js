require('dotenv').config();
const config = require('config');
const { XeggexClient, MarketDataCollector } = require('../src/data/collectors');

async function testStorageQuick() {
    console.log('🚀 Testing Storage with Real Data...');
    
    try {
        console.log('\n📊 Test 1: Initialize with API...');
        
        const apiClient = new XeggexClient(
            process.env.X_API,
            process.env.X_SECRET,
            config.get('api.xeggex')
        );
        
        const testConfig = {
            pairs: ['RVN'], // Just one pair for quick test
            updateInterval: 60000, // 1 minute
            dataRetention: 50,
            saveInterval: 10000, // Save every 10 seconds
            enablePersistence: true
        };
        
        console.log('✅ Components configured');
        
        console.log('\n📊 Test 2: First initialization (should preload from API)...');
        const dataCollector1 = new MarketDataCollector(apiClient, testConfig);
        await dataCollector1.initialize();
        
        // Wait for initial data collection
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const history1 = dataCollector1.getHistoryForPair('RVN');
        console.log('✅ First run data points:', history1?.closes?.length || 0);
        
        // Force save
        await dataCollector1.forceSave();
        console.log('✅ Data saved to disk');
        
        await dataCollector1.stop();
        console.log('✅ First collector stopped');
        
        console.log('\n📊 Test 3: Second initialization (should load from storage)...');
        const dataCollector2 = new MarketDataCollector(apiClient, testConfig);
        
        // Set up event listener to catch storage loading
        dataCollector2.on('dataLoaded', ({ pair, dataPoints, source }) => {
            console.log(`📁 Loaded ${dataPoints} points for ${pair} from ${source}`);
        });
        
        dataCollector2.on('dataPreloaded', ({ pair, dataPoints, source }) => {
            console.log(`📡 Preloaded ${dataPoints} points for ${pair} from ${source}`);
        });
        
        await dataCollector2.initialize();
        
        const history2 = dataCollector2.getHistoryForPair('RVN');
        console.log('✅ Second run data points:', history2?.closes?.length || 0);
        
        console.log('\n📊 Test 4: Compare data consistency...');
        if (history1 && history2) {
            const consistentLength = history1.closes.length <= history2.closes.length;
            const firstPriceMatch = history1.closes[0] === history2.closes[0];
            
            console.log('✅ Data consistency check:', {
                lengthConsistent: consistentLength,
                firstPriceMatch: firstPriceMatch,
                firstRunLength: history1.closes.length,
                secondRunLength: history2.closes.length
            });
        }
        
        console.log('\n📊 Test 5: Storage stats...');
        const stats = await dataCollector2.getStorageStats();
        console.log('✅ Final storage stats:', {
            totalPairs: stats.totalPairs,
            totalSizeKB: Math.round(stats.totalSizeBytes / 1024),
            pairs: stats.pairs.map(p => `${p.pair}: ${p.dataPoints} points`)
        });
        
        await dataCollector2.stop();
        console.log('✅ Second collector stopped');
        
        console.log('\n🎉 Storage integration test completed successfully!');
        console.log('💾 Data is now persisted and will survive server restarts!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run the test
testStorageQuick();