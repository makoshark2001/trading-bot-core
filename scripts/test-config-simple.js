require('dotenv').config();

async function testConfigManager() {
    console.log('🧪 Testing ConfigManager in isolation...');
    
    try {
        // Test the Logger first
        console.log('Testing Logger...');
        const { Logger } = require('../src/utils');
        Logger.info('Logger test successful');
        console.log('✅ Logger works');
        
        // Test ConfigManager
        console.log('Testing ConfigManager...');
        const { ConfigManager } = require('../src/utils');
        console.log('✅ ConfigManager imported successfully');
        
        const configManager = new ConfigManager();
        console.log('✅ ConfigManager created successfully');
        
        console.log('Testing getCurrentPairs...');
        const pairs = await configManager.getCurrentPairs();
        console.log('✅ getCurrentPairs successful:', pairs);
        
        console.log('🎉 ConfigManager test completed successfully!');
        
    } catch (error) {
        console.error('❌ ConfigManager test failed:');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConfigManager();