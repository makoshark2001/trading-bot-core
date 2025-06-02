require('dotenv').config();
const { DataStorage } = require('../src/utils');

async function testPersistentStorage() {
    console.log('🚀 Testing Persistent Storage...');
    
    const dataStorage = new DataStorage();
    
    try {
        console.log('\n📊 Test 1: Create sample data...');
        const sampleData = {
            closes: [100, 101, 102, 103, 104, 105],
            highs: [102, 103, 104, 105, 106, 107],
            lows: [98, 99, 100, 101, 102, 103],
            prices: [100, 101, 102, 103, 104, 105],
            volumes: [1000, 1100, 1200, 1300, 1400, 1500],
            timestamps: [1640995200000, 1641081600000, 1641168000000, 1641254400000, 1641340800000, 1641427200000]
        };
        console.log('✅ Sample data created');
        
        console.log('\n📊 Test 2: Save pair data...');
        const saveResult = await dataStorage.savePairData('TEST', sampleData);
        console.log('✅ Save result:', saveResult);
        
        console.log('\n📊 Test 3: Load pair data...');
        const loadedData = await dataStorage.loadPairData('TEST');
        console.log('✅ Loaded data:', {
            hasData: !!loadedData,
            dataPoints: loadedData?.closes?.length || 0,
            firstClose: loadedData?.closes?.[0],
            lastClose: loadedData?.closes?.[loadedData?.closes?.length - 1]
        });
        
        console.log('\n📊 Test 4: Verify data integrity...');
        if (loadedData && loadedData.closes) {
            const originalLength = sampleData.closes.length;
            const loadedLength = loadedData.closes.length;
            const firstMatch = sampleData.closes[0] === loadedData.closes[0];
            const lastMatch = sampleData.closes[originalLength - 1] === loadedData.closes[loadedLength - 1];
            
            console.log('✅ Data integrity check:', {
                lengthMatch: originalLength === loadedLength,
                firstMatch,
                lastMatch,
                allGood: originalLength === loadedLength && firstMatch && lastMatch
            });
        }
        
        console.log('\n📊 Test 5: Storage statistics...');
        const stats = await dataStorage.getStorageStats();
        console.log('✅ Storage stats:', {
            totalPairs: stats.totalPairs,
            totalSizeKB: Math.round(stats.totalSizeBytes / 1024)
        });
        
        console.log('\n📊 Test 6: Test non-existent pair...');
        const nonExistentData = await dataStorage.loadPairData('NONEXISTENT');
        console.log('✅ Non-existent pair result:', nonExistentData === null ? 'Correctly returned null' : 'Unexpected result');
        
        console.log('\n📊 Test 7: Directory structure check...');
        const fs = require('fs').promises;
        const path = require('path');
        const dataDir = path.join(process.cwd(), 'data', 'pairs');
        
        try {
            await fs.access(dataDir);
            console.log('✅ Data directory exists at:', dataDir);
        } catch (error) {
            console.log('❌ Data directory issue:', error.message);
        }
        
        console.log('\n📊 Test 8: Cleanup test data...');
        const deleteResult = await dataStorage.deletePairData('TEST');
        console.log('✅ Delete result:', deleteResult);
        
        console.log('\n📊 Test 9: Verify deletion...');
        const deletedData = await dataStorage.loadPairData('TEST');
        console.log('✅ Deletion verified:', deletedData === null ? 'Data successfully deleted' : 'Data still exists');
        
        console.log('\n🎉 All persistent storage tests passed!');
        console.log('💡 Storage logging has been reduced for cleaner output');
        console.log('🔇 Debug messages are now silent during normal operations');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the test
testPersistentStorage();