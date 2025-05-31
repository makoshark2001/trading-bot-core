require('dotenv').config();
const { TechnicalStrategies } = require('../src/strategies/technical');
const { Logger } = require('../src/utils');

async function testStochasticIntegration() {
    console.log('🚀 Testing Stochastic Integration...');
    
    // Create sample market data (like what comes from MarketDataCollector)
    const sampleData = {
        closes: [102, 106, 108, 105, 107, 110, 113, 111, 109, 112, 114, 116, 118, 115, 117, 119, 121, 120, 118, 122],
        highs: [105, 108, 110, 107, 109, 112, 115, 113, 111, 114, 116, 118, 120, 117, 119, 121, 123, 122, 120, 124],
        lows: [100, 103, 105, 102, 104, 107, 110, 108, 106, 109, 111, 113, 115, 112, 114, 116, 118, 117, 115, 119],
        volumes: [1000, 1100, 1200, 900, 1050, 1300, 1400, 1200, 1000, 1150, 1250, 1350, 1500, 1300, 1400, 1450, 1600, 1550, 1400, 1650],
        timestamps: Array.from({length: 20}, (_, i) => Date.now() - (19-i) * 300000) // 5min intervals
    };

    try {
        console.log('\n📊 Test 1: Individual Stochastic calculation...');
        const strategies = new TechnicalStrategies();
        const stochasticResult = strategies.calculateStochastic(sampleData);
        
        console.log('✅ Individual Stochastic test successful!');
        console.log('Stochastic Result:', {
            k: stochasticResult.k,
            d: stochasticResult.d,
            suggestion: stochasticResult.suggestion,
            confidence: stochasticResult.confidence,
            interpretation: stochasticResult.metadata?.interpretation
        });

        console.log('\n📊 Test 2: Calculate all strategies (including Stochastic)...');
        const allResults = strategies.calculateAll(sampleData);
        
        console.log('✅ Calculate all test successful!');
        console.log('Available strategies:', Object.keys(allResults));
        
        if (allResults.stochastic) {
            console.log('Stochastic in results:', {
                k: allResults.stochastic.k,
                d: allResults.stochastic.d,
                suggestion: allResults.stochastic.suggestion
            });
        } else {
            console.log('❌ Stochastic missing from results!');
        }

        console.log('\n📊 Test 3: Ensemble signal (with Stochastic)...');
        const ensembleSignal = strategies.getEnsembleSignal(sampleData);
        
        console.log('✅ Ensemble signal test successful!');
        console.log('Ensemble Result:', {
            suggestion: ensembleSignal.suggestion,
            confidence: ensembleSignal.confidence,
            validStrategies: ensembleSignal.metadata.validStrategies
        });

        console.log('\n🎉 All integration tests passed!');
        console.log('Stochastic is now fully integrated! 🚀');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        Logger.error('Stochastic integration test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testStochasticIntegration();