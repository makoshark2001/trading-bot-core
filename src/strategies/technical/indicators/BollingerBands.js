const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class BollingerBands {
    constructor(period = 20, stdDevMultiplier = 2) {
        this.period = period;
        this.stdDevMultiplier = stdDevMultiplier;
        this.name = 'BollingerBands';
    }
    
    calculate(prices) {
        try {
            // Validate input
            if (!DataValidator.validatePriceArray(prices, this.period)) {
                throw new Error(`Bollinger Bands validation failed: need at least ${this.period} valid price values, got ${prices?.length || 0}`);
            }
            
            // Get recent prices for calculation
            const recent = prices.slice(-this.period);
            
            // Calculate Simple Moving Average (middle band)
            const sma = recent.reduce((sum, price) => sum + price, 0) / this.period;
            
            // Calculate Standard Deviation
            const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / this.period;
            const stdDev = Math.sqrt(variance);
            
            // Calculate bands
            const upperBand = sma + (this.stdDevMultiplier * stdDev);
            const lowerBand = sma - (this.stdDevMultiplier * stdDev);
            const currentPrice = prices[prices.length - 1];
            
            // Handle edge case where standard deviation is zero (no volatility)
            if (stdDev === 0) {
                return {
                    upperBand: sma,
                    middleBand: sma,
                    lowerBand: sma,
                    currentPrice,
                    bandwidth: 0,
                    percentB: 0.5, // Middle of the bands
                    suggestion: "hold",
                    confidence: 0,
                    strength: 0,
                    metadata: {
                        period: this.period,
                        stdDevMultiplier: this.stdDevMultiplier,
                        stdDev: 0,
                        interpretation: "No volatility - price is flat"
                    }
                };
            }
            
            // Calculate %B (price position within bands)
            const percentB = (currentPrice - lowerBand) / (upperBand - lowerBand);
            
            // Calculate Bandwidth (volatility measure)
            const bandwidth = (upperBand - lowerBand) / sma;
            
            // Generate trading signal
            const signal = this.generateSignal(currentPrice, upperBand, lowerBand, sma, percentB, bandwidth, stdDev);
            
            Logger.debug('Bollinger Bands calculated', {
                currentPrice: currentPrice.toFixed(6),
                upperBand: upperBand.toFixed(6),
                lowerBand: lowerBand.toFixed(6),
                percentB: percentB.toFixed(4),
                suggestion: signal.suggestion
            });
            
            return {
                upperBand: Number(upperBand.toFixed(6)),
                middleBand: Number(sma.toFixed(6)),
                lowerBand: Number(lowerBand.toFixed(6)),
                currentPrice: Number(currentPrice.toFixed(6)),
                bandwidth: Number(bandwidth.toFixed(6)),
                percentB: Number(percentB.toFixed(4)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    period: this.period,
                    stdDevMultiplier: this.stdDevMultiplier,
                    stdDev: Number(stdDev.toFixed(6)),
                    interpretation: signal.interpretation,
                    squeeze: signal.squeeze
                }
            };
            
        } catch (error) {
            Logger.error('Bollinger Bands calculation error', { error: error.message });
            throw error;
        }
    }
    
    generateSignal(currentPrice, upperBand, lowerBand, middleBand, percentB, bandwidth, stdDev) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let squeeze = false;
        
        // Detect Bollinger Band Squeeze (low volatility)
        const avgPrice = (upperBand + lowerBand) / 2;
        const bandWidth = (upperBand - lowerBand) / avgPrice;
        
        if (bandWidth < 0.1) { // Less than 10% band width indicates squeeze
            squeeze = true;
            interpretation = "Bollinger Band Squeeze - low volatility, potential breakout coming";
            suggestion = "hold";
            confidence = 0.3; // Moderate confidence for upcoming volatility
            strength = 0.2;
        }
        // Strong oversold signal (price below lower band)
        else if (currentPrice < lowerBand) {
            suggestion = "buy";
            const distance = (lowerBand - currentPrice) / stdDev;
            confidence = Math.min(1, distance); // Further below = higher confidence
            strength = confidence;
            interpretation = `Price below lower band - oversold condition (${distance.toFixed(2)} std devs)`;
        }
        // Strong overbought signal (price above upper band)
        else if (currentPrice > upperBand) {
            suggestion = "sell";
            const distance = (currentPrice - upperBand) / stdDev;
            confidence = Math.min(1, distance); // Further above = higher confidence
            strength = confidence;
            interpretation = `Price above upper band - overbought condition (${distance.toFixed(2)} std devs)`;
        }
        // Price approaching lower band (potential buy zone)
        else if (percentB < 0.2) {
            suggestion = "buy";
            confidence = Math.min(0.7, (0.2 - percentB) * 5); // Scale to 0-0.7
            strength = confidence * 0.8;
            interpretation = `Price in lower 20% of bands - potential buy zone (%B: ${percentB.toFixed(2)})`;
        }
        // Price approaching upper band (potential sell zone)
        else if (percentB > 0.8) {
            suggestion = "sell";
            confidence = Math.min(0.7, (percentB - 0.8) * 5); // Scale to 0-0.7
            strength = confidence * 0.8;
            interpretation = `Price in upper 20% of bands - potential sell zone (%B: ${percentB.toFixed(2)})`;
        }
        // Price near middle band
        else if (percentB >= 0.4 && percentB <= 0.6) {
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = `Price near middle band - neutral zone (%B: ${percentB.toFixed(2)})`;
        }
        // Price in trending zones
        else if (percentB > 0.6 && percentB <= 0.8) {
            suggestion = "hold"; // Could be uptrend continuation
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Price in upper half - potential uptrend (%B: ${percentB.toFixed(2)})`;
        }
        else if (percentB < 0.4 && percentB >= 0.2) {
            suggestion = "hold"; // Could be downtrend continuation
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Price in lower half - potential downtrend (%B: ${percentB.toFixed(2)})`;
        }
        else {
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = `No clear Bollinger Band signal (%B: ${percentB.toFixed(2)})`;
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            squeeze
        };
    }
    
    // Calculate historical Bollinger Bands (useful for backtesting)
    calculateHistory(prices, outputLength = 50) {
        if (prices.length < this.period + outputLength) {
            throw new Error(`Insufficient data for Bollinger Bands history. Need ${this.period + outputLength}, have ${prices.length}`);
        }
        
        const bandsHistory = [];
        
        for (let i = this.period; i <= Math.min(prices.length, this.period + outputLength); i++) {
            const subset = prices.slice(0, i);
            try {
                const result = this.calculate(subset);
                bandsHistory.push({
                    upperBand: result.upperBand,
                    middleBand: result.middleBand,
                    lowerBand: result.lowerBand,
                    percentB: result.percentB,
                    bandwidth: result.bandwidth,
                    timestamp: Date.now() - ((this.period + outputLength - i) * 300000) // Approximate
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return bandsHistory;
    }
    
    // Helper method to interpret %B values
    static interpretPercentB(percentB) {
        if (percentB > 1) return "Above Upper Band (Overbought)";
        if (percentB > 0.8) return "Near Upper Band (Potentially Overbought)";
        if (percentB > 0.6) return "Upper Half (Bullish Bias)";
        if (percentB > 0.4) return "Middle Zone (Neutral)";
        if (percentB > 0.2) return "Lower Half (Bearish Bias)";
        if (percentB >= 0) return "Near Lower Band (Potentially Oversold)";
        return "Below Lower Band (Oversold)";
    }
    
    // Helper method to detect band squeeze
    static isSqueezing(bandwidth, threshold = 0.1) {
        return bandwidth < threshold;
    }
}

module.exports = BollingerBands;