import Client from './client';

import {
    mapLastPriceCandlestick,
    mapIndexPriceCandlestick,
    mapMarkPriceCandlestick
} from './utils';


export default class UsdMarginedFuturesMarket {
    constructor(options: MarketOptions = {}) {
        if (options.isTestnet) {
            this.baseEndpoint = 'testnet.binancefuture.com';
        } else {
            this.baseEndpoint = 'fapi.binance.com';
        }
        this.client = new Client(options.accountConnection, options.clientOptions);
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private readonly baseEndpoint: string;
    private readonly client: Client;


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public testConnectivity(): Promise<boolean> {
        return new Promise(resolve => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/ping')
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    public getServerTime(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/time')
                .then(data => {
                    resolve(data.serverTime);
                })
                .catch(reject);
        });
    }

    public getExchangeInfo(): Promise<ExchangeInfo> {
        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/exchangeInfo');
    }

    public getOrderBook(parameters: {
        symbol: string;
        // Default 500.
        limit?: 5 | 10 | 20 | 50 | 100 | 500 | 1000;
    }): Promise<OrderBook> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/depth', parameters)
                .then(data => {
                    resolve(<OrderBook>{
                        lastUpdateId: data.lastUpdateId,
                        messageOutputTime: data.E,
                        transactionTime: data.T,
                        bids: data.bids.map((item: [string, string]) => <Bid>{
                            price: Number(item[0]),
                            qty: Number(item[1])
                        }),
                        asks: data.asks.map((item: [string, string]) => <Ask>{
                            price: Number(item[0]),
                            qty: Number(item[1])
                        })
                    });
                })
                .catch(reject);
        });
    }

    /**
     * Market trades means trades filled in the order book. Only market trades will be returned, which means the
     * insurance fund trades and ADL trades won't be returned.
     */
    public getRecentTrades(parameters: {
        symbol: string;
        // Default 500; Min 1; Max 1000;
        limit?: number;
    }): Promise<Trade[]> {
        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/trades', parameters);
    }

    /**
     * Market trades means trades filled in the order book. Only market trades will be returned, which means the
     * insurance fund trades and ADL trades won't be returned.
     */
    public getOlderTrades(parameters: {
        symbol: string;
        // Default 500; Min 1; Max 1000.
        limit?: number;
        // TradeId to fetch from. Default gets most recent trades.
        fromId?: number;
    }): Promise<Trade[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/historicalTrades', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => <Trade>{
                            id: item.id,
                            price: Number(item.price),
                            qty: Number(item.qty),
                            quoteQty: Number(item.quoteQty),
                            time: item.time,
                            isBuyerMaker: item.isBuyerMaker
                        })
                    );
                })
                .catch(reject);
        });
    }

    /**
     * Get compressed, aggregate market trades. Market trades that fill in 100ms with the same price and the same
     * taking side will have the quantity aggregated.
     * <br>
     * If both startTime and endTime are sent, time between startTime and endTime must be less than 1 hour.
     * <br>
     * If fromId, startTime, and endTime are not sent, the most recent aggregate trades will be returned.
     * <br>
     * Only market trades will be aggregated and returned, which means the insurance fund trades and ADL trades won't
     * be aggregated.
     */
    public getAggregateTrades(parameters: {
        symbol: string;
        // ID to get aggregate trades from inclusive.
        fromId?: number;
        // Timestamp in milliseconds to get aggregate trades from inclusive.
        startTime?: number;
        // Timestamp in milliseconds to get aggregate trades until inclusive.
        endTime?: number;
        // Default 500; Min 1; Max 1000.
        limit?: number;
    }): Promise<AggregateTrade[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/aggTrades', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => <AggregateTrade>{
                            aggregateTradeId: item.a,
                            price: item.p,
                            qty: item.q,
                            firstTradeId: item.f,
                            lastTradeId: item.l,
                            timestamp: item.T,
                            buyerIsMaker: item.m
                        })
                    );
                })
                .catch(reject);
        });
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     */
    public getLastPriceCandlesticks(parameters: {
        symbol: string;
        interval: Interval;
        // Opening timestamp in milliseconds to get candlesticks data from inclusive.
        startTime?: number;
        // Opening timestamp in milliseconds to get candlesticks data until inclusive.
        endTime?: number;
        // Default 500; Min 1; Max 1000.
        limit?: number;
    }): Promise<LastPriceCandlestick[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/klines', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => mapLastPriceCandlestick(item))
                    );
                })
                .catch(reject);
        });
    }

    /**
     * Candlestick bars for a specific contract type.
     * <br>
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     */
    public getContinuousLastPriceCandlesticks(parameters: {
        pair: string;
        interval: Interval;
        contractType: ContractType;
        // Opening timestamp in milliseconds to get candlesticks data from inclusive.
        startTime?: number;
        // Opening timestamp in milliseconds to get candlesticks data until inclusive.
        endTime?: number;
        // Default 500; Min 1; Max 1500.
        limit?: number;
    }): Promise<LastPriceCandlestick[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/continuousKlines', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => mapLastPriceCandlestick(item))
                    );
                })
                .catch(reject);
        });
    }

    /**
     * Candlestick bars for a specific contract type.
     * <br>
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     */
    public getIndexPriceCandlesticks(parameters: {
        pair: string;
        interval: Interval;
        // Opening timestamp in milliseconds to get candlesticks data from inclusive.
        startTime?: number;
        // Opening timestamp in milliseconds to get candlesticks data until inclusive.
        endTime?: number;
        // Default 500; Min 1; Max 1500.
        limit?: number;
    }): Promise<IndexPriceCandlestick[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/indexPriceKlines', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => mapIndexPriceCandlestick(item))
                    );
                })
                .catch(reject);
        });
    }

    /**
     * Candlestick bars for a specific contract type.
     * <br>
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     */
    public getMarkPriceCandlesticks(parameters: {
        pair: string;
        interval: Interval;
        // Opening timestamp in milliseconds to get candlesticks data from inclusive.
        startTime?: number;
        // Opening timestamp in milliseconds to get candlesticks data until inclusive.
        endTime?: number;
        // Default 500; Min 1; Max 1500.
        limit?: number;
    }): Promise<MarkPriceCandlestick[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/markPriceKlines', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => mapMarkPriceCandlestick(item))
                    );
                })
                .catch(reject);
        });
    }

    public getMarkPriceAndFundingRate(parameters: {
        symbol: string;
    }): Promise<MarkPriceAndFundingRate> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/premiumIndex', parameters)
                .then(data => {
                    resolve(<MarkPriceAndFundingRate>{
                        symbol: data.symbol,
                        markPrice: Number(data.markPrice),
                        indexPrice: Number(data.indexPrice),
                        estimatedSettlePrice: Number(data.estimatedSettlePrice),
                        lastFundingRate: Number(data.lastFundingRate),
                        nextFundingTime: data.nextFundingTime,
                        interestRate: Number(data.interestRate),
                        time: data.time
                    });
                })
                .catch(reject);
        });
    }

    /**
     * If startTime and endTime are not sent, the most recent limit data's are returned.
     * <br>
     * If the number of data between startTime and endTime is larger than limit, return as startTime + limit.
     * <br>
     * In ascending order.
     */
    public getFundingRateHistory(parameters: {
        symbol?: string;
        // Timestamp in milliseconds to get funding rate from inclusive.
        startTime?: number;
        // Timestamp in milliseconds to get funding rate until inclusive.
        endTime?: number;
        // Default 100; Min 1; Max 1000.
        limit?: number;
    }): Promise<FundingRate[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/fundingRate', parameters)
                .then(data => {
                    resolve(
                        data.map((item: any) => <FundingRate>{
                            symbol: item.signal,
                            fundingRate: Number(item.fundingRate),
                            fundingTime: item.fundingTime
                        })
                    );
                })
                .catch(reject);
        });
    }

    /**
     * If the symbol is not sent, tickers for all symbols will be returned in an array.
     */
    public getPriceChangeStatisticsFor24hr(parameters: {
        symbol?: string;
    }): Promise<PriceChangeStatistics | PriceChangeStatistics[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/ticker/24hr', parameters)
                .then(data => {
                    if (!Array.isArray(data)) {
                        data = [data];
                    }

                    const priceChangeStatistics: PriceChangeStatistics[] = data.map((item: any) => <PriceChangeStatistics>{
                        symbol: item.symbol,
                        priceChange: Number(item.priceChange),
                        priceChangePercent: Number(item.priceChangePercent),
                        weightedAvgPrice: Number(item.weightedAvgPrice),
                        lastPrice: Number(item.lastPrice),
                        lastQty: Number(item.lastQty),
                        openPrice: Number(item.openPrice),
                        highPrice: Number(item.highPrice),
                        lowPrice: Number(item.lowPrice),
                        volume: Number(item.volume),
                        quoteVolume: Number(item.quoteVolume),
                        openTime: item.openTime,
                        closeTime: item.closeTime,
                        firstId: item.firstId,
                        lastId: item.lastId,
                        count: item.count
                    });

                    resolve(priceChangeStatistics);
                })
                .catch(reject);
        });
    }

    /**
     * If the symbol is not sent, prices for all symbols will be returned in an array.
     */
    public getPrice(parameters: {
        symbol?: string;
    }): Promise<SymbolPrice | SymbolPrice[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/ticker/price', parameters)
                .then(data => {
                    if (!Array.isArray(data)) {
                        data = [data];
                    }

                    const symbolPrices: SymbolPrice[] = data.map((item: any) => <SymbolPrice>{
                        symbol: data.symbol,
                        price: Number(data.price),
                        time: data.time
                    });

                    resolve(symbolPrices);
                })
                .catch(reject);
        });
    }

    /**
     * If the symbol is not sent, bookTickers for all symbols will be returned in an array.
     */
    public getBestOrder(parameters: {
        symbol?: string;
    }): Promise<BestOrder | BestOrder[]> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/ticker/bookTicker', parameters)
                .then(data => {
                    if (!Array.isArray(data)) {
                        data = [data];
                    }

                    const bestOrders: BestOrder[] = data.map((item: any) => <BestOrder>{
                        symbol: data.symbol,
                        bidPrice: Number(data.bidPrice),
                        bidQty: Number(data.bidQty),
                        askPrice: Number(data.askPrice),
                        askQty: Number(data.askQty),
                        transactionTime: data.time
                    });

                    resolve(bestOrders);
                })
                .catch(reject);
        });
    }

    public getInterest(parameters: {
        symbol: string;
    }): Promise<Interest> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/ticker/bookTicker', parameters)
                .then(data => {
                    resolve(<Interest>{
                        symbol: data.symbol,
                        openInterest: Number(data.openInterest),
                        transactionTime: data.time
                    });
                })
                .catch(reject);
        });
    }
}