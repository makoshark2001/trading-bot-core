const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class MACD {
    constructor(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        this.fastPeriod = fastPeriod;
        this.slowPeriod = slowPeriod;
        this.signalPeriod = signalPeriod;
        this.name = 'MACD';
        this.minDataPoints = slowPeriod + signalPeriod;
    }
    
    calculate(prices) {
        try {
            // Validate input
            if (!DataValidator.validatePriceArray(prices, this.minDataPoints)) {
                throw new Error(`MACD validation failed: need at least ${this.minDataPoints} valid price values, got ${prices?.length || 0}`);
            }
            
            // Calculate EMAs
            const fastEMA = this.calculateEMA(prices, this.fastPeriod);
            const slowEMA = this.calculateEMA(prices, this.slowPeriod);
            
            // Calculate MACD line (fast EMA - slow EMA)
            const macdLine = fastEMA - slowEMA;
            
            // Calculate MACD history for signal line
            const macdHistory = this.calculateMACDHistory(prices);
            if (macdHistory.length < this.signalPeriod) {
                throw new Error(`Insufficient MACD history for signal line calculation`);
            }
            
            // Calculate signal line (EMA of MACD line)
            const signalLine = this.calculateEMA(macdHistory, this.signalPeriod);
            
            // Calculate histogram (MACD - Signal)
            const histogram = macdLine - signalLine;
            
            // Generate trading signal
            const signal = this.generateSignal(macdLine, signalLine, histogram, macdHistory);
            
            Logger.debug(`MACD calculated`, {
                macdLine: macdLine.toFixed(6),
                signalLine: signalLine.toFixed(6),
                histogram: histogram.toFixed(6),
                suggestion: signal.suggestion
            });
            
            return {
                macdLine: Number(macdLine.toFixed(6)),
                signalLine: Number(signalLine.toFixed(6)),
                histogram: Number(histogram.toFixed(6)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    fastPeriod: this.fastPeriod,
                    slowPeriod: this.slowPeriod,
                    signalPeriod: this.signalPeriod,
                    interpretation: signal.interpretation,
                    crossover: signal.crossover
                }
            };
            
        } catch (error) {
            Logger.error(`MACD calculation error`, { error: error.message });
            throw error;
        }
    }
    
    calculateEMA(data, period) {
        if (data.length < period) {
            throw new Error(`Insufficient data for EMA calculation: need ${period}, got ${data.length}`);
        }
        
        const multiplier = 2 / (period + 1);
        
        // Start with SMA for the first value
        let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
        
        // Calculate EMA for remaining values
        for (let i = period; i < data.length; i++) {
            ema = (data[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }
    
    calculateMACDHistory(prices) {
        const macdHistory = [];
        
        // We need enough data for both EMAs
        const minLength = Math.max(this.fastPeriod, this.slowPeriod);
        
        // Calculate MACD for each point where we have enough data
        for (let i = minLength; i <= prices.length; i++) {
            const subset = prices.slice(0, i);
            
            if (subset.length >= minLength) {
                const fastEMA = this.calculateEMA(subset, this.fastPeriod);
                const slowEMA = this.calculateEMA(subset, this.slowPeriod);
                macdHistory.push(fastEMA - slowEMA);
            }
        }
        
        return macdHistory;
    }
    
    generateSignal(macdLine, signalLine, histogram, macdHistory) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let crossover = null;
        
        // Check for crossovers (need at least 2 MACD history points)
        if (macdHistory.length >= 2) {
            const prevMACD = macdHistory[macdHistory.length - 2];
            const currMACD = macdLine;
            
            // Recalculate previous signal line for crossover detection
            const prevSignalHistory = macdHistory.slice(0, -1);
            const prevSignalLine = prevSignalHistory.length >= this.signalPeriod ? 
                this.calculateEMA(prevSignalHistory, this.signalPeriod) : signalLine;
            
            // Bullish crossover: MACD crosses above signal line
            if (prevMACD <= prevSignalLine && currMACD > signalLine) {
                suggestion = "buy";
                crossover = "bullish";
                confidence = Math.min(1, Math.abs(histogram) / (Math.abs(signalLine) || 0.000001));
                strength = confidence;
                interpretation = "Bullish MACD crossover - momentum turning up";
            }
            // Bearish crossover: MACD crosses below signal line  
            else if (prevMACD >= prevSignalLine && currMACD < signalLine) {
                suggestion = "sell";
                crossover = "bearish";
                confidence = Math.min(1, Math.abs(histogram) / (Math.abs(signalLine) || 0.000001));
                strength = confidence;
                interpretation = "Bearish MACD crossover - momentum turning down";
            }
            // Zero line crossovers
            else if (prevMACD <= 0 && currMACD > 0) {
                suggestion = "buy";
                crossover = "zero_bullish";
                confidence = Math.min(0.7, Math.abs(currMACD) / 0.001); // Scale confidence
                strength = confidence * 0.8;
                interpretation = "MACD crossed above zero line - uptrend confirmed";
            }
            else if (prevMACD >= 0 && currMACD < 0) {
                suggestion = "sell";
                crossover = "zero_bearish";
                confidence = Math.min(0.7, Math.abs(currMACD) / 0.001);
                strength = confidence * 0.8;
                interpretation = "MACD crossed below zero line - downtrend confirmed";
            }
            // Histogram momentum
            else if (Math.abs(histogram) > Math.abs(signalLine) * 0.1) {
                if (histogram > 0 && macdLine > signalLine) {
                    suggestion = "buy";
                    confidence = Math.min(0.5, histogram / (Math.abs(signalLine) || 0.000001));
                    strength = confidence * 0.6;
                    interpretation = "Strong bullish momentum";
                } else if (histogram < 0 && macdLine < signalLine) {
                    suggestion = "sell";
                    confidence = Math.min(0.5, Math.abs(histogram) / (Math.abs(signalLine) || 0.000001));
                    strength = confidence * 0.6;
                    interpretation = "Strong bearish momentum";
                }
            }
            else {
                suggestion = "hold";
                interpretation = "No clear MACD signal";
            }
        } else {
            interpretation = "Insufficient history for crossover detection";
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            crossover
        };
    }
    
    // Calculate MACD for multiple periods (useful for historical analysis)
    calculateHistory(prices, outputLength = 50) {
        if (prices.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for MACD history. Need ${this.minDataPoints + outputLength}, have ${prices.length}`);
        }
        
        const macdHistory = [];
        
        for (let i = this.minDataPoints; i <= Math.min(prices.length, this.minDataPoints + outputLength); i++) {
            const subset = prices.slice(0, i);
            try {
                const result = this.calculate(subset);
                macdHistory.push({
                    macdLine: result.macdLine,
                    signalLine: result.signalLine,
                    histogram: result.histogram,
                    timestamp: Date.now() - ((this.minDataPoints + outputLength - i) * 300000) // Approximate
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return macdHistory;
    }
    
    // Helper method to interpret MACD values
    static interpretMACD(macdLine, signalLine, histogram) {
        if (macdLine > signalLine && histogram > 0) {
            return histogram > 0.001 ? "Strong Bullish" : "Bullish";
        } else if (macdLine < signalLine && histogram < 0) {
            return Math.abs(histogram) > 0.001 ? "Strong Bearish" : "Bearish";
        } else if (Math.abs(macdLine) < 0.0001 && Math.abs(signalLine) < 0.0001) {
            return "Neutral/Sideways";
        } else {
            return "Transitioning";
        }
    }
}

module.exports = MACD;