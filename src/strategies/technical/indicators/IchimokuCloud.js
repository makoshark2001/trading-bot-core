const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class IchimokuCloud {
    constructor(tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52, chikouPeriod = 26) {
        this.tenkanPeriod = tenkanPeriod;       // Conversion Line
        this.kijunPeriod = kijunPeriod;         // Base Line
        this.senkouBPeriod = senkouBPeriod;     // Leading Span B
        this.chikouPeriod = chikouPeriod;       // Lagging Span
        this.name = 'IchimokuCloud';
        this.minDataPoints = Math.max(tenkanPeriod, kijunPeriod, senkouBPeriod, chikouPeriod) + 1;
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input
            if (!DataValidator.validateArray(highs, this.minDataPoints) || 
                !DataValidator.validateArray(lows, this.minDataPoints) ||
                !DataValidator.validateArray(closes, this.minDataPoints)) {
                throw new Error(`Ichimoku Cloud validation failed: need at least ${this.minDataPoints} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            // Calculate Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
            const tenkanSen = this.calculateMidpoint(highs, lows, this.tenkanPeriod);
            
            // Calculate Kijun-sen (Base Line): (26-period high + 26-period low) / 2
            const kijunSen = this.calculateMidpoint(highs, lows, this.kijunPeriod);
            
            // Calculate Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2, plotted 26 periods ahead
            const senkouSpanA = (tenkanSen + kijunSen) / 2;
            
            // Calculate Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2, plotted 26 periods ahead
            const senkouSpanB = this.calculateMidpoint(highs, lows, this.senkouBPeriod);
            
            // Calculate Chikou Span (Lagging Span): Current close plotted 26 periods back
            const chikouSpan = closes[closes.length - 1];
            
            // Get current price for analysis
            const currentPrice = closes[closes.length - 1];
            
            // Determine cloud color and thickness
            const cloudTop = Math.max(senkouSpanA, senkouSpanB);
            const cloudBottom = Math.min(senkouSpanA, senkouSpanB);
            const cloudThickness = cloudTop - cloudBottom;
            const cloudColor = senkouSpanA > senkouSpanB ? 'bullish' : 'bearish';
            
            // Generate trading signal
            const signal = this.generateSignal(
                currentPrice, tenkanSen, kijunSen, senkouSpanA, senkouSpanB, 
                chikouSpan, cloudTop, cloudBottom, cloudColor, closes
            );
            
            Logger.debug('Ichimoku Cloud calculated', {
                tenkanSen: tenkanSen.toFixed(6),
                kijunSen: kijunSen.toFixed(6),
                cloudColor: cloudColor,
                suggestion: signal.suggestion
            });

            Logger.debug('Ichimoku Cloud debug', {
                senkouSpanA: senkouSpanA.toFixed(6),
                senkouSpanB: senkouSpanB.toFixed(6),
                cloudColor: cloudColor,
                currentPrice: currentPrice.toFixed(6),
                cloudTop: cloudTop.toFixed(6),
                cloudBottom: cloudBottom.toFixed(6)
            });
            
            return {
                tenkanSen: Number(tenkanSen.toFixed(6)),
                kijunSen: Number(kijunSen.toFixed(6)),
                senkouSpanA: Number(senkouSpanA.toFixed(6)),
                senkouSpanB: Number(senkouSpanB.toFixed(6)),
                chikouSpan: Number(chikouSpan.toFixed(6)),
                cloudTop: Number(cloudTop.toFixed(6)),
                cloudBottom: Number(cloudBottom.toFixed(6)),
                cloudThickness: Number(cloudThickness.toFixed(6)),
                cloudColor: cloudColor,
                currentPrice: Number(currentPrice.toFixed(6)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    tenkanPeriod: this.tenkanPeriod,
                    kijunPeriod: this.kijunPeriod,
                    senkouBPeriod: this.senkouBPeriod,
                    chikouPeriod: this.chikouPeriod,
                    interpretation: signal.interpretation,
                    trend: signal.trend,
                    signals: signal.signals
                }
            };
            
        } catch (error) {
            Logger.error('Ichimoku Cloud calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateMidpoint(highs, lows, period) {
        if (highs.length < period || lows.length < period) {
            throw new Error(`Insufficient data for ${period}-period midpoint calculation`);
        }
        
        const recentHighs = highs.slice(-period);
        const recentLows = lows.slice(-period);
        
        const highest = Math.max(...recentHighs);
        const lowest = Math.min(...recentLows);
        
        return (highest + lowest) / 2;
    }
    
    generateSignal(currentPrice, tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan, cloudTop, cloudBottom, cloudColor, closes) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let trend = "neutral";
        let signals = [];
        
        // Determine overall trend based on cloud
        if (cloudColor === 'bullish') {
            trend = currentPrice > cloudTop ? "strong_uptrend" : 
                   currentPrice > cloudBottom ? "uptrend" : "neutral";
        } else {
            trend = currentPrice < cloudBottom ? "strong_downtrend" : 
                   currentPrice < cloudTop ? "downtrend" : "neutral";
        }
        
        // Signal 1: Price vs Cloud position
        if (currentPrice > cloudTop) {
            signals.push("price_above_cloud");
            if (cloudColor === 'bullish') {
                suggestion = "buy";
                confidence += 0.4;
                interpretation += "Price above bullish cloud - strong uptrend. ";
            } else {
                suggestion = "buy";
                confidence += 0.2;
                interpretation += "Price above bearish cloud - potential reversal. ";
            }
        } else if (currentPrice < cloudBottom) {
            signals.push("price_below_cloud");
            if (cloudColor === 'bearish') {
                suggestion = "sell";
                confidence += 0.4;
                interpretation += "Price below bearish cloud - strong downtrend. ";
            } else {
                suggestion = "sell";
                confidence += 0.2;
                interpretation += "Price below bullish cloud - potential reversal. ";
            }
        } else {
            signals.push("price_in_cloud");
            suggestion = "hold";
            interpretation += "Price inside cloud - consolidation/uncertainty. ";
        }
        
        // Signal 2: Tenkan-sen vs Kijun-sen crossover
        if (tenkanSen > kijunSen) {
            signals.push("tenkan_above_kijun");
            if (currentPrice > Math.max(tenkanSen, kijunSen)) {
                confidence += 0.2;
                interpretation += "Conversion line above Base line with price above both - bullish momentum. ";
            }
        } else if (tenkanSen < kijunSen) {
            signals.push("tenkan_below_kijun");
            if (currentPrice < Math.min(tenkanSen, kijunSen)) {
                confidence += 0.2;
                interpretation += "Conversion line below Base line with price below both - bearish momentum. ";
            }
        }
        
        // Signal 3: Price vs Tenkan-sen and Kijun-sen
        if (currentPrice > tenkanSen && currentPrice > kijunSen) {
            signals.push("price_above_lines");
            confidence += 0.1;
        } else if (currentPrice < tenkanSen && currentPrice < kijunSen) {
            signals.push("price_below_lines");
            confidence += 0.1;
        }
        
        // Signal 4: Chikou Span (Lagging Span) confirmation
        if (closes.length >= this.chikouPeriod) {
            const chikouReference = closes[closes.length - this.chikouPeriod];
            if (chikouSpan > chikouReference) {
                signals.push("chikou_bullish");
                confidence += 0.15;
                interpretation += "Lagging span above historical price - bullish confirmation. ";
            } else if (chikouSpan < chikouReference) {
                signals.push("chikou_bearish");
                confidence += 0.15;
                interpretation += "Lagging span below historical price - bearish confirmation. ";
            }
        }
        
        // Signal 5: Cloud thickness (volatility/strength indicator)
        const priceRange = cloudTop - cloudBottom;
        const thicknessRatio = priceRange / currentPrice;
        
        if (thicknessRatio > 0.02) { // Thick cloud = strong trend
            confidence += 0.1;
            signals.push("thick_cloud");
            interpretation += "Thick cloud indicates strong trend. ";
        } else if (thicknessRatio < 0.005) { // Thin cloud = weak trend
            confidence *= 0.8; // Reduce confidence
            signals.push("thin_cloud");
            interpretation += "Thin cloud indicates weak trend. ";
        }
        
        // Ensure confidence doesn't exceed 1.0
        confidence = Math.min(confidence, 1.0);
        strength = confidence;
        
        // Adjust suggestion based on overall signal strength
        if (confidence < 0.3) {
            suggestion = "hold";
            interpretation += "Low confidence - recommend waiting for clearer signals.";
        }
        
        // Final trend determination
        if (signals.includes("price_above_cloud") && cloudColor === 'bullish' && signals.includes("tenkan_above_kijun")) {
            trend = "strong_uptrend";
        } else if (signals.includes("price_below_cloud") && cloudColor === 'bearish' && signals.includes("tenkan_below_kijun")) {
            trend = "strong_downtrend";
        } else if (signals.includes("price_in_cloud")) {
            trend = "consolidation";
        }
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation: interpretation.trim(),
            trend,
            signals
        };
    }
    
    // Helper method to calculate historical Ichimoku values (useful for charting)
    calculateHistory(highs, lows, closes, outputLength = 50) {
        if (highs.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for Ichimoku history. Need ${this.minDataPoints + outputLength}, have ${highs.length}`);
        }
        
        const ichimokuHistory = [];
        
        for (let i = this.minDataPoints; i <= Math.min(highs.length, this.minDataPoints + outputLength); i++) {
            const highsSlice = highs.slice(0, i);
            const lowsSlice = lows.slice(0, i);
            const closesSlice = closes.slice(0, i);
            
            try {
                const result = this.calculate(highsSlice, lowsSlice, closesSlice);
                ichimokuHistory.push({
                    tenkanSen: result.tenkanSen,
                    kijunSen: result.kijunSen,
                    senkouSpanA: result.senkouSpanA,
                    senkouSpanB: result.senkouSpanB,
                    cloudColor: result.cloudColor,
                    timestamp: Date.now() - ((this.minDataPoints + outputLength - i) * 300000) // Approximate
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return ichimokuHistory;
    }
    
    // Helper method to interpret Ichimoku signals
    static interpretSignals(signals, trend) {
        const interpretations = {
            price_above_cloud: "Bullish - Price trading above the cloud",
            price_below_cloud: "Bearish - Price trading below the cloud", 
            price_in_cloud: "Neutral - Price consolidating within the cloud",
            tenkan_above_kijun: "Bullish momentum - Conversion line above Base line",
            tenkan_below_kijun: "Bearish momentum - Conversion line below Base line",
            price_above_lines: "Bullish - Price above both Tenkan and Kijun lines",
            price_below_lines: "Bearish - Price below both Tenkan and Kijun lines",
            chikou_bullish: "Bullish confirmation from Lagging Span",
            chikou_bearish: "Bearish confirmation from Lagging Span",
            thick_cloud: "Strong trend - Thick cloud provides strong support/resistance",
            thin_cloud: "Weak trend - Thin cloud indicates indecision"
        };
        
        return signals.map(signal => interpretations[signal] || signal);
    }
    
    // Helper method to determine trend strength
    static getTrendStrength(trend, confidence) {
        if (trend.includes('strong') && confidence > 0.7) return "Very Strong";
        if (trend.includes('strong') && confidence > 0.5) return "Strong";
        if (!trend.includes('neutral') && confidence > 0.4) return "Moderate";
        if (!trend.includes('neutral') && confidence > 0.2) return "Weak";
        return "Very Weak";
    }
}

module.exports = IchimokuCloud;