const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class WilliamsR {
    constructor(period = 14) {
        this.period = period;
        this.name = 'WilliamsR';
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input
            if (!DataValidator.validateArray(highs, this.period) || 
                !DataValidator.validateArray(lows, this.period) ||
                !DataValidator.validateArray(closes, this.period)) {
                throw new Error(`Williams %R validation failed: need at least ${this.period} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            const values = [];
            
            // Calculate Williams %R for each period
            for (let i = this.period - 1; i < closes.length; i++) {
                const periodHighs = highs.slice(i - this.period + 1, i + 1);
                const periodLows = lows.slice(i - this.period + 1, i + 1);
                const currentClose = closes[i];
                
                const highestHigh = Math.max(...periodHighs);
                const lowestLow = Math.min(...periodLows);
                
                let williamsR;
                if (highestHigh === lowestLow) {
                    williamsR = -50; // Neutral when no range
                } else {
                    williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
                }
                
                values.push(williamsR);
            }
            
            const currentValue = values[values.length - 1];
            const prevValue = values[values.length - 2] || currentValue;
            
            // Generate trading signal
            const signal = this.generateSignal(currentValue, prevValue);
            
            Logger.debug('Williams %R calculated', {
                value: currentValue.toFixed(2),
                suggestion: signal.suggestion
            });
            
            return {
                value: Number(currentValue.toFixed(2)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    period: this.period,
                    interpretation: signal.interpretation,
                    level: signal.level
                }
            };
            
        } catch (error) {
            Logger.error('Williams %R calculation error', { error: error.message });
            throw error;
        }
    }
    
    generateSignal(currentValue, prevValue) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let level = "";
        
        // Williams %R levels (inverted scale: -100 to 0)
        const overbought = -20; // -20 to 0 = overbought
        const oversold = -80;   // -100 to -80 = oversold
        
        // Determine current level
        if (currentValue > overbought) {
            level = "Overbought";
        } else if (currentValue < oversold) {
            level = "Oversold";
        } else {
            level = "Neutral";
        }
        
        // Strong oversold (potential buy)
        if (currentValue < -90) {
            suggestion = "buy";
            confidence = Math.min(1, (-90 - currentValue) / 10);
            strength = confidence;
            interpretation = `Strong oversold signal (${currentValue.toFixed(1)}%) - potential reversal up`;
        }
        // Regular oversold
        else if (currentValue < oversold) {
            suggestion = "buy";
            confidence = Math.min(0.7, (oversold - currentValue) / 20);
            strength = confidence * 0.8;
            interpretation = `Oversold condition (${currentValue.toFixed(1)}%) - buy signal`;
        }
        // Strong overbought (potential sell)
        else if (currentValue > -10) {
            suggestion = "sell";
            confidence = Math.min(1, (currentValue + 10) / 10);
            strength = confidence;
            interpretation = `Strong overbought signal (${currentValue.toFixed(1)}%) - potential reversal down`;
        }
        // Regular overbought
        else if (currentValue > overbought) {
            suggestion = "sell";
            confidence = Math.min(0.7, (currentValue - overbought) / 20);
            strength = confidence * 0.8;
            interpretation = `Overbought condition (${currentValue.toFixed(1)}%) - sell signal`;
        }
        // Momentum signals
        else if (prevValue < oversold && currentValue > oversold) {
            suggestion = "buy";
            confidence = 0.5;
            strength = 0.4;
            interpretation = "Breaking out of oversold territory - momentum shift up";
        }
        else if (prevValue > overbought && currentValue < overbought) {
            suggestion = "sell";
            confidence = 0.5;
            strength = 0.4;
            interpretation = "Breaking down from overbought territory - momentum shift down";
        }
        else {
            suggestion = "hold";
            interpretation = `Neutral zone (${currentValue.toFixed(1)}%) - no clear signal`;
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            level
        };
    }
}

module.exports = WilliamsR;