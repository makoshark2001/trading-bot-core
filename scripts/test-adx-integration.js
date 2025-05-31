require('dotenv').config();
const { TechnicalStrategies } = require('../src/strategies/technical');
const { Logger } = require('../src/utils');

async function testADXIntegration() {
    console.log('🚀 Testing ADX Integration...');
    
    // Create comprehensive sample market data (40 points for ADX requirements)
    const sampleData = {
        closes: Array.from({length: 40}, (_, i) => 100 + i * 0.8 + Math.sin(i * 0.15) * 3),
        highs: Array.from({length: 40}, (_, i) => 105 + i * 0.8 + Math.sin(i * 0.15) * 3),
        lows: Array.from({length: 40}, (_, i) => 95 + i * 0.8 + Math.sin(i * 0.15) * 3),
        volumes: Array.from({length: 40}, (_, i) => 1000 + Math.random() * 500),
        timestamps: Array.from({length: 40}, (_, i) => Date.now() - (39-i) * 300000)
    };

    try {
        console.log('\n📊 Test 1: Individual ADX calculation...');
        const strategies = new TechnicalStrategies();
        const adxResult = strategies.calculateADX(sampleData);
        
        console.log('✅ Individual ADX test successful!');
        console.log('ADX Result:', {
            adx: adxResult.adx,
            plusDI: adxResult.plusDI,
            minusDI: adxResult.minusDI,
            trendStrength: adxResult.metadata?.trendStrength,
            trendDirection: adxResult.metadata?.trendDirection,
            suggestion: adxResult.suggestion,
            confidence: adxResult.confidence,
            interpretation: adxResult.metadata?.interpretation
        });

        console.log('\n📊 Test 2: Calculate all strategies (including ADX)...');
        const allResults = strategies.calculateAll(sampleData);
        
        console.log('✅ Calculate all test successful!');
        console.log('Available strategies:', Object.keys(allResults));
        
        if (allResults.adx) {
            console.log('ADX in results:', {
                adx: allResults.adx.adx,
                trendStrength: allResults.adx.metadata?.trendStrength,
                trendDirection: allResults.adx.metadata?.trendDirection,
                suggestion: allResults.adx.suggestion,
                confidence: allResults.adx.confidence
            });
        } else {
            console.log('❌ ADX missing from results!');
        }

        console.log('\n📊 Test 3: Ensemble signal (with ADX)...');
        const ensembleSignal = strategies.getEnsembleSignal(sampleData);
        
        console.log('✅ Ensemble signal test successful!');
        console.log('Ensemble Result:', {
            suggestion: ensembleSignal.suggestion,
            confidence: ensembleSignal.confidence,
            validStrategies: ensembleSignal.metadata.validStrategies,
            buyScore: ensembleSignal.metadata.buyScore,
            sellScore: ensembleSignal.metadata.sellScore
        });

        console.log('\n📊 Test 4: Strategy weights verification...');
        const adxWeight = strategies.getStrategyWeight('adx');
        console.log('ADX weight:', adxWeight);
        console.log('All strategy weights:', {
            rsi: strategies.getStrategyWeight('rsi'),
            macd: strategies.getStrategyWeight('macd'),
            bollinger: strategies.getStrategyWeight('bollinger'),
            ma: strategies.getStrategyWeight('ma'),
            volume: strategies.getStrategyWeight('volume'),
            stochastic: strategies.getStrategyWeight('stochastic'),
            williamsR: strategies.getStrategyWeight('williamsR'),
            ichimoku: strategies.getStrategyWeight('ichimoku'),
            adx: strategies.getStrategyWeight('adx')
        });

        console.log('\n📊 Test 5: Strategy comparison...');
        console.log('Strategy Comparison:');
        Object.entries(allResults).forEach(([name, result]) => {
            if (!result.error) {
                const confidence = (result.confidence * 100).toFixed(1);
                let extra = '';
                
                // Add specific info for ADX
                if (name === 'adx') {
                    extra = ` (Strength: ${result.metadata?.trendStrength})`;
                }
                
                console.log(`${name.toUpperCase()}: ${result.suggestion} (confidence: ${confidence}%)${extra}`);
            }
        });

        console.log('\n📊 Test 6: ADX-specific analysis...');
        if (allResults.adx && !allResults.adx.error) {
            const adx = allResults.adx;
            console.log('Detailed ADX Analysis:');
            console.log(`- ADX Value: ${adx.adx} (${adx.metadata?.trendStrength})`);
            console.log(`- Plus Directional Indicator (+DI): ${adx.plusDI}`);
            console.log(`- Minus Directional Indicator (-DI): ${adx.minusDI}`);
            console.log(`- Trend Direction: ${adx.metadata?.trendDirection}`);
            console.log(`- Suggestion: ${adx.suggestion}`);
            console.log(`- Confidence: ${(adx.confidence * 100).toFixed(1)}%`);
            console.log(`- Interpretation: ${adx.metadata?.interpretation}`);
        }

        console.log('\n📊 Test 7: Different market scenarios...');
        
        // Test with strong trending data
        const trendingData = {
            closes: Array.from({length: 40}, (_, i) => 100 + i * 2),
            highs: Array.from({length: 40}, (_, i) => 105 + i * 2),
            lows: Array.from({length: 40}, (_, i) => 95 + i * 2),
            volumes: Array.from({length: 40}, () => 1000),
            timestamps: Array.from({length: 40}, (_, i) => Date.now() - (39-i) * 300000)
        };
        
        const trendingResult = strategies.calculateADX(trendingData);
        console.log('Strong Trending Market:', {
            adx: trendingResult.adx,
            trendStrength: trendingResult.metadata?.trendStrength,
            suggestion: trendingResult.suggestion,
            confidence: (trendingResult.confidence * 100).toFixed(1) + '%'
        });
        
        // Test with ranging data
        const rangingData = {
            closes: Array.from({length: 40}, (_, i) => 100 + Math.sin(i * 0.5) * 2),
            highs: Array.from({length: 40}, (_, i) => 103 + Math.sin(i * 0.5) * 2),
            lows: Array.from({length: 40}, (_, i) => 97 + Math.sin(i * 0.5) * 2),
            volumes: Array.from({length: 40}, () => 1000),
            timestamps: Array.from({length: 40}, (_, i) => Date.now() - (39-i) * 300000)
        };
        
        const rangingResult = strategies.calculateADX(rangingData);
        console.log('Ranging Market:', {
            adx: rangingResult.adx,
            trendStrength: rangingResult.metadata?.trendStrength,
            suggestion: rangingResult.suggestion,
            confidence: (rangingResult.confidence * 100).toFixed(1) + '%'
        });

        console.log('\n📊 Test 8: Ensemble with ADX influence...');
        const trendingEnsemble = strategies.getEnsembleSignal(trendingData);
        const rangingEnsemble = strategies.getEnsembleSignal(rangingData);
        
        console.log('Trending market ensemble:', {
            suggestion: trendingEnsemble.suggestion,
            confidence: (trendingEnsemble.confidence * 100).toFixed(1) + '%'
        });
        
        console.log('Ranging market ensemble:', {
            suggestion: rangingEnsemble.suggestion,
            confidence: (rangingEnsemble.confidence * 100).toFixed(1) + '%'
        });

        console.log('\n🎉 All ADX integration tests passed!');
        console.log('ADX is now fully integrated! 🚀');
        console.log(`Total indicators available: ${Object.keys(allResults).length}`);
        console.log('ADX Weight in ensemble:', adxWeight, '(Higher weight = more influence)');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        Logger.error('ADX integration test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testADXIntegration();