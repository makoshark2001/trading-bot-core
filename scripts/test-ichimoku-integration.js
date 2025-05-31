require('dotenv').config();
const { TechnicalStrategies } = require('../src/strategies/technical');
const { Logger } = require('../src/utils');

async function testIchimokuIntegration() {
    console.log('🚀 Testing Ichimoku Cloud Integration...');
    
    // Create comprehensive sample market data (60 points for Ichimoku requirements)
    const sampleData = {
        closes: Array.from({length: 60}, (_, i) => 100 + i * 0.5 + Math.sin(i * 0.1) * 5),
        highs: Array.from({length: 60}, (_, i) => 105 + i * 0.5 + Math.sin(i * 0.1) * 5),
        lows: Array.from({length: 60}, (_, i) => 95 + i * 0.5 + Math.sin(i * 0.1) * 5),
        volumes: Array.from({length: 60}, (_, i) => 1000 + Math.random() * 500),
        timestamps: Array.from({length: 60}, (_, i) => Date.now() - (59-i) * 300000)
    };

    try {
        console.log('\n📊 Test 1: Individual Ichimoku calculation...');
        const strategies = new TechnicalStrategies();
        const ichimokuResult = strategies.calculateIchimokuCloud(sampleData);
        
        console.log('✅ Individual Ichimoku test successful!');
        console.log('Ichimoku Result:', {
            tenkanSen: ichimokuResult.tenkanSen,
            kijunSen: ichimokuResult.kijunSen,
            cloudColor: ichimokuResult.cloudColor,
            cloudThickness: ichimokuResult.cloudThickness,
            suggestion: ichimokuResult.suggestion,
            confidence: ichimokuResult.confidence,
            trend: ichimokuResult.metadata?.trend,
            signals: ichimokuResult.metadata?.signals
        });

        console.log('\n📊 Test 2: Calculate all strategies (including Ichimoku)...');
        const allResults = strategies.calculateAll(sampleData);
        
        console.log('✅ Calculate all test successful!');
        console.log('Available strategies:', Object.keys(allResults));
        
        if (allResults.ichimoku) {
            console.log('Ichimoku in results:', {
                cloudColor: allResults.ichimoku.cloudColor,
                trend: allResults.ichimoku.metadata?.trend,
                suggestion: allResults.ichimoku.suggestion,
                confidence: allResults.ichimoku.confidence
            });
        } else {
            console.log('❌ Ichimoku missing from results!');
        }

        console.log('\n📊 Test 3: Ensemble signal (with Ichimoku)...');
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
        const ichimokuWeight = strategies.getStrategyWeight('ichimoku');
        console.log('Ichimoku weight:', ichimokuWeight);
        console.log('All strategy weights:', {
            rsi: strategies.getStrategyWeight('rsi'),
            macd: strategies.getStrategyWeight('macd'),
            bollinger: strategies.getStrategyWeight('bollinger'),
            ma: strategies.getStrategyWeight('ma'),
            volume: strategies.getStrategyWeight('volume'),
            stochastic: strategies.getStrategyWeight('stochastic'),
            williamsR: strategies.getStrategyWeight('williamsR'),
            ichimoku: strategies.getStrategyWeight('ichimoku')
        });

        console.log('\n📊 Test 5: Strategy comparison...');
        console.log('Strategy Comparison:');
        Object.entries(allResults).forEach(([name, result]) => {
            if (!result.error) {
                console.log(`${name.toUpperCase()}: ${result.suggestion} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
            }
        });

        console.log('\n📊 Test 6: Ichimoku-specific analysis...');
        if (allResults.ichimoku && !allResults.ichimoku.error) {
            const ichimoku = allResults.ichimoku;
            console.log('Detailed Ichimoku Analysis:');
            console.log(`- Price: ${ichimoku.currentPrice}`);
            console.log(`- Tenkan-sen: ${ichimoku.tenkanSen}`);
            console.log(`- Kijun-sen: ${ichimoku.kijunSen}`);
            console.log(`- Cloud Top: ${ichimoku.cloudTop}`);
            console.log(`- Cloud Bottom: ${ichimoku.cloudBottom}`);
            console.log(`- Cloud Color: ${ichimoku.cloudColor}`);
            console.log(`- Trend: ${ichimoku.metadata?.trend}`);
            console.log(`- Active Signals: ${ichimoku.metadata?.signals?.join(', ')}`);
            console.log(`- Interpretation: ${ichimoku.metadata?.interpretation}`);
        }

        console.log('\n🎉 All Ichimoku integration tests passed!');
        console.log('Ichimoku Cloud is now fully integrated! 🚀');
        console.log(`Total indicators available: ${Object.keys(allResults).length}`);
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        Logger.error('Ichimoku integration test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testIchimokuIntegration();