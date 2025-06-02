require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function diagnoseStorage() {
    console.log('🔍 Diagnosing Storage Issues...');
    
    const dataDir = path.join(process.cwd(), 'data', 'pairs');
    
    try {
        console.log('\n📊 Step 1: Check data directory...');
        const files = await fs.readdir(dataDir);
        console.log(`Found ${files.length} files in data directory`);
        
        for (const file of files) {
            if (!file.endsWith('_history.json')) continue;
            
            const filePath = path.join(dataDir, file);
            const pair = file.replace('_history.json', '').toUpperCase();
            
            console.log(`\n🔍 Analyzing ${pair} (${file})...`);
            
            try {
                const stats = await fs.stat(filePath);
                console.log(`  📏 File size: ${stats.size} bytes`);
                console.log(`  📅 Modified: ${stats.mtime.toISOString()}`);
                
                if (stats.size === 0) {
                    console.log(`  ❌ File is empty - WILL DELETE`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                if (stats.size < 50) {
                    console.log(`  ⚠️  File very small (${stats.size} bytes) - checking content`);
                }
                
                const content = await fs.readFile(filePath, 'utf8');
                
                if (!content.trim()) {
                    console.log(`  ❌ File has no content - WILL DELETE`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                console.log(`  📄 Content preview: ${content.substring(0, 100)}...`);
                
                // Try to parse JSON
                let data;
                try {
                    data = JSON.parse(content);
                    console.log(`  ✅ JSON parse successful`);
                } catch (parseError) {
                    console.log(`  ❌ JSON parse error: ${parseError.message}`);
                    console.log(`  🗑️  WILL DELETE corrupted file`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                // Validate structure
                if (!data.history || !data.history.closes) {
                    console.log(`  ❌ Invalid structure - missing history.closes`);
                    console.log(`  🗑️  WILL DELETE invalid file`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                const dataPoints = data.history.closes.length;
                console.log(`  📊 Data points: ${dataPoints}`);
                
                if (dataPoints === 0) {
                    console.log(`  ❌ No data points - WILL DELETE`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                // Check data quality
                const samplePrice = data.history.closes[0];
                if (typeof samplePrice !== 'number' || !isFinite(samplePrice) || samplePrice <= 0) {
                    console.log(`  ❌ Invalid price data: ${samplePrice} - WILL DELETE`);
                    await fs.unlink(filePath);
                    continue;
                }
                
                console.log(`  ✅ File is valid - ${dataPoints} data points`);
                
            } catch (fileError) {
                console.log(`  ❌ Error reading file: ${fileError.message}`);
                console.log(`  🗑️  WILL DELETE unreadable file`);
                try {
                    await fs.unlink(filePath);
                } catch (deleteError) {
                    console.log(`  ❌ Failed to delete: ${deleteError.message}`);
                }
            }
        }
        
        console.log('\n📊 Step 2: Test DataStorage class...');
        const { DataStorage } = require('../src/utils');
        const dataStorage = new DataStorage();
        
        const stats = await dataStorage.getStorageStats();
        console.log('Storage stats after cleanup:', {
            totalPairs: stats.totalPairs,
            totalSizeKB: Math.round(stats.totalSizeBytes / 1024),
            pairs: stats.pairs.map(p => `${p.pair}: ${p.dataPoints} points`)
        });
        
        console.log('\n🎉 Storage diagnostics completed!');
        console.log('💡 Corrupted files have been automatically deleted');
        console.log('🔄 Restart the server to rebuild missing data from API');
        
    } catch (error) {
        console.error('\n❌ Diagnostics failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the diagnostics
diagnoseStorage();