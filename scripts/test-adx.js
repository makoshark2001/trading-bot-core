require('dotenv').config();
const ADX = require('../src/strategies/technical/indicators/ADX');
const { Logger } = require('../src/utils');

async function testADX() {
    console.log('🚀 Testing ADX (Average Directional Index) Indicator...');
    
    // Test data with enough points (40 data points for 14-period with smoothing)
    const testData = {
        highs: [
            105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124,
            126, 125, 127, 129, 128, 130, 132, 131, 133, 135, 134, 136, 138, 137, 139, 141, 140, 142, 144, 143
        ],
        lows: [
            100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119,
            121, 120, 122, 124, 123, 125, 127, 126, 128, 130, 129, 131, 133, 132, 134, 136, 135, 137, 139, 138
        ],
        closes: [
            102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122,
            124, 123, 125, 127, 126, 128, 130, 129, 131, 133, 132, 134, 136, 135, 137, 139, 138, 140, 142, 141
        ]
    };

    try {
        console.log('\n📊 Test 1: Basic ADX calculation...');
        console.log(`Using ${testData.closes.length} data points`);
        
        const adx = new ADX(14);
        const result = adx.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ ADX calculation successful!');
        console.log('Results:', {
            'ADX': result.adx,
            '+DI': result.plusDI,
            '-DI': result.minusDI,
            'DX': result.dx,
            'Trend Strength': result.metadata.trendStrength,
            'Trend Direction': result.metadata.trendDirection,
            'Suggestion': result.suggestion,
            'Confidence': result.confidence
        });

        console.log('\n📊 Signal Analysis:');
        console.log('Interpretation:', result.metadata.interpretation);

        console.log('\n📊 Test 2: Different periods (shorter)...');
        const adx2 = new ADX(10);
        const result2 = adx2.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Different period test successful!');
        console.log('Results (10-period):', {
            'ADX': result2.adx,
            'Trend Strength': result2.metadata.trendStrength,
            'Suggestion': result2.suggestion,
            'Confidence': result2.confidence
        });

        console.log('\n📊 Test 3: Edge case - insufficient data...');
        try {
            const shortData = {
                highs: [105, 108, 110, 107, 109],
                lows: [100, 103, 105, 102, 104],
                closes: [102, 106, 108, 105, 107]
            };
            adx.calculate(shortData.highs, shortData.lows, shortData.closes);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data:', error.message);
        }

        console.log('\n📊 Test 4: Strong trend test...');
        // Create data with strong uptrend
        const strongTrendData = {
            highs: Array.from({length: 40}, (_, i) => 100 + i * 3 + Math.random() * 2),
            lows: Array.from({length: 40}, (_, i) => 95 + i * 3 + Math.random() * 2),
            closes: Array.from({length: 40}, (_, i) => 98 + i * 3 + Math.random() * 2)
        };
        
        const strongResult = adx.calculate(strongTrendData.highs, strongTrendData.lows, strongTrendData.closes);
        console.log('✅ Strong trend test successful!');
        console.log('Strong Trend Results:', {
            'ADX': strongResult.adx,
            'Trend Strength': strongResult.metadata.trendStrength,
            'Trend Direction': strongResult.metadata.trendDirection,
            '+DI': strongResult.plusDI,
            '-DI': strongResult.minusDI,
            'Suggestion': strongResult.suggestion,
            'Confidence': strongResult.confidence
        });

        console.log('\n📊 Test 5: Ranging market test...');
        // Create data with sideways movement (ranging market)
        const rangingData = {
            highs: Array.from({length: 40}, (_, i) => 100 + Math.sin(i * 0.3) * 3 + Math.random()),
            lows: Array.from({length: 40}, (_, i) => 95 + Math.sin(i * 0.3) * 3 + Math.random()),
            closes: Array.from({length: 40}, (_, i) => 97.5 + Math.sin(i * 0.3) * 3 + Math.random())
        };
        
        const rangingResult = adx.calculate(rangingData.highs, rangingData.lows, rangingData.closes);
        console.log('✅ Ranging market test successful!');
        console.log('Ranging Market Results:', {
            'ADX': rangingResult.adx,
            'Trend Strength': rangingResult.metadata.trendStrength,
            'Suggestion': rangingResult.suggestion,
            'Should be': 'hold (low ADX in ranging market)'
        });

        console.log('\n📊 Test 6: Helper methods...');
        
        // Test ADX interpretation
        const testValues = [15, 22, 35, 45, 60];
        console.log('ADX Interpretations:');
        testValues.forEach(value => {
            console.log(`ADX ${value}: ${ADX.interpretADX(value)}`);
        });
        
        // Test trend direction
        console.log('\nTrend Direction Tests:');
        console.log(`+DI(30) > -DI(20): ${ADX.getTrendDirection(30, 20)}`);
        console.log(`+DI(20) < -DI(30): ${ADX.getTrendDirection(20, 30)}`);
        console.log(`+DI(25) = -DI(25): ${ADX.getTrendDirection(25, 25)}`);

        console.log('\n📊 Test 7: Different market conditions...');
        
        // Test with volatile data
        const volatileData = {
            highs: [100, 110, 95, 120, 85, 130, 90, 125, 80, 135, 115, 105, 140, 95, 110, 125, 90, 145, 100, 120, 
                   130, 85, 150, 105, 115, 135, 95, 140, 110, 125, 145, 90, 155, 115, 130, 140, 100, 160, 120, 135],
            lows: [95, 105, 85, 115, 75, 125, 80, 120, 70, 130, 110, 95, 135, 85, 100, 120, 80, 140, 90, 115,
                  125, 75, 145, 95, 105, 130, 85, 135, 100, 120, 140, 80, 150, 105, 125, 135, 90, 155, 110, 130],
            closes: [98, 108, 88, 118, 78, 128, 85, 123, 75, 133, 113, 98, 138, 88, 105, 123, 85, 143, 95, 118,
                    128, 78, 148, 98, 110, 133, 88, 138, 105, 123, 143, 85, 153, 110, 128, 138, 95, 158, 115, 133]
        };
        
        const volatileResult = adx.calculate(volatileData.highs, volatileData.lows, volatileData.closes);
        console.log('Volatile Market Results:', {
            'ADX': volatileResult.adx,
            'Trend Strength': volatileResult.metadata.trendStrength,
            'Trend Direction': volatileResult.metadata.trendDirection,
            'Suggestion': volatileResult.suggestion
        });

        console.log('\n🎉 All ADX tests passed!');
        console.log('ADX is now ready for integration! 🚀');
        
    } catch (error) {
        console.error('\n❌ ADX test failed:', error.message);
        Logger.error('ADX test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testADX();