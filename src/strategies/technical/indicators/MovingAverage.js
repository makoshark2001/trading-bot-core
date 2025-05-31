const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class MovingAverage {
    constructor(fastPeriod = 10, slowPeriod = 21) {
        this.fastPeriod = fastPeriod;
        this.slowPeriod = slowPeriod;
        this.name = 'MovingAverage';
        this.minDataPoints = Math.max(fastPeriod, slowPeriod) + 1; // +1 for crossover detection
    }
    
    calculate(prices) {
        try {
            // Validate input
            if (!DataValidator.validatePriceArray(prices, this.minDataPoints)) {
                throw new Error(`Moving Average validation failed: need at least ${this.minDataPoints} valid price values, got ${prices?.length || 0}`);
            }
            
            // Calculate current moving averages
            const fastMA = this.calculateSMA(prices, this.fastPeriod);
            const slowMA = this.calculateSMA(prices, this.slowPeriod);
            
            // Calculate previous moving averages for crossover detection
            const prevFastMA = this.calculateSMA(prices.slice(0, -1), this.fastPeriod);
            const prevSlowMA = this.calculateSMA(prices.slice(0, -1), this.slowPeriod);
            
            // Current price for additional context
            const currentPrice = prices[prices.length - 1];
            
            // Generate trading signal
            const signal = this.generateSignal(fastMA, slowMA, prevFastMA, prevSlowMA, currentPrice);
            
            Logger.debug('Moving Average calculated', {
                fastMA: fastMA.toFixed(6),
                slowMA: slowMA.toFixed(6),
                crossover: signal.crossover,
                suggestion: signal.suggestion
            });
            
            return {
                fastMA: Number(fastMA.toFixed(6)),
                slowMA: Number(slowMA.toFixed(6)),
                currentPrice: Number(currentPrice.toFixed(6)),
                spread: Number((fastMA - slowMA).toFixed(6)),
                spreadPercent: Number(((fastMA - slowMA) / slowMA * 100).toFixed(4)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    fastPeriod: this.fastPeriod,
                    slowPeriod: this.slowPeriod,
                    crossover: signal.crossover,
                    interpretation: signal.interpretation,
                    trend: signal.trend
                }
            };
            
        } catch (error) {
            Logger.error('Moving Average calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateSMA(prices, period) {
        if (prices.length < period) {
            throw new Error(`Insufficient data for SMA calculation: need ${period}, got ${prices.length}`);
        }
        
        const recent = prices.slice(-period);
        return recent.reduce((sum, price) => sum + price, 0) / period;
    }
    
    calculateEMA(prices, period) {
        if (prices.length < period) {
            throw new Error(`Insufficient data for EMA calculation: need ${period}, got ${prices.length}`);
        }
        
        const multiplier = 2 / (period + 1);
        
        // Start with SMA for the first value
        let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
        
        // Calculate EMA for remaining values
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }
    
    generateSignal(fastMA, slowMA, prevFastMA, prevSlowMA, currentPrice) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let crossover = null;
        let trend = "sideways";
        
        // Detect crossovers
        const bullishCrossover = prevFastMA <= prevSlowMA && fastMA > slowMA;
        const bearishCrossover = prevFastMA >= prevSlowMA && fastMA < slowMA;
        
        // Calculate percentage difference between MAs
        const spread = Math.abs(fastMA - slowMA);
        const spreadPercent = (spread / slowMA) * 100;
        
        // Determine overall trend
        if (fastMA > slowMA) {
            trend = "uptrend";
        } else if (fastMA < slowMA) {
            trend = "downtrend";
        } else {
            trend = "sideways";
        }
        
        // Generate signals based on crossovers
        if (bullishCrossover) {
            suggestion = "buy";
            crossover = "golden_cross";
            confidence = Math.min(1, spreadPercent / 2); // Higher spread = higher confidence
            strength = confidence;
            interpretation = `Golden Cross: Fast MA (${this.fastPeriod}) crossed above Slow MA (${this.slowPeriod}) - bullish signal`;
        }
        else if (bearishCrossover) {
            suggestion = "sell";
            crossover = "death_cross";
            confidence = Math.min(1, spreadPercent / 2);
            strength = confidence;
            interpretation = `Death Cross: Fast MA (${this.fastPeriod}) crossed below Slow MA (${this.slowPeriod}) - bearish signal`;
        }
        // Trend continuation signals (weaker than crossovers)
        else if (fastMA > slowMA && spreadPercent > 1) {
            suggestion = "buy";
            confidence = Math.min(0.6, spreadPercent / 5); // Lower confidence for trend continuation
            strength = confidence * 0.7;
            interpretation = `Strong uptrend: Fast MA ${spreadPercent.toFixed(2)}% above Slow MA`;
        }
        else if (fastMA < slowMA && spreadPercent > 1) {
            suggestion = "sell";
            confidence = Math.min(0.6, spreadPercent / 5);
            strength = confidence * 0.7;
            interpretation = `Strong downtrend: Fast MA ${spreadPercent.toFixed(2)}% below Slow MA`;
        }
        // Price vs MA signals
        else if (currentPrice > fastMA && fastMA > slowMA) {
            suggestion = "hold"; // Positive momentum but no strong signal
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Price above both MAs - bullish bias but no clear entry`;
        }
        else if (currentPrice < fastMA && fastMA < slowMA) {
            suggestion = "hold"; // Negative momentum but no strong signal
            confidence = 0.2;
            strength = 0.1;
            interpretation = `Price below both MAs - bearish bias but no clear entry`;
        }
        else {
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation = `No clear MA signal - MAs too close (${spreadPercent.toFixed(2)}% spread)`;
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation,
            crossover,
            trend
        };
    }
    
    // Calculate historical moving averages (useful for charting)
    calculateHistory(prices, outputLength = 50) {
        if (prices.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for MA history. Need ${this.minDataPoints + outputLength}, have ${prices.length}`);
        }
        
        const maHistory = [];
        
        for (let i = this.slowPeriod; i <= Math.min(prices.length, this.slowPeriod + outputLength); i++) {
            const subset = prices.slice(0, i);
            try {
                const fastMA = this.calculateSMA(subset, this.fastPeriod);
                const slowMA = this.calculateSMA(subset, this.slowPeriod);
                
                maHistory.push({
                    fastMA,
                    slowMA,
                    spread: fastMA - slowMA,
                    timestamp: Date.now() - ((this.slowPeriod + outputLength - i) * 300000) // Approximate
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return maHistory;
    }
    
    // Helper methods for different MA types
    static calculateMultipleMA(prices, periods, type = 'SMA') {
        const results = {};
        
        periods.forEach(period => {
            try {
                if (type === 'SMA') {
                    const ma = new MovingAverage(period, period);
                    results[`MA${period}`] = ma.calculateSMA(prices, period);
                } else if (type === 'EMA') {
                    const ma = new MovingAverage(period, period);
                    results[`EMA${period}`] = ma.calculateEMA(prices, period);
                }
            } catch (error) {
                results[`${type}${period}`] = null;
            }
        });
        
        return results;
    }
    
    // Helper to interpret trend strength
    static interpretTrend(fastMA, slowMA) {
        const spreadPercent = Math.abs(fastMA - slowMA) / Math.max(fastMA, slowMA) * 100;
        
        if (spreadPercent > 5) return "Very Strong";
        if (spreadPercent > 2) return "Strong";
        if (spreadPercent > 1) return "Moderate";
        if (spreadPercent > 0.5) return "Weak";
        return "Very Weak";
    }
}

module.exports = MovingAverage;