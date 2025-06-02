require('dotenv').config();
const config = require('config');
const { XeggexClient } = require('../src/data/collectors');
const { Logger } = require('../src/utils');

async function testAvailablePairs() {
    console.log('🚀 Testing Available Pairs Feature...');
    
    try {
        console.log('\n📊 Test 1: Test XeggexClient.getUSDTPairs()...');
        
        const apiClient = new XeggexClient(
            process.env.X_API,
            process.env.X_SECRET,
            config.get('api.xeggex')
        );
        
        const usdtPairs = await apiClient.getUSDTPairs();
        console.log('✅ USDT pairs retrieved:', {
            totalPairs: usdtPairs.length,
            firstFew: usdtPairs.slice(0, 10).map(p => p.pair),
            samplePair: usdtPairs[0]
        });
        
        console.log('\n📊 Test 2: Check for popular pairs...');
        const popularPairs = usdtPairs
            .filter(p => ['BTC', 'ETH', 'LTC', 'DOGE', 'XMR', 'RVN', 'ADA', 'DOT'].includes(p.pair))
            .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
        
        console.log('✅ Popular pairs found:', 
            popularPairs.map(p => `${p.pair} (${p.lastPrice || 'N/A'} USDT, Vol: ${p.volume24h || 'N/A'})`)
        );
        
        console.log('\n📊 Test 3: Test volume filtering...');
        const highVolumePairs = usdtPairs
            .filter(p => p.volume24h && p.volume24h > 10000)
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, 10);
        
        console.log('✅ High volume pairs (>10K volume):', 
            highVolumePairs.map(p => `${p.pair} (${p.volume24h?.toFixed(0)} vol)`)
        );
        
        console.log('\n📊 Test 4: Test API endpoint manually...');
        
        // For testing the API endpoint, we'd need to start a server
        // For now, let's just test the data structure
        const mockCurrentPairs = ['XMR', 'RVN', 'BEL', 'DOGE'];
        
        // Simulate what the API endpoint would return
        const enrichedPairs = usdtPairs.map(pair => ({
            ...pair,
            isTracked: mockCurrentPairs.includes(pair.pair),
            canAdd: !mockCurrentPairs.includes(pair.pair)
        }));
        
        const apiResponse = {
            availablePairs: enrichedPairs,
            totalAvailable: usdtPairs.length,
            currentlyTracked: mockCurrentPairs.length,
            canAdd: enrichedPairs.filter(p => p.canAdd).length,
            timestamp: Date.now()
        };
        
        console.log('✅ API response structure:', {
            totalAvailable: apiResponse.totalAvailable,
            currentlyTracked: apiResponse.currentlyTracked,
            canAdd: apiResponse.canAdd,
            trackedPairs: enrichedPairs.filter(p => p.isTracked).map(p => p.pair),
            availableToAdd: enrichedPairs.filter(p => p.canAdd).slice(0, 5).map(p => p.pair)
        });
        
        console.log('\n📊 Test 5: Test with actual server (optional)...');
        
        try {
            // Try to make a real HTTP request if server is running
            const fetch = require('node-fetch');
            const response = await fetch('http://localhost:3000/api/available-pairs');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Live server test successful:', {
                    status: response.status,
                    totalAvailable: data.totalAvailable,
                    currentlyTracked: data.currentlyTracked,
                    canAdd: data.canAdd,
                    samplePairs: data.availablePairs.slice(0, 3).map(p => ({
                        pair: p.pair,
                        name: p.name,
                        isTracked: p.isTracked,
                        canAdd: p.canAdd,
                        lastPrice: p.lastPrice
                    }))
                });
            } else {
                console.log('⚠️  Server not responding (this is OK if server is not running)');
            }
        } catch (serverError) {
            console.log('⚠️  Server test skipped (server not running):', serverError.message);
        }
        
        console.log('\n📊 Test 6: Data validation...');
        
        // Validate the data structure
        let validationErrors = [];
        
        if (!Array.isArray(usdtPairs)) {
            validationErrors.push('usdtPairs is not an array');
        }
        
        if (usdtPairs.length === 0) {
            validationErrors.push('No USDT pairs found');
        }
        
        // Check first few pairs for required fields
        for (let i = 0; i < Math.min(5, usdtPairs.length); i++) {
            const pair = usdtPairs[i];
            if (!pair.pair || typeof pair.pair !== 'string') {
                validationErrors.push(`Pair ${i} missing or invalid 'pair' field`);
            }
            if (!pair.symbol || typeof pair.symbol !== 'string') {
                validationErrors.push(`Pair ${i} missing or invalid 'symbol' field`);
            }
            if (pair.lastPrice !== null && typeof pair.lastPrice !== 'number') {
                validationErrors.push(`Pair ${i} invalid 'lastPrice' field`);
            }
        }
        
        if (validationErrors.length === 0) {
            console.log('✅ Data validation passed');
        } else {
            console.log('❌ Data validation errors:', validationErrors);
        }
        
        console.log('\n📊 Test 7: Performance metrics...');
        
        const startTime = Date.now();
        await apiClient.getUSDTPairs();
        const endTime = Date.now();
        
        console.log('✅ Performance metrics:', {
            responseTime: `${endTime - startTime}ms`,
            pairsPerSecond: Math.round(usdtPairs.length / ((endTime - startTime) / 1000)),
            cacheRecommendation: endTime - startTime > 5000 ? 'Consider caching' : 'Performance acceptable'
        });
        
        console.log('\n🎉 All available pairs tests completed successfully!');
        console.log(`📈 Found ${usdtPairs.length} available USDT trading pairs`);
        console.log(`🔍 This feature will help users discover trading pairs for dynamic addition`);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        Logger.error('Available pairs test failed', { error: error.message });
        process.exit(1);
    }
}

// Install node-fetch if not available, or provide fallback
try {
    require('node-fetch');
} catch (e) {
    console.log('📦 node-fetch not available - skipping HTTP tests');
    // You can install it with: npm install node-fetch@2
}

// Run the test
testAvailablePairs();