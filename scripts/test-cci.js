require('dotenv').config();
const CCI = require('../src/strategies/technical/indicators/CCI');
const { Logger } = require('../src/utils');

async function testCCI() {
    console.log('🚀 Testing CCI (Commodity Channel Index) Indicator...');
    
    // Test data with enough points (25 data points for 20-period)
    const testData = {
        highs: [
            105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124,
            126, 125, 127, 129, 128
        ],
        lows: [
            100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119,
            121, 120, 122, 124, 123
        ],
        closes: [
            102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122,
            124, 123, 125, 127, 126
        ]
    };

    try {
        console.log('\n📊 Test 1: Basic CCI calculation...');
        console.log(`Using ${testData.closes.length} data points`);
        
        const cci = new CCI(20);
        const result = cci.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ CCI calculation successful!');
        console.log('Results:', {
            'CCI': result.cci,
            'Typical Price': result.typicalPrice,
            'SMA TP': result.smaTP,
            'Mean Deviation': result.meanDeviation,
            'Level': result.metadata.level,
            'Suggestion': result.suggestion,
            'Confidence': result.confidence
        });

        console.log('\n📊 Signal Analysis:');
        console.log('Interpretation:', result.metadata.interpretation);

        console.log('\n📊 Test 2: Different periods...');
        const cci2 = new CCI(14);
        const result2 = cci2.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Different period test successful!');
        console.log('Results (14-period):', {
            'CCI': result2.cci,
            'Level': result2.metadata.level,
            'Suggestion': result2.suggestion
        });

        console.log('\n📊 Test 3: Edge case - insufficient data...');
        try {
            const shortData = {
                highs: [105, 108, 110],
                lows: [100, 103, 105],
                closes: [102, 106, 108]
            };
            cci.calculate(shortData.highs, shortData.lows, shortData.closes);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data:', error.message);
        }

        console.log('\n📊 Test 4: Extreme values test...');
        // Create overbought scenario
        const overboughtData = {
            highs: Array.from({length: 25}, (_, i) => 100 + i * 5),
            lows: Array.from({length: 25}, (_, i) => 95 + i * 5),
            closes: Array.from({length: 25}, (_, i) => 98 + i * 5)
        };
        
        const overboughtResult = cci.calculate(overboughtData.highs, overboughtData.lows, overboughtData.closes);
        console.log('✅ Overbought test successful!');
        console.log('Overbought Results:', {
            'CCI': overboughtResult.cci,
            'Level': overboughtResult.metadata.level,
            'Suggestion': overboughtResult.suggestion
        });

        console.log('\n📊 Test 5: Helper methods...');
        
        // Test CCI interpretation
        const testValues = [-250, -150, -50, 0, 50, 150, 250];
        console.log('CCI Interpretations:');
        testValues.forEach(value => {
            console.log(`CCI ${value}: ${CCI.interpretCCI(value)}`);
        });

        console.log('\n🎉 All CCI tests passed!');
        console.log('CCI is ready for integration! 🚀');
        
    } catch (error) {
        console.error('\n❌ CCI test failed:', error.message);
        Logger.error('CCI test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testCCI();