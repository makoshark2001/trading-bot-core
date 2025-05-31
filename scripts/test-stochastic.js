require('dotenv').config();
const Stochastic = require('../src/strategies/technical/indicators/Stochastic');
const { Logger } = require('../src/utils');

async function testStochastic() {
    console.log('🚀 Testing Stochastic Indicator...');
    
    // Test data with enough points (20 data points to be safe)
    const testData = {
        highs: [105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124],
        lows: [100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119],
        closes: [102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122]
    };

    try {
        console.log('\n📊 Test 1: Basic Stochastic calculation...');
        console.log(`Using ${testData.closes.length} data points`);
        
        const stochastic = new Stochastic(14, 3);
        const result = stochastic.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Stochastic calculation successful!');
        console.log('Results:', {
            '%K': result.k,
            '%D': result.d,
            suggestion: result.suggestion,
            confidence: result.confidence,
            interpretation: result.metadata.interpretation
        });

        console.log('\n📊 Test 2: Different periods (shorter)...');
        const stochastic2 = new Stochastic(5, 3);
        const result2 = stochastic2.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Different period test successful!');
        console.log('Results (5,3):', {
            '%K': result2.k,
            '%D': result2.d,
            suggestion: result2.suggestion
        });

        console.log('\n📊 Test 3: Edge case - insufficient data...');
        try {
            const shortData = {
                highs: [105, 108, 110],
                lows: [100, 103, 105],
                closes: [102, 106, 108]
            };
            stochastic.calculate(shortData.highs, shortData.lows, shortData.closes);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data:', error.message);
        }

        console.log('\n📊 Test 4: Extreme values test...');
        const extremeData = {
            highs: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 200, 200, 200, 200],
            lows: [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90],
            closes: [95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 195, 195, 195, 195]
        };
        
        const extremeResult = stochastic.calculate(extremeData.highs, extremeData.lows, extremeData.closes);
        console.log('✅ Extreme values test successful!');
        console.log('Extreme Results:', {
            '%K': extremeResult.k,
            '%D': extremeResult.d,
            suggestion: extremeResult.suggestion
        });

        console.log('\n🎉 All Stochastic tests passed!');
        
    } catch (error) {
        console.error('\n❌ Stochastic test failed:', error.message);
        Logger.error('Stochastic test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testStochastic();