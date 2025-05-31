require('dotenv').config();
const WilliamsR = require('../src/strategies/technical/indicators/WilliamsR');
const { Logger } = require('../src/utils');

async function testWilliamsR() {
    console.log('🚀 Testing Williams %R Indicator...');
    
    // Test data with enough points (20 data points)
    const testData = {
        highs: [105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124],
        lows: [100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119],
        closes: [102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122]
    };

    try {
        console.log('\n📊 Test 1: Basic Williams %R calculation...');
        console.log(`Using ${testData.closes.length} data points`);
        
        const williamsR = new WilliamsR(14);
        const result = williamsR.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Williams %R calculation successful!');
        console.log('Results:', {
            'Value': result.value,
            'Level': result.metadata.level,
            'Suggestion': result.suggestion,
            'Confidence': result.confidence,
            'Interpretation': result.metadata.interpretation
        });

        console.log('\n📊 Test 2: Different period (7)...');
        const williamsR2 = new WilliamsR(7);
        const result2 = williamsR2.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Different period test successful!');
        console.log('Results (7):', {
            'Value': result2.value,
            'Suggestion': result2.suggestion,
            'Level': result2.metadata.level
        });

        console.log('\n📊 Test 3: Edge case - insufficient data...');
        try {
            const shortData = {
                highs: [105, 108, 110],
                lows: [100, 103, 105],
                closes: [102, 106, 108]
            };
            williamsR.calculate(shortData.highs, shortData.lows, shortData.closes);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data:', error.message);
        }

        console.log('\n📊 Test 4: Extreme oversold test...');
        const extremeData = {
            highs: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 200, 200, 200, 200, 200, 200],
            lows: [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90],
            closes: [91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91]
        };
        
        const extremeResult = williamsR.calculate(extremeData.highs, extremeData.lows, extremeData.closes);
        console.log('✅ Extreme values test successful!');
        console.log('Extreme Results:', {
            'Value': extremeResult.value,
            'Level': extremeResult.metadata.level,
            'Suggestion': extremeResult.suggestion
        });

        console.log('\n🎉 All Williams %R tests passed!');
        
    } catch (error) {
        console.error('\n❌ Williams %R test failed:', error.message);
        Logger.error('Williams %R test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testWilliamsR();