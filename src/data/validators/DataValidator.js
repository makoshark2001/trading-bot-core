class DataValidator {
    static isValidNumber(value) {
        return Number.isFinite(value) && 
               !isNaN(value) && 
               value > 0 && 
               value !== Infinity && 
               value !== -Infinity;
    }
    
    static isValidPriceData(data) {
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['close', 'high', 'low', 'volume', 'timestamp'];
        
        for (const field of requiredFields) {
            if (!(field in data)) return false;
            
            if (field === 'timestamp') {
                if (!Number.isInteger(data[field]) || data[field] <= 0) return false;
            } else {
                if (!this.isValidNumber(data[field])) return false;
            }
        }
        
        // Logical validation
        if (data.high < data.low || 
            data.close > data.high || 
            data.close < data.low) {
            return false;
        }
        
        return true;
    }
    
    static validateArray(arr, minLength = 1, validator = this.isValidNumber) {
        if (!Array.isArray(arr) || arr.length < minLength) {
            return false;
        }
        return arr.every(validator);
    }
    
    static validatePriceArray(prices, minLength = 1) {
        if (!Array.isArray(prices) || prices.length < minLength) {
            return false;
        }
        
        // Check each price is a valid number
        for (let i = 0; i < prices.length; i++) {
            if (!this.isValidNumber(prices[i])) {
                return false;
            }
        }
        
        return true;
    }
    
    static sanitizeArray(arr, validator = this.isValidNumber) {
        if (!Array.isArray(arr)) return [];
        return arr.filter(validator);
    }
    
    static validateTechnicalInputs(highs, lows, closes, volumes = null) {
        const errors = [];
        
        if (!this.validateArray(highs)) {
            errors.push('Invalid highs array');
        }
        
        if (!this.validateArray(lows)) {
            errors.push('Invalid lows array');
        }
        
        if (!this.validateArray(closes)) {
            errors.push('Invalid closes array');
        }
        
        if (volumes !== null && !this.validateArray(volumes)) {
            errors.push('Invalid volumes array');
        }
        
        // Check array length consistency
        const lengths = [highs?.length, lows?.length, closes?.length];
        if (volumes) lengths.push(volumes.length);
        
        if (new Set(lengths).size > 1) {
            errors.push('Array lengths do not match');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = DataValidator;