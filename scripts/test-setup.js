require('dotenv').config();
const { Logger } = require('../src/utils');
const { DataValidator } = require('../src/data/validators');

console.log('🚀 Testing basic setup...');

// Test Logger
Logger.info('Logger is working!');
Logger.warn('This is a warning');
Logger.error('This is an error test');

// Test DataValidator
const testData = {
    close: 100.5,
    high: 101.0,
    low: 99.5,
    volume: 1000,
    timestamp: Date.now()
};

const isValid = DataValidator.isValidPriceData(testData);
console.log('✅ DataValidator test:', isValid ? 'PASSED' : 'FAILED');

const testArray = [1, 2, 3, 4, 5];
const isValidArray = DataValidator.validateArray(testArray);
console.log('✅ Array validation test:', isValidArray ? 'PASSED' : 'FAILED');

console.log('🎉 Basic setup complete! Check the logs/ folder for log files.');
console.log('Environment:', process.env.NODE_ENV);
console.log('API Key set:', process.env.X_API ? 'YES' : 'NO');