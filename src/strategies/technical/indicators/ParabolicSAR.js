const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class ParabolicSAR {
    constructor(initialAF = 0.02, maxAF = 0.2, afIncrement = 0.02) {
        this.initialAF = initialAF;     // Initial acceleration factor
        this.maxAF = maxAF;             // Maximum acceleration factor
        this.afIncrement = afIncrement; // AF increment step
        this.name = 'ParabolicSAR';
        this.minDataPoints = 3; // Need at least 3 points to establish initial trend
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input
            if (!DataValidator.validateArray(highs, this.minDataPoints) || 
                !DataValidator.validateArray(lows, this.minDataPoints) ||
                !DataValidator.validateArray(closes, this.minDataPoints)) {
                throw new Error(`Parabolic SAR validation failed: need at least ${this.minDataPoints} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            // Calculate full SAR series
            const sarSeries = this.calculateSARSeries(highs, lows, closes);
            
            if (sarSeries.length === 0) {
                throw new Error('Failed to calculate Parabolic SAR series');
            }
            
            // Get current values
            const currentSAR = sarSeries[sarSeries.length - 1];
            const currentPrice = closes[closes.length - 1];
            const currentHigh = highs[highs.length - 1];
            const currentLow = lows[lows.length - 1];
            
            // Determine trend and generate signal
            const signal = this.generateSignal(currentSAR, currentPrice, currentHigh, currentLow, sarSeries, closes);
            
            Logger.debug('Parabolic SAR calculated', {
                sar: currentSAR.sar.toFixed(6),
                trend: currentSAR.trend,
                af: currentSAR.af.toFixed(3),
                suggestion: signal.suggestion
            });
            
            return {
                sar: Number(currentSAR.sar.toFixed(6)),
                trend: currentSAR.trend,
                af: Number(currentSAR.af.toFixed(3)),
                ep: Number(currentSAR.ep.toFixed(6)),
                currentPrice: Number(currentPrice.toFixed(6)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    initialAF: this.initialAF,
                    maxAF: this.maxAF,
                    afIncrement: this.afIncrement,
                    interpretation: signal.interpretation,
                    reversal: signal.reversal,
                    trendStrength: signal.trendStrength
                }
            };
            
        } catch (error) {
            Logger.error('Parabolic SAR calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateSARSeries(highs, lows, closes) {
        const sarSeries = [];
        
        if (highs.length < 2) {
            return sarSeries;
        }
        
        // Initialize first SAR point
        let trend = this.determineInitialTrend(highs, lows, closes);
        let af = this.initialAF;
        let ep = trend === 'uptrend' ? highs[0] : lows[0]; // Extreme Point
        let sar = trend === 'uptrend' ? lows[0] : highs[0]; // Initial SAR
        
        // First point
        sarSeries.push({
            sar: sar,
            trend: trend,
            af: af,
            ep: ep
        });
        
        // Calculate subsequent SAR points
        for (let i = 1; i < highs.length; i++) {
            const currentHigh = highs[i];
            const currentLow = lows[i];
            const prevHigh = highs[i - 1];
            const prevLow = lows[i - 1];
            
            // Calculate next SAR
            let nextSAR = sar + af * (ep - sar);
            
            if (trend === 'uptrend') {
                // Uptrend SAR rules
                
                // SAR should not be above the low of current or previous period
                nextSAR = Math.min(nextSAR, currentLow, prevLow);
                
                // Check for trend reversal
                if (currentLow <= nextSAR) {
                    // Trend reversal to downtrend
                    trend = 'downtrend';
                    nextSAR = ep; // SAR becomes the previous EP
                    ep = currentLow; // New EP is current low
                    af = this.initialAF; // Reset AF
                } else {
                    // Continue uptrend
                    if (currentHigh > ep) {
                        ep = currentHigh; // Update EP to new high
                        af = Math.min(af + this.afIncrement, this.maxAF); // Increase AF
                    }
                }
            } else {
                // Downtrend SAR rules
                
                // SAR should not be below the high of current or previous period
                nextSAR = Math.max(nextSAR, currentHigh, prevHigh);
                
                // Check for trend reversal
                if (currentHigh >= nextSAR) {
                    // Trend reversal to uptrend
                    trend = 'uptrend';
                    nextSAR = ep; // SAR becomes the previous EP
                    ep = currentHigh; // New EP is current high
                    af = this.initialAF; // Reset AF
                } else {
                    // Continue downtrend
                    if (currentLow < ep) {
                        ep = currentLow; // Update EP to new low
                        af = Math.min(af + this.afIncrement, this.maxAF); // Increase AF
                    }
                }
            }
            
            sar = nextSAR;
            
            sarSeries.push({
                sar: sar,
                trend: trend,
                af: af,
                ep: ep
            });
        }
        
        return sarSeries;
    }
    
    determineInitialTrend(highs, lows, closes) {
        // Simple initial trend determination
        if (highs.length < 2) return 'uptrend';
        
        // Compare first two periods
        if (closes[1] > closes[0] && highs[1] > highs[0]) {
            return 'uptrend';
        } else if (closes[1] < closes[0] && lows[1] < lows[0]) {
            return 'downtrend';
        }
        
        // Default to uptrend if unclear
        return 'uptrend';
    }
    
    generateSignal(currentSAR, currentPrice, currentHigh, currentLow, sarSeries, closes) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let reversal = false;
        let trendStrength = "";
        
        const trend = currentSAR.trend;
        const af = currentSAR.af;
        
        // Check for recent trend reversal
        if (sarSeries.length >= 2) {
            const prevTrend = sarSeries[sarSeries.length - 2].trend;
            reversal = trend !== prevTrend;
        }
        
        // Determine trend strength based on AF
        if (af >= this.maxAF * 0.8) {
            trendStrength = "Very Strong";
        } else if (af >= this.maxAF * 0.6) {
            trendStrength = "Strong";
        } else if (af >= this.maxAF * 0.4) {
            trendStrength = "Moderate";
        } else {
            trendStrength = "Weak";
        }
        
        // Calculate distance from SAR as percentage
        const sarDistance = Math.abs(currentPrice - currentSAR.sar) / currentPrice;
        
        if (trend === 'uptrend') {
            if (reversal) {
                // New uptrend signal
                suggestion = "buy";
                confidence = 0.7;
                strength = 0.6;
                interpretation = `New uptrend detected - price broke above SAR (${currentSAR.sar.toFixed(6)}). Strong buy signal.`;
            } else if (currentPrice > currentSAR.sar) {
                // Continuing uptrend
                suggestion = "buy";
                confidence = Math.min(0.6, 0.2 + sarDistance * 10 + (af / this.maxAF) * 0.3);
                strength = confidence * 0.8;
                interpretation = `Uptrend continues - price (${currentPrice.toFixed(6)}) above SAR (${currentSAR.sar.toFixed(6)}). Trend strength: ${trendStrength}.`;
            } else {
                // Price approaching SAR - caution
                suggestion = "hold";
                confidence = 0.2;
                strength = 0.1;
                interpretation = `Uptrend weakening - price approaching SAR. Watch for potential reversal.`;
            }
        } else {
            // Downtrend
            if (reversal) {
                // New downtrend signal
                suggestion = "sell";
                confidence = 0.7;
                strength = 0.6;
                interpretation = `New downtrend detected - price broke below SAR (${currentSAR.sar.toFixed(6)}). Strong sell signal.`;
            } else if (currentPrice < currentSAR.sar) {
                // Continuing downtrend
                suggestion = "sell";
                confidence = Math.min(0.6, 0.2 + sarDistance * 10 + (af / this.maxAF) * 0.3);
                strength = confidence * 0.8;
                interpretation = `Downtrend continues - price (${currentPrice.toFixed(6)}) below SAR (${currentSAR.sar.toFixed(6)}). Trend strength: ${trendStrength}.`;
            } else {
                // Price approaching SAR - caution
                suggestion = "hold";
                confidence = 0.2;
                strength = 0.1;
                interpretation = `Downtrend weakening - price approaching SAR. Watch for potential reversal.`;
            }
        }
        
        // Boost confidence for reversals
        if (reversal) {
            confidence *= 1.2;
            interpretation += " Trend reversal signals are typically strong entry points.";
        }
        
        // Reduce confidence for very close SAR (choppy market)
        if (sarDistance < 0.01) { // Less than 1% distance
            confidence *= 0.7;
            interpretation += " Price very close to SAR - potentially choppy market.";
        }
        
        // Cap confidence
        confidence = Math.min(confidence, 1.0);
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation: interpretation.trim(),
            reversal,
            trendStrength
        };
    }
    
    // Calculate SAR history for charting
    calculateHistory(highs, lows, closes, outputLength = 50) {
        if (highs.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for Parabolic SAR history. Need ${this.minDataPoints + outputLength}, have ${highs.length}`);
        }
        
        const sarHistory = [];
        
        for (let i = this.minDataPoints; i <= Math.min(highs.length, this.minDataPoints + outputLength); i++) {
            const highsSlice = highs.slice(0, i);
            const lowsSlice = lows.slice(0, i);
            const closesSlice = closes.slice(0, i);
            
            try {
                const result = this.calculate(highsSlice, lowsSlice, closesSlice);
                sarHistory.push({
                    sar: result.sar,
                    trend: result.trend,
                    af: result.af,
                    price: result.currentPrice,
                    timestamp: Date.now() - ((this.minDataPoints + outputLength - i) * 300000)
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return sarHistory;
    }
    
    // Helper method to detect trend reversals in series
    static detectReversals(sarHistory) {
        const reversals = [];
        
        for (let i = 1; i < sarHistory.length; i++) {
            if (sarHistory[i].trend !== sarHistory[i - 1].trend) {
                reversals.push({
                    index: i,
                    from: sarHistory[i - 1].trend,
                    to: sarHistory[i].trend,
                    price: sarHistory[i].price,
                    sar: sarHistory[i].sar,
                    timestamp: sarHistory[i].timestamp
                });
            }
        }
        
        return reversals;
    }
    
    // Helper method to interpret trend strength
    static interpretTrendStrength(af, maxAF) {
        const ratio = af / maxAF;
        if (ratio >= 0.8) return "Very Strong";
        if (ratio >= 0.6) return "Strong";
        if (ratio >= 0.4) return "Moderate";
        if (ratio >= 0.2) return "Weak";
        return "Very Weak";
    }
}

module.exports = ParabolicSAR;