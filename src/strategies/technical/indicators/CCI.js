const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class CCI {
    constructor(period = 20, factor = 0.015) {
        this.period = period;
        this.factor = factor; // Standard CCI constant (0.015)
        this.name = 'CCI';
        this.minDataPoints = this.period;
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input
            if (!DataValidator.validateArray(highs, this.minDataPoints) || 
                !DataValidator.validateArray(lows, this.minDataPoints) ||
                !DataValidator.validateArray(closes, this.minDataPoints)) {
                throw new Error(`CCI validation failed: need at least ${this.minDataPoints} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            // Step 1: Calculate Typical Price (TP) for each period
            const typicalPrices = this.calculateTypicalPrices(highs, lows, closes);
            
            // Step 2: Calculate Simple Moving Average of Typical Price
            const smaTP = this.calculateSMA(typicalPrices, this.period);
            
            // Step 3: Calculate Mean Deviation
            const meanDeviation = this.calculateMeanDeviation(typicalPrices, smaTP, this.period);
            
            // Step 4: Calculate CCI
            const currentTP = typicalPrices[typicalPrices.length - 1];
            let cci = 0;
            
            if (meanDeviation !== 0) {
                cci = (currentTP - smaTP) / (this.factor * meanDeviation);
            }
            
            // Validate result
            if (!Number.isFinite(cci)) {
                throw new Error('Invalid CCI calculation result');
            }
            
            // Generate trading signal
            const signal = this.generateSignal(cci, typicalPrices);
            
            Logger.debug('CCI calculated', {
                cci: cci.toFixed(2),
                typicalPrice: currentTP.toFixed(6),
                smaTP: smaTP.toFixed(6),
                suggestion: signal.suggestion
            });
            
            return {
                cci: Number(cci.toFixed(2)),
                typicalPrice: Number(currentTP.toFixed(6)),
                smaTP: Number(smaTP.toFixed(6)),
                meanDeviation: Number(meanDeviation.toFixed(6)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    period: this.period,
                    factor: this.factor,
                    interpretation: signal.interpretation,
                    level: signal.level,
                    divergence: signal.divergence
                }
            };
            
        } catch (error) {
            Logger.error('CCI calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateTypicalPrices(highs, lows, closes) {
        const typicalPrices = [];
        
        for (let i = 0; i < highs.length; i++) {
            const tp = (highs[i] + lows[i] + closes[i]) / 3;
            typicalPrices.push(tp);
        }
        
        return typicalPrices;
    }
    
    calculateSMA(data, period) {
        if (data.length < period) {
            throw new Error(`Insufficient data for SMA calculation: need ${period}, got ${data.length}`);
        }
        
        const recent = data.slice(-period);
        return recent.reduce((sum, value) => sum + value, 0) / period;
    }
    
    calculateMeanDeviation(typicalPrices, smaTP, period) {
        if (typicalPrices.length < period) {
            throw new Error(`Insufficient data for mean deviation calculation: need ${period}, got ${typicalPrices.length}`);
        }
        
        const recent = typicalPrices.slice(-period);
        const deviations = recent.map(tp => Math.abs(tp - smaTP));
        
        return deviations.reduce((sum, deviation) => sum + deviation, 0) / period;
    }
    
    generateSignal(cci, typicalPrices) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let level = "";
        let divergence = null;
        
        // Determine CCI level
        if (cci > 200) {
            level = "Extremely Overbought";
        } else if (cci > 100) {
            level = "Overbought";
        } else if (cci > 0) {
            level = "Bullish";
        } else if (cci > -100) {
            level = "Bearish";
        } else if (cci > -200) {
            level = "Oversold";
        } else {
            level = "Extremely Oversold";
        }
        
        // Generate trading signals based on CCI levels
        if (cci > 100) {
            // Overbought territory - look for sell signals
            suggestion = "sell";
            
            if (cci > 200) {
                // Extremely overbought
                confidence = Math.min(1, (cci - 200) / 100);
                strength = confidence;
                interpretation = `Extremely overbought (CCI: ${cci.toFixed(1)}) - strong sell signal, expect reversal.`;
            } else {
                // Regular overbought
                confidence = Math.min(0.7, (cci - 100) / 100);
                strength = confidence * 0.8;
                interpretation = `Overbought (CCI: ${cci.toFixed(1)}) - sell signal, watch for reversal.`;
            }
        } else if (cci < -100) {
            // Oversold territory - look for buy signals
            suggestion = "buy";
            
            if (cci < -200) {
                // Extremely oversold
                confidence = Math.min(1, (-200 - cci) / 100);
                strength = confidence;
                interpretation = `Extremely oversold (CCI: ${cci.toFixed(1)}) - strong buy signal, expect reversal.`;
            } else {
                // Regular oversold
                confidence = Math.min(0.7, (-100 - cci) / 100);
                strength = confidence * 0.8;
                interpretation = `Oversold (CCI: ${cci.toFixed(1)}) - buy signal, watch for reversal.`;
            }
        } else if (cci > 0 && cci <= 100) {
            // Bullish but not overbought
            suggestion = "hold";
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Bullish momentum (CCI: ${cci.toFixed(1)}) - upward bias but no strong signal.`;
        } else if (cci < 0 && cci >= -100) {
            // Bearish but not oversold
            suggestion = "hold";
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Bearish momentum (CCI: ${cci.toFixed(1)}) - downward bias but no strong signal.`;
        } else {
            // Neutral zone
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = `Neutral zone (CCI: ${cci.toFixed(1)}) - no clear directional bias.`;
        }
        
        // Check for potential divergence (basic implementation)
        if (typicalPrices.length >= this.period * 2) {
            divergence = this.checkDivergence(typicalPrices);
            if (divergence) {
                interpretation += ` ${divergence}`;
                confidence *= 1.1; // Slight boost for divergence confirmation
            }
        }
        
        // Special signals for zero line crosses
        if (typicalPrices.length >= 2) {
            const prevCCI = this.calculatePreviousCCI(typicalPrices);
            
            if (prevCCI <= 0 && cci > 0) {
                interpretation += " CCI crossed above zero - bullish momentum.";
                if (suggestion === "hold") {
                    suggestion = "buy";
                    confidence = 0.4;
                    strength = 0.3;
                }
            } else if (prevCCI >= 0 && cci < 0) {
                interpretation += " CCI crossed below zero - bearish momentum.";
                if (suggestion === "hold") {
                    suggestion = "sell";
                    confidence = 0.4;
                    strength = 0.3;
                }
            }
        }
        
        // Cap confidence
        confidence = Math.min(confidence, 1.0);
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation: interpretation.trim(),
            level,
            divergence
        };
    }
    
    calculatePreviousCCI(typicalPrices) {
        if (typicalPrices.length < this.period + 1) {
            return 0;
        }
        
        try {
            // Calculate CCI for previous period
            const prevTypicalPrices = typicalPrices.slice(0, -1);
            const prevSmaTP = this.calculateSMA(prevTypicalPrices, this.period);
            const prevMeanDeviation = this.calculateMeanDeviation(prevTypicalPrices, prevSmaTP, this.period);
            const prevCurrentTP = prevTypicalPrices[prevTypicalPrices.length - 1];
            
            if (prevMeanDeviation === 0) return 0;
            
            return (prevCurrentTP - prevSmaTP) / (this.factor * prevMeanDeviation);
        } catch (error) {
            return 0;
        }
    }
    
    checkDivergence(typicalPrices) {
        // Simple divergence detection - can be enhanced
        if (typicalPrices.length < this.period * 2) {
            return null;
        }
        
        try {
            const recent = typicalPrices.slice(-this.period);
            const older = typicalPrices.slice(-this.period * 2, -this.period);
            
            const recentHigh = Math.max(...recent);
            const recentLow = Math.min(...recent);
            const olderHigh = Math.max(...older);
            const olderLow = Math.min(...older);
            
            // Bullish divergence: price makes lower low, CCI makes higher low
            if (recentLow < olderLow && recentHigh > olderHigh) {
                return "Potential bullish divergence detected.";
            }
            
            // Bearish divergence: price makes higher high, CCI makes lower high
            if (recentHigh > olderHigh && recentLow < olderLow) {
                return "Potential bearish divergence detected.";
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // Calculate CCI history for charting/analysis
    calculateHistory(highs, lows, closes, outputLength = 50) {
        if (highs.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for CCI history. Need ${this.minDataPoints + outputLength}, have ${highs.length}`);
        }
        
        const cciHistory = [];
        
        for (let i = this.minDataPoints; i <= Math.min(highs.length, this.minDataPoints + outputLength); i++) {
            const highsSlice = highs.slice(0, i);
            const lowsSlice = lows.slice(0, i);
            const closesSlice = closes.slice(0, i);
            
            try {
                const result = this.calculate(highsSlice, lowsSlice, closesSlice);
                cciHistory.push({
                    cci: result.cci,
                    level: result.metadata.level,
                    timestamp: Date.now() - ((this.minDataPoints + outputLength - i) * 300000)
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return cciHistory;
    }
    
    // Helper method to interpret CCI values
    static interpretCCI(cciValue) {
        if (cciValue > 200) return "Extremely Overbought";
        if (cciValue > 100) return "Overbought";
        if (cciValue > 0) return "Bullish";
        if (cciValue > -100) return "Bearish";
        if (cciValue > -200) return "Oversold";
        return "Extremely Oversold";
    }
    
    // Helper method to get signal strength
    static getSignalStrength(cciValue) {
        const abs = Math.abs(cciValue);
        if (abs > 200) return "Very Strong";
        if (abs > 100) return "Strong";
        if (abs > 50) return "Moderate";
        if (abs > 25) return "Weak";
        return "Very Weak";
    }
}

module.exports = CCI;