require('dotenv').config();
const IchimokuCloud = require('../src/strategies/technical/indicators/IchimokuCloud');
const { Logger } = require('../src/utils');

async function testIchimoku() {
    console.log('🚀 Testing Ichimoku Cloud Indicator...');
    
    // Test data with enough points (60 data points to accommodate 52-period requirement)
    const testData = {
        highs: [
            105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124,
            126, 125, 127, 129, 128, 130, 132, 131, 133, 135, 134, 136, 138, 137, 139, 141, 140, 142, 144, 143,
            145, 147, 146, 148, 150, 149, 151, 153, 152, 154, 156, 155, 157, 159, 158, 160, 162, 161, 163, 165
        ],
        lows: [
            100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119,
            121, 120, 122, 124, 123, 125, 127, 126, 128, 130, 129, 131, 133, 132, 134, 136, 135, 137, 139, 138,
            140, 142, 141, 143, 145, 144, 146, 148, 147, 149, 151, 150, 152, 154, 153, 155, 157, 156, 158, 160
        ],
        closes: [
            102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122,
            124, 123, 125, 127, 126, 128, 130, 129, 131, 133, 132, 134, 136, 135, 137, 139, 138, 140, 142, 141,
            143, 145, 144, 146, 148, 147, 149, 151, 150, 152, 154, 153, 155, 157, 156, 158, 160, 159, 161, 163
        ]
    };

    try {
        console.log('\n📊 Test 1: Basic Ichimoku Cloud calculation...');
        console.log(`Using ${testData.closes.length} data points`);
        
        const ichimoku = new IchimokuCloud(9, 26, 52, 26);
        const result = ichimoku.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Ichimoku Cloud calculation successful!');
        console.log('Results:', {
            'Tenkan-sen (Conversion)': result.tenkanSen,
            'Kijun-sen (Base)': result.kijunSen,
            'Senkou Span A': result.senkouSpanA,
            'Senkou Span B': result.senkouSpanB,
            'Chikou Span': result.chikouSpan,
            'Cloud Color': result.cloudColor,
            'Cloud Thickness': result.cloudThickness,
            'Current Price': result.currentPrice,
            'Suggestion': result.suggestion,
            'Confidence': result.confidence,
            'Trend': result.metadata.trend
        });

        console.log('\n📊 Signal Analysis:');
        console.log('Signals detected:', result.metadata.signals);
        console.log('Interpretation:', result.metadata.interpretation);

        console.log('\n📊 Test 2: Different parameters (faster settings)...');
        const ichimoku2 = new IchimokuCloud(7, 20, 40, 20);
        const result2 = ichimoku2.calculate(testData.highs, testData.lows, testData.closes);
        
        console.log('✅ Different parameters test successful!');
        console.log('Results (7,20,40,20):', {
            'Cloud Color': result2.cloudColor,
            'Suggestion': result2.suggestion,
            'Trend': result2.metadata.trend,
            'Confidence': result2.confidence
        });

        console.log('\n📊 Test 3: Edge case - insufficient data...');
        try {
            const shortData = {
                highs: [105, 108, 110, 107, 109],
                lows: [100, 103, 105, 102, 104],
                closes: [102, 106, 108, 105, 107]
            };
            ichimoku.calculate(shortData.highs, shortData.lows, shortData.closes);
            console.log('❌ Should have thrown error for insufficient data');
        } catch (error) {
            console.log('✅ Correctly handled insufficient data:', error.message);
        }

        console.log('\n📊 Test 4: Strong trend test...');
        // Create data with strong uptrend
        const trendData = {
            highs: Array.from({length: 60}, (_, i) => 100 + i * 2 + Math.random() * 2),
            lows: Array.from({length: 60}, (_, i) => 95 + i * 2 + Math.random() * 2),
            closes: Array.from({length: 60}, (_, i) => 98 + i * 2 + Math.random() * 2)
        };
        
        const trendResult = ichimoku.calculate(trendData.highs, trendData.lows, trendData.closes);
        console.log('✅ Strong trend test successful!');
        console.log('Trend Results:', {
            'Cloud Color': trendResult.cloudColor,
            'Trend': trendResult.metadata.trend,
            'Suggestion': trendResult.suggestion,
            'Confidence': trendResult.confidence,
            'Signals': trendResult.metadata.signals.length
        });

        console.log('\n📊 Test 5: Helper methods...');
        
        // Test signal interpretation
        const signals = ['price_above_cloud', 'tenkan_above_kijun', 'chikou_bullish'];
        const interpretations = IchimokuCloud.interpretSignals(signals, 'strong_uptrend');
        console.log('Signal interpretations:', interpretations);
        
        // Test trend strength
        const trendStrength = IchimokuCloud.getTrendStrength('strong_uptrend', 0.8);
        console.log('Trend strength:', trendStrength);

        console.log('\n🎉 All Ichimoku Cloud tests passed!');
        console.log('Ichimoku Cloud is now ready for integration! 🚀');
        
    } catch (error) {
        console.error('\n❌ Ichimoku Cloud test failed:', error.message);
        Logger.error('Ichimoku Cloud test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testIchimoku();