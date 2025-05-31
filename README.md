# Trading Bot Core

Core infrastructure for the Advanced Trading Bot system providing data collection, technical analysis, and API services.

## Features

- **Real-time Data Collection**: Xeggex API integration with rate limiting
- **11 Technical Indicators**: Complete technical analysis suite
- **RESTful API**: Clean API endpoints for data access
- **Real-time Processing**: Event-driven data processing
- **Comprehensive Testing**: Full test coverage for all indicators

## Technical Indicators

1. RSI (Relative Strength Index)
2. MACD (Moving Average Convergence Divergence)
3. Bollinger Bands
4. Moving Average Crossover
5. Volume Analysis
6. Stochastic Oscillator
7. Williams %R
8. Ichimoku Cloud
9. ADX (Average Directional Index)
10. CCI (Commodity Channel Index)
11. Parabolic SAR

## Installation

```bash
npm install
cp .env.example .env
# Configure your API keys in .env
npm start