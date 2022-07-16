export function mapLastPriceCandlestick(candlestickData: any): LastPriceCandlestick {
    return {
        openTime: candlestickData[0],
        openPrice: Number(candlestickData[1]),
        high: Number(candlestickData[2]),
        low: Number(candlestickData[3]),
        closePrice: Number(candlestickData[4]),
        volume: Number(candlestickData[5]),
        closeTime: candlestickData[6],
        quoteAssetVolume: Number(candlestickData[7]),
        numberOfTrades: candlestickData[8],
        takerBuyBaseAssetVolume: Number(candlestickData[9]),
        takerBuyQuoteAssetVolume: Number(candlestickData[10])
    };
}

export function mapIndexPriceCandlestick(candlestickData: any): IndexPriceCandlestick {
    return {
        openTime: candlestickData[0],
        openPrice: Number(candlestickData[1]),
        high: Number(candlestickData[2]),
        low: Number(candlestickData[3]),
        closePrice: Number(candlestickData[4]),
        closeTime: candlestickData[6],
        numberOfBasicData: candlestickData[8]
    };
}

export function mapMarkPriceCandlestick(candlestickData: any): MarkPriceCandlestick {
    return {
        openTime: candlestickData[0],
        openPrice: Number(candlestickData[1]),
        high: Number(candlestickData[2]),
        low: Number(candlestickData[3]),
        closePrice: Number(candlestickData[4]),
        closeTime: candlestickData[6],
        numberOfBasicData: candlestickData[8]
    };
}
