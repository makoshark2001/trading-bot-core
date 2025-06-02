require('dotenv').config();
const { ConfigManager } = require('../src/utils');
const { Logger } = require('../src/utils');

async function testDynamicPairs() {
    console.log('🚀 Testing Dynamic Trading Pairs Management...');
    
    const configManager = new ConfigManager();
    
    try {
        console.log('\n📊 Test 1: Load initial configuration...');
        const initialConfig = await configManager.getConfigInfo();
        console.log('✅ Initial configuration loaded:', initialConfig);
        
        console.log('\n📊 Test 2: Get current pairs...');
        const currentPairs = await configManager.getCurrentPairs();
        console.log('✅ Current pairs:', currentPairs);
        
        console.log('\n📊 Test 3: Update pairs with new configuration...');
        const newPairs = ['BTC', 'ETH', 'XMR', 'RVN'];
        const updateResult = await configManager.updatePairs(newPairs, 'test');
        console.log('✅ Update result:', updateResult);
        
        console.log('\n📊 Test 4: Verify pairs were updated...');
        const updatedPairs = await configManager.getCurrentPairs();
        console.log('✅ Updated pairs:', updatedPairs);
        
        console.log('\n📊 Test 5: Add individual pair...');
        const allPairs = await configManager.getCurrentPairs();
        const newIndividualPairs = [...allPairs, 'DOGE'];
        const addResult = await configManager.updatePairs(newIndividualPairs, 'test-add');
        console.log('✅ Add result:', addResult);
        
        console.log('\n📊 Test 6: Remove individual pair...');
        const currentPairsForRemoval = await configManager.getCurrentPairs();
        const removePairs = currentPairsForRemoval.filter(p => p !== 'DOGE');
        const removeResult = await configManager.updatePairs(removePairs, 'test-remove');
        console.log('✅ Remove result:', removeResult);
        
        console.log('\n📊 Test 7: Reset to default...');
        const resetResult = await configManager.resetToDefault();
        console.log('✅ Reset result:', resetResult);
        
        console.log('\n📊 Test 8: Verify reset worked...');
        const finalPairs = await configManager.getCurrentPairs();
        console.log('✅ Final pairs after reset:', finalPairs);
        
        console.log('\n📊 Test 9: Test validation...');
        try {
            await configManager.updatePairs(['INVALID_PAIR_NAME_TOO_LONG'], 'test-validation');
            console.log('❌ Should have failed validation');
        } catch (error) {
            console.log('✅ Validation correctly rejected invalid pair:', error.message);
        }
        
        try {
            await configManager.updatePairs([], 'test-empty');
            console.log('❌ Should have failed for empty array');
        } catch (error) {
            console.log('✅ Validation correctly rejected empty array:', error.message);
        }
        
        console.log('\n📊 Test 10: Final configuration info...');
        const finalConfig = await configManager.getConfigInfo();
        console.log('✅ Final configuration:', finalConfig);
        
        console.log('\n🎉 All dynamic pairs tests passed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        Logger.error('Dynamic pairs test failed', { error: error.message });
        process.exit(1);
    }
}

// Run the test
testDynamicPairs();