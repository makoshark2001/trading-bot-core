require('dotenv').config();
const config = require('config');
const { XeggexClient, MarketDataCollector } = require('../src/data/collectors');
const { TechnicalStrategies } = require('../src/strategies/technical');
const { Logger } = require('../src/utils');

async function testTechnicalStrategies() {
    console.log('🚀 Testing Technical Strategies...');
    
    // Helper function for RSI interpretation
    function interpretRSI(value) {
        if (value > 80) return "Extremely Overbought";
        if (value > 70) return "Overbought";
        if (value > 60) return "Bullish";
        if (value > 40) return "Neutral";
        if (value > 30) return "Bearish";
        if (value > 20) return "Oversold";
        return "Extremely Oversold";
    }
    
    // Initialize components
    const apiClient = new XeggexClient(
        process.env.X_API,
        process.env.X_SECRET,
        config.get('api.xeggex')
    );
    
    const dataCollector = new MarketDataCollector(apiClient, {
        pairs: ['RVN'],
        updateInterval: 60000,
        dataRetention: 200
    });
    
    const strategies = new TechnicalStrategies();
    
    try {
        // Test 1: Initialize and get some data
        console.log('\n📊 Test 1: Getting market data...');
        await dataCollector.initialize();
        
        // Wait a moment for data to be collected
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const rvnData = dataCollector.getHistoryForPair('RVN');
        console.log('RVN data points:', rvnData?.closes?.length || 0);
        
        if (!rvnData || rvnData.closes.length < 15) {
            throw new Error('Insufficient data for testing (need at least 15 points)');
        }
        
        // Test 2: Testing individual RSI calculation through TechnicalStrategies
        console.log('\n📊 Test 2: Testing RSI through TechnicalStrategies...');
        const rsiResult = strategies.calculateRSI(rvnData);
        
        console.log('RSI Result:', {
            value: rsiResult.value,
            suggestion: rsiResult.suggestion,
            confidence: rsiResult.confidence,
            interpretation: rsiResult.metadata?.interpretation
        });
        
        // Test 3: Moving Average with different periods  
        console.log('\n📊 Test 3: Testing Moving Average with different periods...');
        const maPeriods = [[5, 10], [10, 21], [20, 50]];
        for (const [fast, slow] of maPeriods) {
            const result = strategies.calculateMovingAverage(rvnData, fast, slow);
            console.log(`MA(${fast},${slow}): Fast=${result.fastMA?.toFixed(6)}, Slow=${result.slowMA?.toFixed(6)} - ${result.suggestion} (confidence: ${result.confidence})`);
        }

        // Test 4: RSI with different periods using TechnicalStrategies
        console.log('\n📊 Test 3: Testing RSI with different periods...');
        const periods = [7, 14, 21];
        for (const period of periods) {
            const result = strategies.calculateRSI(rvnData, period);
            console.log(`RSI(${period}): ${result.value} - ${result.suggestion} (confidence: ${result.confidence})`);
        }
        
        // Test 4: TechnicalStrategies class
        console.log('\n📊 Test 4: Testing TechnicalStrategies class...');
        const hasEnoughData = strategies.hasEnoughData(rvnData, 15);
        console.log('Has enough data for analysis:', hasEnoughData ? '✅ YES' : '❌ NO');
        
        if (hasEnoughData) {
            const allResults = strategies.calculateAll(rvnData);
            console.log('All strategy results:', allResults);
            
            // Test 5: Ensemble signal
            console.log('\n📊 Test 5: Testing ensemble signal...');
            const ensembleSignal = strategies.getEnsembleSignal(rvnData);
            console.log('Ensemble Signal:', {
                suggestion: ensembleSignal.suggestion,
                confidence: ensembleSignal.confidence,
                buyScore: ensembleSignal.metadata.buyScore,
                sellScore: ensembleSignal.metadata.sellScore,
                validStrategies: ensembleSignal.metadata.validStrategies
            });
        }
        
        // Test 6: Edge cases
        console.log('\n📊 Test 6: Testing edge cases...');
        
        // Test with insufficient data
        const shortData = { closes: [100, 101, 102] };
        const shortResult = strategies.calculateRSI(shortData);
        console.log('Short data RSI (should handle gracefully):', {
            suggestion: shortResult.suggestion,
            error: shortResult.error ? 'Has error' : 'No error'
        });
        
        // Test with invalid data
        const invalidData = { closes: [100, NaN, 102, Infinity] };
        const invalidResult = strategies.calculateRSI(invalidData);
        console.log('Invalid data RSI (should handle gracefully):', {
            suggestion: invalidResult.suggestion,
            error: invalidResult.error ? 'Has error' : 'No error'
        });
        
        // Test 7: Interpretation examples
        console.log('\n📊 Test 7: RSI Interpretation examples...');
        const testValues = [15, 25, 35, 50, 65, 75, 85];
        testValues.forEach(value => {
            console.log(`RSI ${value}: ${interpretRSI(value)}`);
        });
        
        // Test 8: Strategy stats
        console.log('\n📊 Test 8: Strategy statistics...');
        const stats = strategies.getStats();
        console.log('Strategy stats:', stats);
        
        console.log('\n🎉 All technical strategy tests completed successfully!');
        
        // Stop data collection
        dataCollector.stop();
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        Logger.error('Technical strategies test failed', { error: error.message });
        dataCollector.stop();
        process.exit(1);
    }
    
    // Force exit after a moment
    setTimeout(() => process.exit(0), 1000);
}

// Run the test
testTechnicalStrategies();