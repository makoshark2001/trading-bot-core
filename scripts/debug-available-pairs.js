require('dotenv').config();
const config = require('config');
const { XeggexClient } = require('../src/data/collectors');

async function debugAvailablePairs() {
    console.log('🔍 Debugging Available Pairs Issue...');
    
    try {
        // Step 1: Test XeggexClient directly
        console.log('\n📊 Step 1: Testing XeggexClient.getMarkets()...');
        
        const apiClient = new XeggexClient(
            process.env.X_API,
            process.env.X_SECRET,
            config.get('api.xeggex')
        );
        
        const markets = await apiClient.getMarkets();
        console.log('Raw markets response:', {
            isArray: Array.isArray(markets),
            length: markets ? markets.length : 0,
            firstMarket: markets && markets[0] ? markets[0] : 'No markets found'
        });
        
        if (!markets || markets.length === 0) {
            console.log('❌ No markets returned from Xeggex API');
            return;
        }
        
        // Step 2: Test USDT filtering
        console.log('\n📊 Step 2: Testing USDT pair filtering...');
        
        const usdtMarkets = markets.filter(market => {
            return market.symbol && market.symbol.endsWith('_USDT');
        });
        
        console.log('USDT markets found:', {
            totalMarkets: markets.length,
            usdtMarkets: usdtMarkets.length,
            sampleUSDTMarkets: usdtMarkets.slice(0, 5).map(m => ({
                symbol: m.symbol,
                isActive: m.isActive,
                lastPrice: m.lastPrice
            }))
        });
        
        // Step 3: Test the getUSDTPairs method
        console.log('\n📊 Step 3: Testing getUSDTPairs() method...');
        
        const usdtPairs = await apiClient.getUSDTPairs();
        console.log('Processed USDT pairs:', {
            totalPairs: usdtPairs.length,
            samplePairs: usdtPairs.slice(0, 5).map(p => ({
                pair: p.pair,
                symbol: p.symbol,
                isActive: p.isActive,
                lastPrice: p.lastPrice,
                volume24h: p.volume24h
            }))
        });
        
        // Step 4: Check current tracked pairs
        console.log('\n📊 Step 4: Checking current tracked pairs...');
        
        try {
            const fetch = require('node-fetch');
            const configResponse = await fetch('http://localhost:3000/api/config');
            const configData = await configResponse.json();
            
            console.log('Current tracked pairs:', {
                pairs: configData.config.pairs,
                count: configData.config.pairs.length
            });
            
            // Step 5: Test the enrichment logic
            console.log('\n📊 Step 5: Testing enrichment logic...');
            
            const enrichedPairs = usdtPairs.map(pair => ({
                ...pair,
                isTracked: configData.config.pairs.includes(pair.pair),
                canAdd: !configData.config.pairs.includes(pair.pair)
            }));
            
            const canAddPairs = enrichedPairs.filter(p => p.canAdd);
            const trackedPairs = enrichedPairs.filter(p => p.isTracked);
            
            console.log('Enrichment results:', {
                totalPairs: enrichedPairs.length,
                canAdd: canAddPairs.length,
                tracked: trackedPairs.length,
                sampleCanAdd: canAddPairs.slice(0, 5).map(p => p.pair),
                sampleTracked: trackedPairs.map(p => p.pair)
            });
            
            if (canAddPairs.length === 0) {
                console.log('\n⚠️  ISSUE FOUND: No pairs available to add!');
                console.log('This could mean:');
                console.log('1. All USDT pairs are already being tracked');
                console.log('2. The enrichment logic has a bug');
                console.log('3. The current pairs array is too broad');
                
                // Check if we're tracking pairs that don't exist in USDT markets
                const trackedButNotInUSDT = configData.config.pairs.filter(tracked => 
                    !usdtPairs.some(usdt => usdt.pair === tracked)
                );
                
                if (trackedButNotInUSDT.length > 0) {
                    console.log('\n🔍 Tracked pairs not found in USDT markets:', trackedButNotInUSDT);
                    console.log('These might be tracked with different symbols or unavailable');
                }
            } else {
                console.log('\n✅ Found pairs available to add:', canAddPairs.slice(0, 10).map(p => p.pair));
            }
            
        } catch (serverError) {
            console.log('⚠️  Server not running. Testing offline...');
            
            // Test with mock current pairs
            const mockCurrentPairs = ['XMR', 'RVN', 'BEL', 'DOGE', 'KAS', 'SAL'];
            
            const enrichedPairs = usdtPairs.map(pair => ({
                ...pair,
                isTracked: mockCurrentPairs.includes(pair.pair),
                canAdd: !mockCurrentPairs.includes(pair.pair)
            }));
            
            const canAddPairs = enrichedPairs.filter(p => p.canAdd);
            
            console.log('Mock enrichment results:', {
                mockTracked: mockCurrentPairs,
                totalUSDTPairs: usdtPairs.length,
                canAdd: canAddPairs.length,
                sampleCanAdd: canAddPairs.slice(0, 10).map(p => p.pair)
            });
        }
        
        // Step 6: Check specific popular pairs
        console.log('\n📊 Step 6: Checking for popular pairs...');
        
        const popularPairs = ['BTC', 'ETH', 'LTC', 'ADA', 'DOT', 'LINK', 'UNI', 'AVAX'];
        const foundPopular = [];
        const missingPopular = [];
        
        popularPairs.forEach(pair => {
            const found = usdtPairs.find(p => p.pair === pair);
            if (found) {
                foundPopular.push({
                    pair: pair,
                    active: found.isActive,
                    price: found.lastPrice,
                    volume: found.volume24h
                });
            } else {
                missingPopular.push(pair);
            }
        });
        
        console.log('Popular pairs analysis:', {
            found: foundPopular.length,
            missing: missingPopular.length,
            foundPairs: foundPopular,
            missingPairs: missingPopular
        });
        
        console.log('\n🎉 Debug completed!');
        
        if (usdtPairs.length === 0) {
            console.log('\n❌ ROOT ISSUE: No USDT pairs found from Xeggex API');
            console.log('Solutions:');
            console.log('1. Check if Xeggex API is working: https://api.xeggex.com/api/v2/market/getlist');
            console.log('2. Verify API credentials are valid');
            console.log('3. Check if USDT markets exist on Xeggex');
        } else if (canAddPairs && canAddPairs.length === 0) {
            console.log('\n⚠️  ISSUE: All USDT pairs are already tracked');
            console.log('Solutions:');
            console.log('1. Remove some current pairs to make room for new ones');
            console.log('2. Check if the tracking logic is working correctly');
        } else {
            console.log('\n✅ Everything looks normal - pairs should be available to add');
        }
        
    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the debug
debugAvailablePairs();