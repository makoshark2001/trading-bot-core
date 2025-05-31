const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class Volume {
    constructor(period = 20) {
        this.period = period;
        this.name = 'Volume';
    }
    
    calculate(prices, volumes) {
        try {
            // Validate input
            if (!DataValidator.validatePriceArray(prices, this.period) || 
                !DataValidator.validateArray(volumes, this.period)) {
                throw new Error(`Volume validation failed: need at least ${this.period} valid price and volume values`);
            }
            
            if (prices.length !== volumes.length) {
                throw new Error('Prices and volumes arrays must have the same length');
            }
            
            // Calculate volume metrics
            const recentVolumes = volumes.slice(-this.period);
            const recentPrices = prices.slice(-this.period);
            
            // Average volume
            const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / this.period;
            const currentVolume = volumes[volumes.length - 1];
            const currentPrice = prices[prices.length - 1];
            const prevPrice = prices[prices.length - 2] || currentPrice;
            
            // Volume ratio (current vs average)
            const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
            
            // Price change
            const priceChange = currentPrice - prevPrice;
            const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
            
            // Volume trend (increasing/decreasing)
            const volumeTrend = this.calculateVolumeTrend(recentVolumes);
            
            // On-Balance Volume (OBV)
            const obv = this.calculateOBV(prices, volumes);
            
            // Volume-Price Trend (VPT)
            const vpt = this.calculateVPT(prices, volumes);
            
            // Generate trading signal
            const signal = this.generateSignal(
                currentVolume, avgVolume, volumeRatio,
                priceChange, priceChangePercent, volumeTrend, obv, vpt
            );
            
            Logger.debug('Volume calculated', {
                currentVolume: currentVolume.toFixed(0),
                avgVolume: avgVolume.toFixed(0),
                volumeRatio: volumeRatio.toFixed(2),
                suggestion: signal.suggestion
            });
            
            return {
                currentVolume: Number(currentVolume.toFixed(0)),
                avgVolume: Number(avgVolume.toFixed(0)),
                volumeRatio: Number(volumeRatio.toFixed(2)),
                priceChange: Number(priceChange.toFixed(6)),
                priceChangePercent: Number(priceChangePercent.toFixed(2)),
                volumeTrend: volumeTrend,
                obv: Number(obv.toFixed(0)),
                vpt: Number(vpt.toFixed(6)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    period: this.period,
                    interpretation: signal.interpretation,
                    volumeSpike: signal.volumeSpike,
                    confirmationStrength: signal.confirmationStrength
                }
            };
            
        } catch (error) {
            Logger.error('Volume calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateVolumeTrend(volumes) {
        if (volumes.length < 3) return 'neutral';
        
        const recent3 = volumes.slice(-3);
        const avg1 = recent3[0];
        const avg2 = recent3[1];
        const avg3 = recent3[2];
        
        if (avg3 > avg2 && avg2 > avg1) return 'increasing';
        if (avg3 < avg2 && avg2 < avg1) return 'decreasing';
        return 'neutral';
    }
    
    calculateOBV(prices, volumes) {
        let obv = 0;
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                obv += volumes[i];
            } else if (prices[i] < prices[i - 1]) {
                obv -= volumes[i];
            }
            // If price unchanged, OBV unchanged
        }
        
        return obv;
    }
    
    calculateVPT(prices, volumes) {
        let vpt = 0;
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i - 1] > 0) {
                const priceChangePercent = (prices[i] - prices[i - 1]) / prices[i - 1];
                vpt += volumes[i] * priceChangePercent;
            }
        }
        
        return vpt;
    }
    
    generateSignal(currentVolume, avgVolume, volumeRatio, priceChange, priceChangePercent, volumeTrend, obv, vpt) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let volumeSpike = false;
        let confirmationStrength = "weak";
        
        // Volume spike detection (significantly higher than average)
        if (volumeRatio > 2.0) {
            volumeSpike = true;
            confirmationStrength = "very_strong";
        } else if (volumeRatio > 1.5) {
            volumeSpike = true;
            confirmationStrength = "strong";
        } else if (volumeRatio > 1.2) {
            confirmationStrength = "moderate";
        }
        
        // Generate signals based on volume + price action
        if (volumeSpike && Math.abs(priceChangePercent) > 1) {
            // High volume + significant price movement
            if (priceChange > 0) {
                suggestion = "buy";
                confidence = Math.min(1, volumeRatio * Math.abs(priceChangePercent) / 10);
                strength = confidence;
                interpretation = `Volume spike (${volumeRatio.toFixed(1)}x avg) confirms ${priceChangePercent.toFixed(2)}% price rise - strong bullish signal`;
            } else {
                suggestion = "sell";
                confidence = Math.min(1, volumeRatio * Math.abs(priceChangePercent) / 10);
                strength = confidence;
                interpretation = `Volume spike (${volumeRatio.toFixed(1)}x avg) confirms ${priceChangePercent.toFixed(2)}% price drop - strong bearish signal`;
            }
        }
        // High volume but small price movement (accumulation/distribution)
        else if (volumeRatio > 1.5 && Math.abs(priceChangePercent) < 0.5) {
            if (obv > 0 && vpt > 0) {
                suggestion = "buy";
                confidence = Math.min(0.6, volumeRatio / 3);
                strength = confidence * 0.8;
                interpretation = `High volume with stable price + positive OBV suggests accumulation`;
            } else if (obv < 0 && vpt < 0) {
                suggestion = "sell";
                confidence = Math.min(0.6, volumeRatio / 3);
                strength = confidence * 0.8;
                interpretation = `High volume with stable price + negative OBV suggests distribution`;
            } else {
                suggestion = "hold";
                confidence = 0.3;
                strength = 0.2;
                interpretation = `High volume but mixed signals - wait for price direction`;
            }
        }
        // Volume trend analysis
        else if (volumeTrend === 'increasing' && priceChange > 0) {
            suggestion = "buy";
            confidence = Math.min(0.5, volumeRatio / 2);
            strength = confidence * 0.7;
            interpretation = `Increasing volume trend supports price rise`;
        }
        else if (volumeTrend === 'increasing' && priceChange < 0) {
            suggestion = "sell";
            confidence = Math.min(0.5, volumeRatio / 2);
            strength = confidence * 0.7;
            interpretation = `Increasing volume trend supports price decline`;
        }
        // Low volume signals (weak moves)
        else if (volumeRatio < 0.5 && Math.abs(priceChangePercent) > 1) {
            suggestion = "hold";
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Price move on low volume (${volumeRatio.toFixed(1)}x avg) - weak signal, likely reversal`;
        }
        // Normal volume, small price movement
        else {
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = `Normal volume (${volumeRatio.toFixed(1)}x avg), minimal price action - no clear signal`;
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            volumeSpike,
            confirmationStrength
        };
    }
    
    // Calculate volume profile for price levels (simplified version)
    calculateVolumeProfile(prices, volumes, levels = 10) {
        if (prices.length !== volumes.length || prices.length < levels) {
            return [];
        }
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceStep = (maxPrice - minPrice) / levels;
        
        const profile = [];
        
        for (let i = 0; i < levels; i++) {
            const levelMin = minPrice + (i * priceStep);
            const levelMax = minPrice + ((i + 1) * priceStep);
            let levelVolume = 0;
            
            for (let j = 0; j < prices.length; j++) {
                if (prices[j] >= levelMin && prices[j] < levelMax) {
                    levelVolume += volumes[j];
                }
            }
            
            profile.push({
                priceLevel: Number((levelMin + levelMax) / 2).toFixed(6),
                volume: levelVolume,
                percentage: 0 // Will be calculated after all levels
            });
        }
        
        // Calculate percentages
        const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0);
        profile.forEach(level => {
            level.percentage = totalVolume > 0 ? (level.volume / totalVolume * 100) : 0;
        });
        
        return profile.sort((a, b) => b.volume - a.volume); // Sort by volume descending
    }
    
    // Helper method to detect volume breakouts
    static detectVolumeBreakout(currentVolume, recentVolumes, threshold = 2.0) {
        const avgRecent = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
        return currentVolume > (avgRecent * threshold);
    }
    
    // Helper method to interpret volume strength
    static interpretVolumeStrength(volumeRatio) {
        if (volumeRatio > 3) return "Extremely High";
        if (volumeRatio > 2) return "Very High";
        if (volumeRatio > 1.5) return "High";
        if (volumeRatio > 1.2) return "Above Average";
        if (volumeRatio > 0.8) return "Average";
        if (volumeRatio > 0.5) return "Below Average";
        return "Very Low";
    }
}

module.exports = Volume;