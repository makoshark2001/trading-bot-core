const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class Stochastic {
    constructor(kPeriod = 14, dPeriod = 3) {
        this.kPeriod = kPeriod;
        this.dPeriod = dPeriod;
        this.name = 'Stochastic';
        this.minDataPoints = this.kPeriod + this.dPeriod - 1; // Need enough for both %K and %D
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input arrays exist and have minimum length
            if (!DataValidator.validateArray(highs, this.minDataPoints) || 
                !DataValidator.validateArray(lows, this.minDataPoints) ||
                !DataValidator.validateArray(closes, this.minDataPoints)) {
                throw new Error(`Stochastic validation failed: need at least ${this.minDataPoints} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            // Calculate %K values
            const kValues = [];
            
            for (let i = this.kPeriod - 1; i < closes.length; i++) {
                const periodHighs = highs.slice(i - this.kPeriod + 1, i + 1);
                const periodLows = lows.slice(i - this.kPeriod + 1, i + 1);
                const currentClose = closes[i];
                
                const highestHigh = Math.max(...periodHighs);
                const lowestLow = Math.min(...periodLows);
                
                let kValue;
                if (highestHigh === lowestLow) {
                    kValue = 50; // Neutral when no range
                } else {
                    kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
                }
                
                kValues.push(kValue);
            }
            
            // Calculate %D (SMA of %K) - only if we have enough %K values
            const dValues = [];
            if (kValues.length >= this.dPeriod) {
                for (let i = this.dPeriod - 1; i < kValues.length; i++) {
                    const kSlice = kValues.slice(i - this.dPeriod + 1, i + 1);
                    const dValue = kSlice.reduce((sum, k) => sum + k, 0) / this.dPeriod;
                    dValues.push(dValue);
                }
            }
            
            // Get current values, ensuring they exist
            const currentK = kValues[kValues.length - 1];
            const currentD = dValues.length > 0 ? dValues[dValues.length - 1] : currentK; // Use %K if %D not available
            const prevK = kValues.length > 1 ? kValues[kValues.length - 2] : currentK;
            const prevD = dValues.length > 1 ? dValues[dValues.length - 2] : currentD;
            
            // Ensure all values are defined
            if (currentK === undefined || currentD === undefined) {
                throw new Error('Failed to calculate Stochastic values');
            }
            
            // Generate trading signal
            const signal = this.generateSignal(currentK, currentD, prevK, prevD);
            
            Logger.debug('Stochastic calculated', {
                k: currentK.toFixed(2),
                d: currentD.toFixed(2),
                suggestion: signal.suggestion
            });
            
            return {
                k: Number(currentK.toFixed(2)),
                d: Number(currentD.toFixed(2)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    kPeriod: this.kPeriod,
                    dPeriod: this.dPeriod,
                    interpretation: signal.interpretation,
                    crossover: signal.crossover,
                    hasEnoughData: dValues.length > 0
                }
            };
            
        } catch (error) {
            Logger.error('Stochastic calculation error', { error: error.message });
            throw error;
        }
    }
    
    generateSignal(currentK, currentD, prevK, prevD) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let crossover = null;
        
        // Detect crossovers
        const bullishCrossover = prevK <= prevD && currentK > currentD;
        const bearishCrossover = prevK >= prevD && currentK < currentD;
        
        // Strong signals: Crossovers in oversold/overbought zones
        if (bullishCrossover && currentK < 30) {
            suggestion = "buy";
            crossover = "bullish";
            confidence = Math.min(1, (30 - currentK) / 20 + 0.3);
            strength = confidence;
            interpretation = "Bullish crossover in oversold zone - strong buy signal";
        }
        else if (bearishCrossover && currentK > 70) {
            suggestion = "sell";
            crossover = "bearish";
            confidence = Math.min(1, (currentK - 70) / 20 + 0.3);
            strength = confidence;
            interpretation = "Bearish crossover in overbought zone - strong sell signal";
        }
        // Regular crossovers
        else if (bullishCrossover) {
            suggestion = "buy";
            crossover = "bullish";
            confidence = 0.6;
            strength = 0.5;
            interpretation = "Bullish crossover - moderate buy signal";
        }
        else if (bearishCrossover) {
            suggestion = "sell";
            crossover = "bearish";
            confidence = 0.6;
            strength = 0.5;
            interpretation = "Bearish crossover - moderate sell signal";
        }
        // Extreme levels without crossover
        else if (currentK > 80 && currentD > 80) {
            suggestion = "sell";
            confidence = Math.min(0.7, (currentK - 80) / 20);
            strength = confidence * 0.8;
            interpretation = `Overbought condition (%K: ${currentK.toFixed(1)})`;
        }
        else if (currentK < 20 && currentD < 20) {
            suggestion = "buy";
            confidence = Math.min(0.7, (20 - currentK) / 20);
            strength = confidence * 0.8;
            interpretation = `Oversold condition (%K: ${currentK.toFixed(1)})`;
        }
        else {
            suggestion = "hold";
            interpretation = `No clear stochastic signal (%K: ${currentK.toFixed(1)}, %D: ${currentD.toFixed(1)})`;
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            crossover
        };
    }
}

module.exports = Stochastic;