const { DataValidator } = require('../../../data/validators');
const { Logger } = require('../../../utils');

class ADX {
    constructor(period = 14) {
        this.period = period;
        this.name = 'ADX';
        this.minDataPoints = this.period * 2; // Need extra data for smoothing
    }
    
    calculate(highs, lows, closes) {
        try {
            // Validate input
            if (!DataValidator.validateArray(highs, this.minDataPoints) || 
                !DataValidator.validateArray(lows, this.minDataPoints) ||
                !DataValidator.validateArray(closes, this.minDataPoints)) {
                throw new Error(`ADX validation failed: need at least ${this.minDataPoints} valid values`);
            }
            
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error('Highs, lows, and closes arrays must have the same length');
            }
            
            // Step 1: Calculate True Range (TR)
            const trueRanges = this.calculateTrueRange(highs, lows, closes);
            
            // Step 2: Calculate Directional Movement (+DM and -DM)
            const { plusDM, minusDM } = this.calculateDirectionalMovement(highs, lows);
            
            // Step 3: Calculate smoothed averages using Wilder's smoothing
            const smoothedTR = this.wilderSmoothing(trueRanges, this.period);
            const smoothedPlusDM = this.wilderSmoothing(plusDM, this.period);
            const smoothedMinusDM = this.wilderSmoothing(minusDM, this.period);
            
            // Step 4: Calculate +DI and -DI
            const plusDI = (smoothedPlusDM / smoothedTR) * 100;
            const minusDI = (smoothedMinusDM / smoothedTR) * 100;
            
            // Step 5: Calculate DX (Directional Movement Index)
            const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
            
            // Step 6: Calculate ADX (we need historical DX values for smoothing)
            const dxHistory = this.calculateDXHistory(highs, lows, closes);
            const adx = this.wilderSmoothing(dxHistory, this.period);
            
            // Validate final values
            if (!Number.isFinite(adx) || !Number.isFinite(plusDI) || !Number.isFinite(minusDI)) {
                throw new Error('Invalid ADX calculation result');
            }
            
            // Generate trading signal
            const signal = this.generateSignal(adx, plusDI, minusDI, dxHistory);
            
            Logger.debug('ADX calculated', {
                adx: adx.toFixed(2),
                plusDI: plusDI.toFixed(2),
                minusDI: minusDI.toFixed(2),
                suggestion: signal.suggestion
            });
            
            return {
                adx: Number(adx.toFixed(2)),
                plusDI: Number(plusDI.toFixed(2)),
                minusDI: Number(minusDI.toFixed(2)),
                dx: Number(dx.toFixed(2)),
                suggestion: signal.suggestion,
                confidence: Number(signal.confidence.toFixed(4)),
                strength: Number(signal.strength.toFixed(4)),
                metadata: {
                    period: this.period,
                    interpretation: signal.interpretation,
                    trendStrength: signal.trendStrength,
                    trendDirection: signal.trendDirection
                }
            };
            
        } catch (error) {
            Logger.error('ADX calculation error', { error: error.message });
            throw error;
        }
    }
    
    calculateTrueRange(highs, lows, closes) {
        const trueRanges = [];
        
        for (let i = 1; i < highs.length; i++) {
            const currentHigh = highs[i];
            const currentLow = lows[i];
            const previousClose = closes[i - 1];
            
            const tr1 = currentHigh - currentLow;
            const tr2 = Math.abs(currentHigh - previousClose);
            const tr3 = Math.abs(currentLow - previousClose);
            
            const trueRange = Math.max(tr1, tr2, tr3);
            trueRanges.push(trueRange);
        }
        
        return trueRanges;
    }
    
    calculateDirectionalMovement(highs, lows) {
        const plusDM = [];
        const minusDM = [];
        
        for (let i = 1; i < highs.length; i++) {
            const upMove = highs[i] - highs[i - 1];
            const downMove = lows[i - 1] - lows[i];
            
            let plusDMValue = 0;
            let minusDMValue = 0;
            
            if (upMove > downMove && upMove > 0) {
                plusDMValue = upMove;
            }
            if (downMove > upMove && downMove > 0) {
                minusDMValue = downMove;
            }
            
            plusDM.push(plusDMValue);
            minusDM.push(minusDMValue);
        }
        
        return { plusDM, minusDM };
    }
    
    wilderSmoothing(data, period) {
        if (data.length < period) {
            throw new Error(`Insufficient data for Wilder smoothing: need ${period}, got ${data.length}`);
        }
        
        // First value is simple average
        let smoothed = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        
        // Apply Wilder's smoothing formula for subsequent values
        for (let i = period; i < data.length; i++) {
            smoothed = (smoothed * (period - 1) + data[i]) / period;
        }
        
        return smoothed;
    }
    
    calculateDXHistory(highs, lows, closes) {
        const dxHistory = [];
        
        // Calculate DX for each possible period
        for (let i = this.period + 1; i <= highs.length; i++) {
            const highsSlice = highs.slice(0, i);
            const lowsSlice = lows.slice(0, i);
            const closesSlice = closes.slice(0, i);
            
            try {
                const trueRanges = this.calculateTrueRange(highsSlice, lowsSlice, closesSlice);
                const { plusDM, minusDM } = this.calculateDirectionalMovement(highsSlice, lowsSlice);
                
                if (trueRanges.length >= this.period && plusDM.length >= this.period) {
                    const smoothedTR = this.wilderSmoothing(trueRanges, this.period);
                    const smoothedPlusDM = this.wilderSmoothing(plusDM, this.period);
                    const smoothedMinusDM = this.wilderSmoothing(minusDM, this.period);
                    
                    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
                    const minusDI = (smoothedMinusDM / smoothedTR) * 100;
                    
                    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
                    
                    if (Number.isFinite(dx)) {
                        dxHistory.push(dx);
                    }
                }
            } catch (error) {
                // Skip invalid calculations
                continue;
            }
        }
        
        return dxHistory;
    }
    
    generateSignal(adx, plusDI, minusDI, dxHistory) {
        let suggestion = "hold";
        let confidence = 0;
        let strength = 0;
        let interpretation = "";
        let trendStrength = "";
        let trendDirection = "neutral";
        
        // Determine trend strength based on ADX value
        if (adx < 20) {
            trendStrength = "No Trend";
            interpretation = `Weak or no trend (ADX: ${adx}) - market is ranging. `;
        } else if (adx < 25) {
            trendStrength = "Emerging Trend";
            interpretation = `Emerging trend (ADX: ${adx}) - trend is developing. `;
        } else if (adx < 40) {
            trendStrength = "Strong Trend";
            interpretation = `Strong trend confirmed (ADX: ${adx}). `;
        } else if (adx < 50) {
            trendStrength = "Very Strong Trend";
            interpretation = `Very strong trend (ADX: ${adx}) - high momentum. `;
        } else {
            trendStrength = "Extremely Strong Trend";
            interpretation = `Extremely strong trend (ADX: ${adx}) - rare power trend. `;
        }
        
        // Determine trend direction
        if (plusDI > minusDI) {
            trendDirection = "uptrend";
        } else if (minusDI > plusDI) {
            trendDirection = "downtrend";
        }
        
        // Generate trading signals
        if (adx >= 25) { // Only trade when trend is confirmed
            const diDifference = Math.abs(plusDI - minusDI);
            
            if (plusDI > minusDI) {
                suggestion = "buy";
                confidence = Math.min(1, (adx / 50) * (diDifference / 20));
                strength = confidence;
                interpretation += `+DI (${plusDI.toFixed(1)}) > -DI (${minusDI.toFixed(1)}) with strong trend - buy signal.`;
            } else if (minusDI > plusDI) {
                suggestion = "sell";
                confidence = Math.min(1, (adx / 50) * (diDifference / 20));
                strength = confidence;
                interpretation += `-DI (${minusDI.toFixed(1)}) > +DI (${plusDI.toFixed(1)}) with strong trend - sell signal.`;
            } else {
                suggestion = "hold";
                interpretation += "DI lines are close - wait for clearer direction.";
            }
        } else {
            // Weak trend - avoid trading
            suggestion = "hold";
            confidence = 0;
            strength = 0;
            interpretation += "ADX below 25 - avoid trend-following trades, consider range trading.";
        }
        
        // Check for trend changes (rising/falling ADX)
        if (dxHistory.length >= 2) {
            const currentDX = dxHistory[dxHistory.length - 1];
            const previousDX = dxHistory[dxHistory.length - 2];
            
            if (currentDX > previousDX && adx > 20) {
                interpretation += " ADX rising - trend strengthening.";
                confidence *= 1.1; // Slight boost for strengthening trend
            } else if (currentDX < previousDX && adx > 25) {
                interpretation += " ADX falling - trend weakening.";
                confidence *= 0.9; // Slight reduction for weakening trend
            }
        }
        
        // Cap confidence at 1.0
        confidence = Math.min(confidence, 1.0);
        
        return {
            suggestion,
            confidence,
            strength,
            interpretation: interpretation.trim(),
            trendStrength,
            trendDirection
        };
    }
    
    // Helper method to calculate ADX crossover signals
    calculateCrossoverSignals(highs, lows, closes, outputLength = 50) {
        if (highs.length < this.minDataPoints + outputLength) {
            throw new Error(`Insufficient data for ADX crossover analysis. Need ${this.minDataPoints + outputLength}, have ${highs.length}`);
        }
        
        const signals = [];
        
        for (let i = this.minDataPoints; i <= Math.min(highs.length, this.minDataPoints + outputLength); i++) {
            const highsSlice = highs.slice(0, i);
            const lowsSlice = lows.slice(0, i);
            const closesSlice = closes.slice(0, i);
            
            try {
                const result = this.calculate(highsSlice, lowsSlice, closesSlice);
                signals.push({
                    adx: result.adx,
                    plusDI: result.plusDI,
                    minusDI: result.minusDI,
                    suggestion: result.suggestion,
                    timestamp: Date.now() - ((this.minDataPoints + outputLength - i) * 300000)
                });
            } catch (error) {
                // Skip if calculation fails
                continue;
            }
        }
        
        return signals;
    }
    
    // Helper method to interpret ADX values
    static interpretADX(adxValue) {
        if (adxValue < 20) return "No Trend / Ranging Market";
        if (adxValue < 25) return "Emerging Trend";
        if (adxValue < 40) return "Strong Trend";
        if (adxValue < 50) return "Very Strong Trend";
        return "Extremely Strong Trend (Power Trend)";
    }
    
    // Helper method to get trend direction from DI values
    static getTrendDirection(plusDI, minusDI) {
        if (plusDI > minusDI) return "Uptrend";
        if (minusDI > plusDI) return "Downtrend";
        return "Neutral";
    }
}

module.exports = ADX;