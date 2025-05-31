const RSI = require('./indicators/RSI');
const MACD = require('./indicators/MACD');
const BollingerBands = require('./indicators/BollingerBands');
const MovingAverage = require('./indicators/MovingAverage');
const Volume = require('./indicators/Volume');
const Stochastic = require('./indicators/Stochastic');
const WilliamsR = require('./indicators/WilliamsR');
const IchimokuCloud = require('./indicators/IchimokuCloud');
const ADX = require('./indicators/ADX');
const CCI = require('./indicators/CCI');
const ParabolicSAR = require('./indicators/ParabolicSAR');
const { Logger } = require('../../utils');
const { DataValidator } = require('../../data/validators');

class TechnicalStrategies {
    constructor() {
        this.indicators = {
            rsi: new RSI(14),
            macd: new MACD(12, 26, 9),
            bollinger: new BollingerBands(20, 2),
            ma: new MovingAverage(10, 21),
            volume: new Volume(20),
            stochastic: new Stochastic(14, 3),
            williamsR: new WilliamsR(14),
            ichimoku: new IchimokuCloud(9, 26, 52, 26),
            adx: new ADX(14),
            cci: new CCI(20),
            parabolicSAR: new ParabolicSAR(0.02, 0.2, 0.02)
        };
        
        Logger.debug('TechnicalStrategies initialized with indicators:', 
            Object.keys(this.indicators));
    }
    
    // Calculate RSI for given data
    calculateRSI(data, period = 14) {
        try {
            if (!data || !data.closes || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: closes array required');
            }
            
            const rsi = new RSI(period);
            return rsi.calculate(data.closes);
            
        } catch (error) {
            Logger.error('RSI calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                value: 50, // Neutral value
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    interpretation: 'Calculation failed'
                }
            };
        }
    }
    
    // Calculate MACD for given data
    calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        try {
            if (!data || !data.closes || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: closes array required');
            }
            
            const macd = new MACD(fastPeriod, slowPeriod, signalPeriod);
            return macd.calculate(data.closes);
            
        } catch (error) {
            Logger.error('MACD calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                macdLine: 0,
                signalLine: 0,
                histogram: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    fastPeriod,
                    slowPeriod,
                    signalPeriod,
                    interpretation: 'Calculation failed'
                }
            };
        }
    }
    
    // Calculate Bollinger Bands for given data
    calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
        try {
            if (!data || !data.closes || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: closes array required');
            }
            
            const bollinger = new BollingerBands(period, stdDevMultiplier);
            return bollinger.calculate(data.closes);
            
        } catch (error) {
            Logger.error('Bollinger Bands calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                upperBand: 0,
                middleBand: 0,
                lowerBand: 0,
                currentPrice: 0,
                bandwidth: 0,
                percentB: 0.5,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    stdDevMultiplier,
                    interpretation: 'Calculation failed'
                }
            };
        }
    }
    
    // Calculate Moving Average Crossover for given data
    calculateMovingAverage(data, fastPeriod = 10, slowPeriod = 21) {
        try {
            if (!data || !data.closes || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: closes array required');
            }
            
            const ma = new MovingAverage(fastPeriod, slowPeriod);
            return ma.calculate(data.closes);
            
        } catch (error) {
            Logger.error('Moving Average calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                fastMA: 0,
                slowMA: 0,
                currentPrice: 0,
                spread: 0,
                spreadPercent: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    fastPeriod,
                    slowPeriod,
                    interpretation: 'Calculation failed',
                    trend: 'unknown'
                }
            };
        }
    }
    
    // Calculate Volume Analysis for given data
    calculateVolume(data, period = 20) {
        try {
            if (!data || !data.closes || !data.volumes || 
                !Array.isArray(data.closes) || !Array.isArray(data.volumes)) {
                throw new Error('Invalid data format: closes and volumes arrays required');
            }
            
            const volume = new Volume(period);
            return volume.calculate(data.closes, data.volumes);
            
        } catch (error) {
            Logger.error('Volume calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0,
                volumeLength: data?.volumes?.length || 0
            });
            
            return {
                currentVolume: 0,
                avgVolume: 0,
                volumeRatio: 1,
                priceChange: 0,
                priceChangePercent: 0,
                volumeTrend: 'neutral',
                obv: 0,
                vpt: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    interpretation: 'Calculation failed',
                    volumeSpike: false,
                    confirmationStrength: 'weak'
                }
            };
        }
    }

    // Calculate Stochastic for given data
    calculateStochastic(data, kPeriod = 14, dPeriod = 3) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const stochastic = new Stochastic(kPeriod, dPeriod);
            return stochastic.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('Stochastic calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                k: 50,
                d: 50,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    kPeriod,
                    dPeriod,
                    interpretation: 'Calculation failed',
                    crossover: null
                }
            };
        }
    }

    // Calculate Williams %R for given data
    calculateWilliamsR(data, period = 14) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const williamsR = new WilliamsR(period);
            return williamsR.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('Williams %R calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                value: -50,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    interpretation: 'Calculation failed',
                    level: 'Unknown'
                }
            };
        }
    }

    // Calculate Ichimoku Cloud for given data
    calculateIchimokuCloud(data, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52, chikouPeriod = 26) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const ichimoku = new IchimokuCloud(tenkanPeriod, kijunPeriod, senkouBPeriod, chikouPeriod);
            return ichimoku.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('Ichimoku Cloud calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                tenkanSen: 0,
                kijunSen: 0,
                senkouSpanA: 0,
                senkouSpanB: 0,
                chikouSpan: 0,
                cloudTop: 0,
                cloudBottom: 0,
                cloudThickness: 0,
                cloudColor: 'neutral',
                currentPrice: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    tenkanPeriod,
                    kijunPeriod,
                    senkouBPeriod,
                    chikouPeriod,
                    interpretation: 'Calculation failed',
                    trend: 'unknown',
                    signals: []
                }
            };
        }
    }

    // Calculate ADX for given data
    calculateADX(data, period = 14) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const adx = new ADX(period);
            return adx.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('ADX calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                adx: 0,
                plusDI: 0,
                minusDI: 0,
                dx: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    interpretation: 'Calculation failed',
                    trendStrength: 'Unknown',
                    trendDirection: 'neutral'
                }
            };
        }
    }

    // Calculate CCI for given data
    calculateCCI(data, period = 20) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const cci = new CCI(period);
            return cci.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('CCI calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                cci: 0,
                typicalPrice: 0,
                smaTP: 0,
                meanDeviation: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    period,
                    factor: 0.015,
                    interpretation: 'Calculation failed',
                    level: 'Unknown',
                    divergence: null
                }
            };
        }
    }

    // Calculate Parabolic SAR for given data
    calculateParabolicSAR(data, initialAF = 0.02, maxAF = 0.2, afIncrement = 0.02) {
        try {
            if (!data || !data.highs || !data.lows || !data.closes ||
                !Array.isArray(data.highs) || !Array.isArray(data.lows) || !Array.isArray(data.closes)) {
                throw new Error('Invalid data format: highs, lows, and closes arrays required');
            }
            
            const parabolicSAR = new ParabolicSAR(initialAF, maxAF, afIncrement);
            return parabolicSAR.calculate(data.highs, data.lows, data.closes);
            
        } catch (error) {
            Logger.error('Parabolic SAR calculation failed', { 
                error: error.message,
                dataLength: data?.closes?.length || 0
            });
            
            return {
                sar: 0,
                trend: 'uptrend',
                af: initialAF,
                ep: 0,
                currentPrice: 0,
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message,
                metadata: {
                    initialAF,
                    maxAF,
                    afIncrement,
                    interpretation: 'Calculation failed',
                    reversal: false,
                    trendStrength: 'Unknown'
                }
            };
        }
    }
    
    // Calculate all available strategies for given data
    calculateAll(data) {
        const results = {};
        
        Logger.debug('Calculating all technical strategies', {
            dataPoints: data?.closes?.length || 0,
            indicators: Object.keys(this.indicators)
        });
        
        // RSI
        try {
            results.rsi = this.calculateRSI(data);
            Logger.debug('RSI calculated successfully', { 
                value: results.rsi.value,
                suggestion: results.rsi.suggestion 
            });
        } catch (error) {
            Logger.error('RSI calculation error', { error: error.message });
            results.rsi = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }
        
        // MACD
        try {
            results.macd = this.calculateMACD(data);
            Logger.debug('MACD calculated successfully', { 
                macdLine: results.macd.macdLine,
                suggestion: results.macd.suggestion 
            });
        } catch (error) {
            Logger.error('MACD calculation error', { error: error.message });
            results.macd = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }
        
        // Bollinger Bands
        try {
            results.bollinger = this.calculateBollingerBands(data);
            Logger.debug('Bollinger Bands calculated successfully', { 
                percentB: results.bollinger.percentB,
                suggestion: results.bollinger.suggestion 
            });
        } catch (error) {
            Logger.error('Bollinger Bands calculation error', { error: error.message });
            results.bollinger = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }
        
        // Moving Average Crossover
        try {
            results.ma = this.calculateMovingAverage(data);
            Logger.debug('Moving Average calculated successfully', { 
                fastMA: results.ma.fastMA,
                slowMA: results.ma.slowMA,
                suggestion: results.ma.suggestion 
            });
        } catch (error) {
            Logger.error('Moving Average calculation error', { error: error.message });
            results.ma = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }
        
        // Volume Analysis
        try {
            results.volume = this.calculateVolume(data);
            Logger.debug('Volume calculated successfully', { 
                volumeRatio: results.volume.volumeRatio,
                suggestion: results.volume.suggestion 
            });
        } catch (error) {
            Logger.error('Volume calculation error', { error: error.message });
            results.volume = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // Stochastic
        try {
            results.stochastic = this.calculateStochastic(data);
            Logger.debug('Stochastic calculated successfully', { 
                k: results.stochastic.k,
                d: results.stochastic.d,
                suggestion: results.stochastic.suggestion 
            });
        } catch (error) {
            Logger.error('Stochastic calculation error', { error: error.message });
            results.stochastic = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // Williams %R
        try {
            results.williamsR = this.calculateWilliamsR(data);
            Logger.debug('Williams %R calculated successfully', { 
                value: results.williamsR.value,
                level: results.williamsR.metadata?.level,
                suggestion: results.williamsR.suggestion 
            });
        } catch (error) {
            Logger.error('Williams %R calculation error', { error: error.message });
            results.williamsR = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // Ichimoku Cloud
        try {
            results.ichimoku = this.calculateIchimokuCloud(data);
            Logger.debug('Ichimoku Cloud calculated successfully', { 
                cloudColor: results.ichimoku.cloudColor,
                trend: results.ichimoku.metadata?.trend,
                suggestion: results.ichimoku.suggestion 
            });
        } catch (error) {
            Logger.error('Ichimoku Cloud calculation error', { error: error.message });
            results.ichimoku = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // ADX
        try {
            results.adx = this.calculateADX(data);
            Logger.debug('ADX calculated successfully', { 
                adx: results.adx.adx,
                plusDI: results.adx.plusDI,
                minusDI: results.adx.minusDI,
                trendStrength: results.adx.metadata?.trendStrength,
                suggestion: results.adx.suggestion 
            });
        } catch (error) {
            Logger.error('ADX calculation error', { error: error.message });
            results.adx = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // CCI
        try {
            results.cci = this.calculateCCI(data);
            Logger.debug('CCI calculated successfully', { 
                cci: results.cci.cci,
                level: results.cci.metadata?.level,
                suggestion: results.cci.suggestion 
            });
        } catch (error) {
            Logger.error('CCI calculation error', { error: error.message });
            results.cci = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }

        // Parabolic SAR
        try {
            results.parabolicSAR = this.calculateParabolicSAR(data);
            Logger.debug('Parabolic SAR calculated successfully', { 
                sar: results.parabolicSAR.sar,
                trend: results.parabolicSAR.trend,
                reversal: results.parabolicSAR.metadata?.reversal,
                suggestion: results.parabolicSAR.suggestion 
            });
        } catch (error) {
            Logger.error('Parabolic SAR calculation error', { error: error.message });
            results.parabolicSAR = {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                error: error.message
            };
        }
        
        return results;
    }
    
    // Get ensemble signal from all strategies
    getEnsembleSignal(data) {
        const strategies = this.calculateAll(data);
        
        let buyScore = 0;
        let sellScore = 0;
        let holdScore = 0;
        let totalConfidence = 0;
        let validStrategies = 0;
        
        // Weight and combine all strategy signals
        for (const [strategyName, result] of Object.entries(strategies)) {
            if (result.error) {
                Logger.warn(`Skipping ${strategyName} due to error: ${result.error}`);
                continue;
            }
            
            const confidence = result.confidence || 0;
            const weight = this.getStrategyWeight(strategyName);
            
            if (result.suggestion === 'buy') {
                buyScore += confidence * weight;
            } else if (result.suggestion === 'sell') {
                sellScore += confidence * weight;
            } else {
                holdScore += weight; // Hold gets base weight
            }
            
            totalConfidence += confidence * weight;
            validStrategies++;
        }
        
        if (validStrategies === 0) {
            return {
                suggestion: 'hold',
                confidence: 0,
                strength: 0,
                strategies,
                metadata: {
                    validStrategies: 0,
                    interpretation: 'No valid strategies available'
                }
            };
        }
        
        // Determine final signal
        const maxScore = Math.max(buyScore, sellScore, holdScore);
        let finalSuggestion = 'hold';
        
        if (maxScore === buyScore && buyScore > 0) {
            finalSuggestion = 'buy';
        } else if (maxScore === sellScore && sellScore > 0) {
            finalSuggestion = 'sell';
        }
        
        const normalizedConfidence = totalConfidence / validStrategies;
        
        return {
            suggestion: finalSuggestion,
            confidence: Number(normalizedConfidence.toFixed(4)),
            strength: Number(normalizedConfidence.toFixed(4)),
            strategies,
            metadata: {
                buyScore: Number(buyScore.toFixed(4)),
                sellScore: Number(sellScore.toFixed(4)),
                holdScore: Number(holdScore.toFixed(4)),
                validStrategies,
                interpretation: `Combined signal from ${validStrategies} strategies`
            }
        };
    }
    
    // Get weight for each strategy (can be customized later)
    getStrategyWeight(strategyName) {
        const weights = {
            rsi: 1.0,
            macd: 1.2,
            bollinger: 1.0,
            ma: 1.1, // Moving averages are reliable trend indicators
            volume: 1.3, // Volume is very important for confirmation
            stochastic: 1.0,
            williamsR: 0.9,
            ichimoku: 1.5, // Ichimoku is comprehensive and gets higher weight
            adx: 1.4, // ADX is excellent for trend strength confirmation
            cci: 1.1, // CCI is good for momentum and reversal detection
            parabolicSAR: 1.2, // Parabolic SAR is excellent for trend following
        };
        
        return weights[strategyName] || 1.0;
    }
    
    // Check if we have enough data for analysis
    hasEnoughData(data, minDataPoints = 52) {
        return data && 
               data.closes && 
               Array.isArray(data.closes) && 
               data.closes.length >= minDataPoints &&
               DataValidator.validateArray(data.closes, minDataPoints);
    }
    
    // Get strategy statistics
    getStats() {
        return {
            availableIndicators: Object.keys(this.indicators),
            indicatorCount: Object.keys(this.indicators).length
        };
    }
}

module.exports = TechnicalStrategies;