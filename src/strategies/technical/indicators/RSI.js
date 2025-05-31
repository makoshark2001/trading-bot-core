const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class RSI {
    constructor(period = 14) {
        this.period = period;
        this.name = 'RSI';
    }
    
    calculate(prices) {
        try {
            // Validate input - RSI only needs prices (closes)
            if (!DataValidator.validatePriceArray(prices, this.period + 1)) {
                throw new Error(`RSI validation failed: need at least ${this.period + 1} valid price values, got ${prices?.length || 0}`);
            }
            
            if (prices.length < this.period + 1) {
                throw new Error(`Insufficient data for RSI. Need ${this.period + 1}, have ${prices.length}`);
            }
            
            let gains = 0;
            let losses = 0;
            
            // Calculate initial average gain and loss
            for (let i = prices.length - this.period; i < prices.length; i++) {
                const change = prices[i] - prices[i - 1];
                if (change > 0) {
                    gains += change;
                } else {
                    losses -= change; // Make positive
                }
            }
            
            const avgGain = gains / this.period;
            const avgLoss = losses / this.period;
            
            // Handle edge cases
            if (avgLoss === 0) {
                return {
                    value: 100,
                    suggestion: "sell", // Extremely overbought
                    confidence: 1,
                    strength: 1,
                    metadata: {
                        avgGain,
                        avgLoss,
                        period: this.period,
                        interpretation: "Extremely overbought - no losses in period"
                    }
                };
            }
            
            if (avgGain === 0) {
                return {
                    value: 0,
                    suggestion: "buy", // Extremely oversold
                    confidence: 1,
                    strength: 1,
                    metadata: {
                        avgGain,
                        avgLoss,
                        period: this.period,
                        interpretation: "Extremely oversold - no gains in period"
                    }
                };
            }
            
            // Calculate RSI
            const relativeStrength = avgGain / avgLoss;
            const rsiValue = 100 - (100 / (1 + relativeStrength));
            
            // Generate trading signal
            const signal = this.generateSignal(rsiValue);
            
            Logger.debug(`RSI calculated`, {
                value: rsiValue,
                suggestion: signal.suggestion,
                confidence: signal.confidence
            });
            
            return {
                value: Number(rsiValue.toFixed(2)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    avgGain: Number(avgGain.toFixed(6)),
                    avgLoss: Number(avgLoss.toFixed(6)),
                    relativeStrength: Number(relativeStrength.toFixed(4)),
                    period: this.period,
                    interpretation: signal.interpretation
                }
            };
            
        } catch (error) {
            Logger.error(`RSI calculation error`, { error: error.message });
            throw error;
        }
    }
    
    generateSignal(rsiValue) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        
        if (rsiValue > 80) {
            suggestion = "sell";
            confidence = Math.min(1, (rsiValue - 80) / 20); // Scale 80-100 to 0-1
            strength = confidence;
            interpretation = "Strong overbought signal";
        } else if (rsiValue > 70) {
            suggestion = "sell";
            confidence = Math.min(1, (rsiValue - 70) / 30); // Scale 70-100 to 0-1
            strength = confidence * 0.8; // Slightly less strength than 80+
            interpretation = "Overbought signal";
        } else if (rsiValue < 20) {
            suggestion = "buy";
            confidence = Math.min(1, (20 - rsiValue) / 20); // Scale 0-20 to 1-0
            strength = confidence;
            interpretation = "Strong oversold signal";
        } else if (rsiValue < 30) {
            suggestion = "buy";
            confidence = Math.min(1, (30 - rsiValue) / 30); // Scale 0-30 to 1-0
            strength = confidence * 0.8; // Slightly less strength than 20-
            interpretation = "Oversold signal";
        } else if (rsiValue >= 45 && rsiValue <= 55) {
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = "Neutral zone - no clear signal";
        } else {
            // Weak signals in between zones
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = "No significant signal";
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation
        };
    }
    
    // Method to calculate RSI for multiple periods (useful for analysis)
    calculateHistory(prices, outputLength = 50) {
        if (prices.length < this.period + outputLength) {
            throw new Error(`Insufficient data for RSI history. Need ${this.period + outputLength}, have ${prices.length}`);
        }
        
        const rsiHistory = [];
        
        // Calculate RSI for each point in the requested range
        for (let i = this.period; i <= outputLength; i++) {
            const subset = prices.slice(-i - this.period, -i + 1);
            if (subset.length >= this.period + 1) {
                const result = this.calculate(subset);
                rsiHistory.push({
                    value: result.value,
                    timestamp: Date.now() - (outputLength - i) * 300000 // Approximate timestamps
                });
            }
        }
        
        return rsiHistory;
    }
    
    // Helper method to get RSI interpretation
    static interpretRSI(value) {
        if (value > 80) return "Extremely Overbought";
        if (value > 70) return "Overbought";
        if (value > 60) return "Bullish";
        if (value > 40) return "Neutral";
        if (value > 30) return "Bearish";
        if (value > 20) return "Oversold";
        return "Extremely Oversold";
    }
}

module.exports = RSI;