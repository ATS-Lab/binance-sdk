import Market from '../Market';

import {MarketOptions} from '../types';
import {
    AggregateTrade,
    Ask,
    BestOrder,
    Bid,
    ContractType,
    ExchangeInfo,
    FundingRate,
    OpenInterest,
    Interval,
    LeverageBracket,
    MarkPriceAndFundingRate,
    OpenInterestStatistics,
    OrderBook,
    OrderResponseType,
    OrderType,
    PositionInfo,
    PositionMode,
    PositionSide,
    PriceChangeStatistics,
    Side,
    SymbolExchangeInfo,
    SymbolFilter,
    SymbolPrice,
    TimeInForce,
    Trade,
    WorkingType,
    Period,
    TopLongShortAccountRatio,
    TopLongShortPositionRatio,
    GlobalLongShortAccountRatio,
    TakerLongShortRatio,
    CompositeIndexSymbolInfo,
    BaseAsset,
    MultiAssetsModeAssetIndex,
    SymbolPrecision
} from './types';
import {ResponseConverter} from '../../client/types';

import {
    getNumberPrecision,
    mapLastPriceCandlestick,
    mapIndexPriceCandlestick,
    mapMarkPriceCandlestick
} from '../../utils';


export default class UsdMarginedFuturesMarket extends Market {
    constructor(options: MarketOptions = {}) {
        super({
            testConnectivity: '/fapi/v1/ping',
            getServerTime: '/fapi/v1/time',
            createUserDataStream: '/fapi/v1/listenKey',
            keepaliveUserDataStream: '/fapi/v1/listenKey',
            closeUserDataStream: '/fapi/v1/listenKey'
        }, options);

        this.leverage = new Map<string, number>();
        this.symbolPrecision = new Map<string, SymbolPrecision>();
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private readonly leverage: Map<string, number>;
    private readonly symbolPrecision: Map<string, SymbolPrecision>;


    // ----- [ PRIVATE METHODS ] ---------------------------------------------------------------------------------------

    private initLeverage(): Promise<void> {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getPositionMode(),
                this.getPositionInfo()
            ])
                .then(([positionMode, positionsInfo]) => {
                    const step = positionMode == 'ONE_WAY' ? 1 : 2;
                    for (let i = 0; i < positionsInfo.length; i += step) {
                        this.leverage.set(positionsInfo[i].symbol, positionsInfo[i].leverage);
                    }

                    resolve();
                })
                .catch(reject);
        });
    }

    private initSymbolPrecision(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.getExchangeInfo()
                .then(({symbols}) => {
                    symbols.forEach((symbolExchangeInfo) => {
                        const {symbol, filters} = symbolExchangeInfo;
                        const priceFilter = filters.find((filter) => filter.filterType == 'PRICE_FILTER');
                        const lotSizeFilter = filters.find((filter) => filter.filterType == 'LOT_SIZE');

                        this.symbolPrecision.set(symbol, {
                            price: priceFilter?.filterType == 'PRICE_FILTER'
                                ? getNumberPrecision(priceFilter.tickSize)
                                : 0,
                            quantity: lotSizeFilter?.filterType == 'LOT_SIZE'
                                ? getNumberPrecision(lotSizeFilter.stepSize)
                                : 0
                        });
                    });
                    resolve();
                })
                .catch(reject);
        });
    }


    // ----- [ PROTECTED METHODS ] -------------------------------------------------------------------------------------

    protected override setNetwork(isTestnet: boolean): void {
        if (isTestnet) {
            this.baseEndpoint = 'testnet.binancefuture.com';
            this.streamEndpoint = 'wss://stream.binancefuture.com';
        } else {
            this.baseEndpoint = 'fapi.binance.com';
            this.streamEndpoint = 'wss://fstream.binance.com';
        }
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public override initAccountData(): Promise<void> {
        return new Promise((resolve, reject) => {
            super.initAccountData()
                .then(() => {
                    Promise.all([
                        this.initLeverage(),
                        this.initSymbolPrecision()
                    ])
                        .then(() => {
                            this.isAccountDataInitialized = true;
                            resolve();
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    public override deleteAccountData(): Promise<void> {
        return new Promise((resolve, reject) => {
            super.deleteAccountData()
                .then(() => {
                    this.leverage.clear();
                    this.isAccountDataInitialized = false;
                    resolve();
                })
                .catch(reject);
        });
    }

    public getLeverage(symbol?: string): Map<string, number> | number {
        if (!this.isAuthorized) {
            throw new Error('Not authorized');
        }
        if (!this.isAccountDataInitialized) {
            throw new Error('Account data not initialized');
        }

        if (symbol) {
            const leverage = this.leverage.get(symbol);
            if (!leverage) {
                throw new Error('The specified symbol does not exist');
            }

            return leverage;
        } else {
            return this.leverage;
        }
    }

    public getSymbolPrecision(symbol?: string): Map<string, SymbolPrecision> | SymbolPrecision {
        if (!this.isAuthorized) {
            throw new Error('Not authorized');
        }
        if (!this.isAccountDataInitialized) {
            throw new Error('Account data not initialized');
        }

        if (symbol) {
            const symbolPrecision = this.symbolPrecision.get(symbol);
            if (!symbolPrecision) {
                throw new Error('The specified symbol does not exist');
            }

            return symbolPrecision;
        } else {
            return this.symbolPrecision;
        }
    }

    // Market data endpoints

    public getExchangeInfo(): Promise<ExchangeInfo> {
        const responseConverter: ResponseConverter = (data: any) => {
            data.symbols.forEach((symbol: SymbolExchangeInfo) => {
                symbol.maintMarginPercent = Number(symbol.maintMarginPercent);
                symbol.requiredMarginPercent = Number(symbol.requiredMarginPercent);
                symbol.triggerProtect = Number(symbol.triggerProtect);
                symbol.liquidationFee = Number(symbol.liquidationFee);
                symbol.marketTakeBound = Number(symbol.marketTakeBound);
                symbol.filters.forEach((filter: SymbolFilter) => {
                    switch (filter.filterType) {
                        case 'PRICE_FILTER':
                            filter.minPrice = Number(filter.minPrice);
                            filter.maxPrice = Number(filter.maxPrice);
                            filter.tickSize = Number(filter.tickSize);
                            break;
                        case 'LOT_SIZE':
                            filter.minQty = Number(filter.minQty);
                            filter.maxQty = Number(filter.maxQty);
                            filter.stepSize = Number(filter.stepSize);
                            break;
                        case 'MARKET_LOT_SIZE':
                            filter.minQty = Number(filter.minQty);
                            filter.maxQty = Number(filter.maxQty);
                            filter.stepSize = Number(filter.stepSize);
                            break;
                        case 'MAX_NUM_ORDERS':
                            break;
                        case 'MAX_NUM_ALGO_ORDERS':
                            break;
                        case 'PERCENT_PRICE':
                            filter.multiplierUp = Number(filter.multiplierUp);
                            filter.multiplierDown = Number(filter.multiplierDown);
                            break;
                        case 'MIN_NOTIONAL':
                            filter.notional = Number(filter.notional);
                            break;
                        default:
                            throw new Error('Unknown symbol filter type');
                    }
                });
            });

            return data;
        };

        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/exchangeInfo', {}, responseConverter);
    }

    public getOrderBook(parameters: {
        symbol: string;
        // Default 500.
        limit?: 5 | 10 | 20 | 50 | 100 | 500 | 1000;
    }): Promise<OrderBook> {
        const responseConverter: ResponseConverter = (data: any) => <OrderBook>{
            lastUpdateId: data.lastUpdateId,
            messageOutputTime: data.E,
            transactionTime: data.T,
            bids: data.bids.map((bid: [string, string]) => <Bid>{
                price: Number(bid[0]),
                qty: Number(bid[1])
            }),
            asks: data.asks.map((ask: [string, string]) => <Ask>{
                price: Number(ask[0]),
                qty: Number(ask[1])
            })
        };

        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/depth', parameters, responseConverter);
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
        const responseConverter: ResponseConverter = (data: any) => <Trade>{
            id: data.id,
            price: Number(data.price),
            qty: Number(data.qty),
            quoteQty: Number(data.quoteQty),
            time: data.time,
            isBuyerMaker: data.isBuyerMaker
        };

        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/trades', parameters, responseConverter);
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
        const responseConverter: ResponseConverter = (data: any) => <Trade>{
            id: data.id,
            price: Number(data.price),
            qty: Number(data.qty),
            quoteQty: Number(data.quoteQty),
            time: data.time,
            isBuyerMaker: data.isBuyerMaker
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/historicalTrades',
            parameters,
            responseConverter
        );
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
        const responseConverter: ResponseConverter = (data: any) => <AggregateTrade>{
            aggregateTradeId: data.a,
            price: Number(data.p),
            qty: Number(data.q),
            firstTradeId: data.f,
            lastTradeId: data.l,
            timestamp: data.T,
            buyerIsMaker: data.m
        };

        return this.client.publicRequest('GET', this.baseEndpoint, '/fapi/v1/aggTrades', parameters, responseConverter);
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
        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/klines',
            parameters,
            mapLastPriceCandlestick
        );
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
        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/continuousKlines',
            parameters,
            mapLastPriceCandlestick
        );
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
        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/indexPriceKlines',
            parameters,
            mapIndexPriceCandlestick
        );
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
        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/markPriceKlines',
            parameters,
            mapMarkPriceCandlestick
        );
    }

    public getMarkPriceAndFundingRate(parameters?: {
        symbol?: string;
    }): Promise<MarkPriceAndFundingRate | MarkPriceAndFundingRate[]> {
        const responseConverter: ResponseConverter = (data: any) => <MarkPriceAndFundingRate>{
            symbol: data.symbol,
            markPrice: Number(data.markPrice),
            indexPrice: Number(data.indexPrice),
            estimatedSettlePrice: Number(data.estimatedSettlePrice),
            lastFundingRate: Number(data.lastFundingRate),
            nextFundingTime: data.nextFundingTime,
            interestRate: Number(data.interestRate),
            time: data.time
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/premiumIndex',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent limit data are returned.
     * <br>
     * If the number of data between startTime and endTime is larger than limit, return as startTime + limit.
     * <br>
     * In ascending order.
     */
    public getFundingRateHistory(parameters?: {
        symbol?: string;
        // Timestamp in milliseconds to get funding rate from inclusive.
        startTime?: number;
        // Timestamp in milliseconds to get funding rate until inclusive.
        endTime?: number;
        // Default 100; Min 1; Max 1000.
        limit?: number;
    }): Promise<FundingRate[]> {
        const responseConverter: ResponseConverter = (data: any) => <FundingRate>{
            symbol: data.signal,
            fundingRate: Number(data.fundingRate),
            fundingTime: data.fundingTime
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/fundingRate',
            parameters,
            responseConverter
        );
    }

    /**
     * If the symbol is not sent, tickers for all symbols will be returned in an array.
     */
    public getPriceChangeStatisticsFor24hr(parameters?: {
        symbol?: string;
    }): Promise<PriceChangeStatistics | PriceChangeStatistics[]> {
        const responseConverter: ResponseConverter = (data: any) => <PriceChangeStatistics>{
            symbol: data.symbol,
            priceChange: Number(data.priceChange),
            priceChangePercent: Number(data.priceChangePercent),
            weightedAvgPrice: Number(data.weightedAvgPrice),
            lastPrice: Number(data.lastPrice),
            lastQty: Number(data.lastQty),
            openPrice: Number(data.openPrice),
            highPrice: Number(data.highPrice),
            lowPrice: Number(data.lowPrice),
            volume: Number(data.volume),
            quoteVolume: Number(data.quoteVolume),
            openTime: data.openTime,
            closeTime: data.closeTime,
            firstId: data.firstId,
            lastId: data.lastId,
            count: data.count
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/ticker/24hr',
            parameters,
            responseConverter
        );
    }

    /**
     * If the symbol is not sent, prices for all symbols will be returned in an array.
     */
    public getPrice(parameters?: {
        symbol?: string;
    }): Promise<SymbolPrice | SymbolPrice[]> {
        const responseConverter: ResponseConverter = (data: any) => <SymbolPrice>{
            symbol: data.symbol,
            price: Number(data.price),
            time: data.time
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/ticker/price',
            parameters,
            responseConverter
        );
    }

    /**
     * If the symbol is not sent, bookTickers for all symbols will be returned in an array.
     */
    public getBestOrder(parameters?: {
        symbol?: string;
    }): Promise<BestOrder | BestOrder[]> {
        const responseConverter: ResponseConverter = (data: any) => <BestOrder>{
            symbol: data.symbol,
            bidPrice: Number(data.bidPrice),
            bidQty: Number(data.bidQty),
            askPrice: Number(data.askPrice),
            askQty: Number(data.askQty),
            transactionTime: data.time
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/ticker/bookTicker',
            parameters,
            responseConverter
        );
    }

    public getOpenInterest(parameters: {
        symbol: string;
    }): Promise<OpenInterest> {
        const responseConverter: ResponseConverter = (data: any) => <OpenInterest>{
            symbol: data.symbol,
            openInterest: Number(data.openInterest),
            transactionTime: data.time
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/openInterest',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     * <br>
     * Only the data of the latest 30 days is available.
     */
    public getOpenInterestStatistics(parameters: {
        symbol: string;
        period: Period;
        // Default 30; Min 1; Max 500.
        limit?: number;
        startTime?: number;
        endTime?: number;
    }): Promise<OpenInterestStatistics[]> {
        const responseConverter: ResponseConverter = (data: any) => <OpenInterestStatistics>{
            symbol: data.symbol,
            sumOpenInterest: Number(data.sumOpenInterest),
            sumOpenInterestValue: Number(data.sumOpenInterestValue),
            timestamp: Number(data.timestamp)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/futures/data/openInterestHist',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     * <br>
     * Only the data of the latest 30 days is available.
     */
    public getTopLongShortAccountRatio(parameters: {
        symbol: string;
        period: Period;
        // Default 30; Min 1; Max 500.
        limit?: number;
        startTime?: number;
        endTime?: number;
    }): Promise<TopLongShortAccountRatio[]> {
        const responseConverter: ResponseConverter = (data: any) => <TopLongShortAccountRatio>{
            symbol: data.symbol,
            longShortRatio: Number(data.longShortRatio),
            longAccount: Number(data.longAccount),
            shortAccount: Number(data.shortAccount),
            timestamp: Number(data.timestamp)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/futures/data/topLongShortAccountRatio',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     * <br>
     * Only the data of the latest 30 days is available.
     */
    public getTopLongShortPositionRatio(parameters: {
        symbol: string;
        period: Period;
        // Default 30; Min 1; Max 500.
        limit?: number;
        startTime?: number;
        endTime?: number;
    }): Promise<TopLongShortPositionRatio[]> {
        const responseConverter: ResponseConverter = (data: any) => <TopLongShortPositionRatio>{
            symbol: data.symbol,
            longShortRatio: Number(data.longShortRatio),
            longAccount: Number(data.longAccount),
            shortAccount: Number(data.shortAccount),
            timestamp: Number(data.timestamp)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/futures/data/topLongShortPositionRatio',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     * <br>
     * Only the data of the latest 30 days is available.
     */
    public getGlobalLongShortAccountRatio(parameters: {
        symbol: string;
        period: Period;
        // Default 30; Min 1; Max 500.
        limit?: number;
        startTime?: number;
        endTime?: number;
    }): Promise<GlobalLongShortAccountRatio[]> {
        const responseConverter: ResponseConverter = (data: any) => <GlobalLongShortAccountRatio>{
            symbol: data.symbol,
            longShortRatio: Number(data.longShortRatio),
            longAccount: Number(data.longAccount),
            shortAccount: Number(data.shortAccount),
            timestamp: Number(data.timestamp)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/futures/data/globalLongShortAccountRatio',
            parameters,
            responseConverter
        );
    }

    /**
     * If startTime and endTime are not sent, the most recent candlesticks are returned.
     * <br>
     * Only the data of the latest 30 days is available.
     */
    public getTakerLongShortRatio(parameters: {
        symbol: string;
        period: Period;
        // Default 30; Min 1; Max 500.
        limit?: number;
        startTime?: number;
        endTime?: number;
    }): Promise<TakerLongShortRatio[]> {
        const responseConverter: ResponseConverter = (data: any) => <TakerLongShortRatio>{
            buySellRatio: Number(data.buySellRatio),
            buyVol: Number(data.buyVol),
            sellVol: Number(data.sellVol),
            timestamp: Number(data.timestamp)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/futures/data/takerlongshortRatio',
            parameters,
            responseConverter
        );
    }

    /**
     * Only for composite index symbols
     */
    public getCompositeIndexSymbolInfo(parameters?: {
        symbol?: string;
    }): Promise<CompositeIndexSymbolInfo | CompositeIndexSymbolInfo[]> {
        const responseConverter: ResponseConverter = (data: any) => {
            data.baseAssetList.forEach((asset: BaseAsset) => {
                asset.weightInQuantity = Number(asset.weightInQuantity);
                asset.weightInPercentage = Number(asset.weightInPercentage);
            });

            return data;
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/indexInfo',
            parameters,
            responseConverter
        );
    }

    public getMultiAssetsModeAssetIndex(parameters?: {
        symbol?: string;
    }): Promise<MultiAssetsModeAssetIndex | MultiAssetsModeAssetIndex[]> {
        const responseConverter: ResponseConverter = (data: any) => <MultiAssetsModeAssetIndex>{
            symbol: data.symbol,
            time: data.time,
            index: Number(data.index),
            bidBuffer: Number(data.bidBuffer),
            askBuffer: Number(data.askBuffer),
            bidRate: Number(data.bidRate),
            askRate: Number(data.askRate),
            autoExchangeBidBuffer: Number(data.autoExchangeBidBuffer),
            autoExchangeAskBuffer: Number(data.autoExchangeAskBuffer),
            autoExchangeBidRate: Number(data.autoExchangeBidRate),
            autoExchangeAskRate: Number(data.autoExchangeAskRate)
        };

        return this.client.publicRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/assetIndex',
            parameters,
            responseConverter
        );
    }

    // Account/trades endpoints

    public changePositionMode(parameters: {
        dualSidePosition: boolean;
        recvWindow?: number;
        timestamp?: number;
    }): Promise<boolean> {
        const responseConverter: ResponseConverter = (data: any) => (data.msg == 'success');
        return this.client.privateRequest(
            'POST',
            this.baseEndpoint,
            '/fapi/v1/positionSide/dual',
            parameters,
            responseConverter
        );
    }

    public getPositionMode(parameters?: {
        recvWindow?: number;
        timestamp?: number;
    }): Promise<PositionMode> {
        const responseConverter: ResponseConverter = (data: any) => (data.dualSidePosition ? 'HEDGE' : 'ONE_WAY');
        return this.client.privateRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v1/positionSide/dual',
            parameters,
            responseConverter
        );
    }

    public createOrder(parameters: {
        symbol: string;
        side: Side;
        // Default BOTH for One-way Mode; LONG or SHORT for Hedge Mode. It must be sent in Hedge Mode.
        positionSide?: PositionSide;
        type: OrderType;
        timeInForce?: TimeInForce;
        // Cannot be sent with closePosition=true(Close-All).
        quantity?: number;
        // Default "false". Cannot be sent in Hedge Mode; cannot be sent with closePosition=true.
        reduceOnly?: boolean;
        price?: number;
        // A unique id among open orders. Automatically generated if not sent.
        newClientOrderId?: string;
        // Used with STOP/STOP_MARKET or TAKE_PROFIT/TAKE_PROFIT_MARKET orders.
        stopPrice?: number;
        closePosition?: boolean;
        // Used with TRAILING_STOP_MARKET orders, default as the latest price(supporting different workingType).
        activationPrice?: number;
        // Used with TRAILING_STOP_MARKET orders, min 0.1, max 5 where 1 for 1%.
        callbackRate?: number;
        // stopPrice triggered by: "MARK_PRICE", "CONTRACT_PRICE". Default "CONTRACT_PRICE".
        workingType?: WorkingType;
        // "TRUE" or "FALSE", default "FALSE". Used with STOP/STOP_MARKET or TAKE_PROFIT/TAKE_PROFIT_MARKET orders.
        priceProtect?: boolean;
        newOrderRespType?: OrderResponseType;
        timestamp?: number;
    }): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.privateRequest('POST', this.baseEndpoint, '/fapi/v1/order', parameters)
                .then((data) => {
                    resolve(data);
                })
                .catch(reject);
        });
    }

    public createBatchOrders(parameters: {
        batchOrders: {
            symbol: string;
            side: Side;
            // Default BOTH for One-way Mode; LONG or SHORT for Hedge Mode. It must be sent in Hedge Mode.
            positionSide?: PositionSide;
            type: OrderType;
            timeInForce?: TimeInForce;
            // Cannot be sent with closePosition=true(Close-All).
            quantity?: number;
            // Default "false". Cannot be sent in Hedge Mode; cannot be sent with closePosition=true.
            reduceOnly?: boolean;
            price?: number;
            // A unique id among open orders. Automatically generated if not sent.
            newClientOrderId?: string;
            // Used with STOP/STOP_MARKET or TAKE_PROFIT/TAKE_PROFIT_MARKET orders.
            stopPrice?: number;
            closePosition?: boolean;
            // Used with TRAILING_STOP_MARKET orders, default as the latest price(supporting different workingType).
            activationPrice?: number;
            // Used with TRAILING_STOP_MARKET orders, min 0.1, max 5 where 1 for 1%.
            callbackRate?: number;
            // stopPrice triggered by: "MARK_PRICE", "CONTRACT_PRICE". Default "CONTRACT_PRICE".
            workingType?: WorkingType;
            // "TRUE" or "FALSE", default "FALSE". Used with STOP/STOP_MARKET or TAKE_PROFIT/TAKE_PROFIT_MARKET orders.
            priceProtect?: boolean;
            newOrderRespType?: OrderResponseType;
        }[],
        timestamp?: number;
    }): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.privateRequest('POST', this.baseEndpoint, '/fapi/v1/batchOrders', parameters)
                .then((data) => {
                    resolve(data);
                })
                .catch(reject);
        });
    }

    public addTpAndSl(parameters: {
        symbol: string;
        side: Side;
        // Default BOTH for One-way Mode; LONG or SHORT for Hedge Mode. It must be sent in Hedge Mode.
        positionSide?: PositionSide;
        timeInForce?: TimeInForce;
        quantity: number;
        price: number;
        // %ROE
        takeProfit: number;
        // %ROE
        stopLoss: number;
        // stopPrice triggered by: "MARK_PRICE", "CONTRACT_PRICE". Default "CONTRACT_PRICE".
        workingType?: WorkingType;
        newOrderRespType?: OrderResponseType;
        timestamp?: number;
    }): Promise<any> {
        const common = Object.assign(
            {
                symbol: parameters.symbol,
                quantity: parameters.quantity
            },
            (parameters.positionSide ? {positionSide: parameters.positionSide} : {}),
            (parameters.timeInForce ? {timeInForce: parameters.timeInForce} : {}),
            (parameters.workingType ? {workingType: parameters.workingType} : {}),
            (parameters.newOrderRespType ? {newOrderRespType: parameters.newOrderRespType} : {})
        );

        return this.createBatchOrders({
            batchOrders: [
                Object.assign({
                    symbol: parameters.symbol,
                    side: parameters.side == 'BUY' ? 'SELL' : 'BUY',
                    type: 'TAKE_PROFIT_MARKET',
                    stopPrice: Math.trunc(parameters.price * (1 + (parameters.side == 'BUY' ? 1 : -1) * parameters.takeProfit / 100 / (this.leverage.get(parameters.symbol) ?? 1)) * 10000) / 10000,
                    closePosition: true,
                    priceProtect: true
                }, common),
                Object.assign({
                    symbol: parameters.symbol,
                    side: parameters.side == 'BUY' ? 'SELL' : 'BUY',
                    type: 'STOP_MARKET',
                    stopPrice: Math.trunc(parameters.price * (1 - (parameters.side == 'BUY' ? 1 : -1) * parameters.stopLoss / 100 / (this.leverage.get(parameters.symbol) ?? 1)) * 10000) / 10000,
                    closePosition: true,
                    priceProtect: true
                }, common)
            ]
        });
    }

    public getPositionInfo(parameters?: {
        symbol?: string;
        recvWindow?: number;
        timestamp?: number;
    }): Promise<PositionInfo[]> {
        const responseConverter: ResponseConverter = (data: any) => <PositionInfo>{
            symbol: data.symbol,
            marginType: data.marginType,
            entryPrice: Number(data.entryPrice),
            isAutoAddMargin: Boolean(data.isAutoAddMargin),
            isolatedMargin: Number(data.isolatedMargin),
            leverage: Number(data.leverage),
            liquidationPrice: Number(data.liquidationPrice),
            markPrice: Number(data.markPrice),
            maxNotionalValue: Number(data.maxNotionalValue),
            positionAmt: Number(data.positionAmt),
            notional: Number(data.notional),
            isolatedWallet: Number(data.isolatedWallet),
            unRealizedProfit: Number(data.unRealizedProfit),
            positionSide: data.positionSide,
            updateTime: data.updateTime
        };

        return this.client.privateRequest(
            'GET',
            this.baseEndpoint,
            '/fapi/v2/positionRisk',
            parameters,
            responseConverter
        );
    }

    public getLeverageBracket(parameters?: {
        symbol?: string;
        recvWindow?: number;
        timestamp?: number;
    }): Promise<LeverageBracket> {
        return this.client.privateRequest('GET', this.baseEndpoint, '/fapi/v1/leverageBracket', parameters);
    }
}
