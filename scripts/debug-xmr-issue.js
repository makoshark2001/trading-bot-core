require('dotenv').config();
const { DataStorage } = require('../src/utils');
const fs = require('fs').promises;
const path = require('path');

async function debugXMRIssue() {
    console.log('🔍 Debugging XMR Storage Issue...');
    
    const dataStorage = new DataStorage();
    
    try {
        console.log('\n📊 Step 1: Check XMR file status...');
        const xmrFilePath = path.join(process.cwd(), 'data', 'pairs', 'xmr_history.json');
        
        try {
            const stats = await fs.stat(xmrFilePath);
            console.log('XMR file exists:', {
                size: stats.size + ' bytes',
                modified: stats.mtime.toISOString()
            });
            
            if (stats.size > 0) {
                const content = await fs.readFile(xmrFilePath, 'utf8');
                console.log('File content preview:', content.substring(0, 200) + '...');
                
                try {
                    const data = JSON.parse(content);
                    console.log('XMR data structure:', {
                        hasPair: !!data.pair,
                        hasHistory: !!data.history,
                        hasCloses: !!(data.history && data.history.closes),
                        dataPoints: data.history && data.history.closes ? data.history.closes.length : 0,
                        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated).toISOString() : 'N/A'
                    });
                } catch (parseError) {
                    console.log('❌ JSON parse error:', parseError.message);
                }
            } else {
                console.log('❌ XMR file is empty');
            }
        } catch (fileError) {
            console.log('❌ XMR file does not exist or cannot be read:', fileError.message);
        }
        
        console.log('\n📊 Step 2: Test XMR data loading...');
        const loadedData = await dataStorage.loadPairData('XMR');
        console.log('Loaded XMR data:', {
            success: !!loadedData,
            dataPoints: loadedData && loadedData.closes ? loadedData.closes.length : 0
        });
        
        console.log('\n📊 Step 3: Create test XMR data and save...');
        const testData = {
            closes: [150.5, 151.2, 152.0, 151.8, 152.5],
            highs: [151.0, 152.0, 152.5, 152.2, 153.0],
            lows: [150.0, 150.8, 151.5, 151.5, 152.0],
            volumes: [1000, 1100, 1200, 1150, 1300],
            timestamps: [Date.now() - 240000, Date.now() - 180000, Date.now() - 120000, Date.now() - 60000, Date.now()]
        };
        
        console.log('Test data created:', {
            dataPoints: testData.closes.length,
            samplePrices: testData.closes
        });
        
        const saveResult = await dataStorage.savePairData('XMR', testData);
        console.log('Save result:', saveResult);
        
        if (saveResult) {
            console.log('\n📊 Step 4: Verify saved data...');
            const verifyData = await dataStorage.loadPairData('XMR');
            console.log('Verification:', {
                loaded: !!verifyData,
                dataPoints: verifyData && verifyData.closes ? verifyData.closes.length : 0,
                matchesTest: verifyData && verifyData.closes && verifyData.closes.length === testData.closes.length
            });
        }
        
        console.log('\n📊 Step 5: Check all storage stats...');
        const stats = await dataStorage.getStorageStats();
        console.log('Storage stats:', {
            totalPairs: stats.totalPairs,
            pairs: stats.pairs.map(p => `${p.pair}: ${p.dataPoints} points, ${Math.round(p.sizeBytes/1024)}KB`)
        });
        
        console.log('\n🎉 XMR debug completed!');
        
    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the debug
debugXMRIssue();