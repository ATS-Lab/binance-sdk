export type ExchangeInfo = {
    exchangeFilters: ExchangeFilter[];
    rateLimits: RateLimiter[];
    serverTime: number;
    assets: AssetInfo[];
    symbols: SymbolExchangeInfo[];
    timezone: string;
};

// ----- Rate limiters -----

export type RateLimiter = {
    rateLimitType: RateLimiterType;
    interval: RateLimiterInterval;
    intervalNum: number;
    limit: number;
};

export type RateLimiterType = 'REQUEST_WEIGHT' | 'ORDERS';

export type RateLimiterInterval = 'SECOND' | 'MINUTE';

// ----- Exchange filters -----

export type ExchangeFilter = any;

// ----- Asset info -----

export type AssetInfo = {
    asset: string;
    marginAvailable: boolean;
    autoAssetExchange: string;
};

// ---- Symbol exchange info ----

export type SymbolExchangeInfo = {
    symbol: string;
    pair: string;
    contractType: ContractType;
    deliveryDate: number;
    onboardDate: number;
    status: ContractStatus;
    maintMarginPercent: string;
    requiredMarginPercent: string;
    baseAsset: string;
    quoteAsset: string;
    marginAsset: string;
    pricePrecision: number;
    quantityPrecision: number;
    baseAssetPrecision: number;
    quotePrecision: number;
    underlyingType: string;
    underlyingSubType: string[];
    settlePlan: number;
    triggerProtect: string;
    filters: SymbolFilter[];
    OrderType: OrderType[];
    timeInForce: TimeInForce[];
    liquidationFee: string;
    marketTakeBound: string;
}

export type ContractType = 'PERPETUAL'
    | 'CURRENT_MONTH'
    | 'NEXT_MONTH'
    | 'CURRENT_QUARTER'
    | 'NEXT_QUARTER';


// ----- Enum definitions -----

export type Interval =
    '1m' |
    '3m' |
    '5m' |
    '15m' |
    '30m' |
    '1h' |
    '2h' |
    '4h' |
    '6h' |
    '8h' |
    '12h' |
    '1d' |
    '3d' |
    '1w' |
    '1M';


export type WorkingType = 'MARK_PRICE' | 'CONTRACT_PRICE';

export type TimeInForce = 'GTE_GTC' | 'IOC' | 'FOK' | 'GTX'

export type PositionSide = 'BOTH' | 'LONG' | 'SHORT';

export type OrderSide = 'BUY' | 'SELL';

export type OrderType =
    'LIMIT' |
    'MARKET' |
    'STOP' |
    'STOP_MARKET' |
    'TAKE_PROFIT' |
    'TAKE_PROFIT_MARKET' |
    'TRAILING_STOP_MARKET';

export type OrderStatus =
    'NEW' |
    'PARTIALLY_FILLED' |
    'FILLED' |
    'CANCELED' |
    'REJECTED' |
    'EXPIRED';

export type ContractStatus =
    'PENDING_TRADING' |
    'TRADING' |
    'PRE_DELIVERING' |
    'DELIVERING' |
    'DELIVERED' |
    'PRE_SETTLE' |
    'SETTLING' |
    'CLOSE';


export type SymbolType = 'FUTURE';


// ----- Symbol filters -----

export type SymbolFilter =
    SymbolPriceFilter |
    SymbolLotSizeFilter |
    SymbolMarketLotSizeFilter |
    SymbolMaxOrdersFilter |
    SymbolMaxAlgoOrdersFilter |
    SymbolPercentPriceFilter |
    SymbolMinNotionalFilter;


export type SymbolPriceFilter = {
    filterType: 'PRICE_FILTER';
    minPrice: string;
    maxPrice: string;
    tickSize: string;
};

export type SymbolLotSizeFilter = {
    filterType: 'LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
};

export type SymbolMarketLotSizeFilter = {
    filterType: 'MARKET_LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
};


export type SymbolMaxOrdersFilter = {
    filterType: 'MAX_NUM_ORDERS';
    maxNumOrders: number;
};

export type SymbolMaxAlgoOrdersFilter = {
    filterType: 'MAX_NUM_ALGO_ORDERS';
    maxNumAlgoOrders: number;
};

export type SymbolPercentPriceFilter = {
    filterType: 'PERCENT_PRICE';
    multiplierUp: string;
    multiplierDown: string;
    multiplierDecimal: number;
};

export type SymbolMinNotionalFilter = {
    filterType: 'MIN_NOTIONAL';
    notional: string;
};

export type OrderBook = {
    lastUpdateId: number;
    messageOutputTime: number;
    transactionTime: number;
    bids: Bid[];
    asks: Ask[];
};

export type Bid = {
    price: number;
    qty: number;
};

export type Ask = {
    price: number;
    qty: number;
};

export type Trade = {
    id: number;
    price: number;
    qty: number;
    quoteQty: number;
    time: number;
    isBuyerMaker: boolean;
};

export type AggregateTrade = {
    aggregateTradeId: number;
    price: string;
    qty: string;
    firstTradeId: number;
    lastTradeId: number;
    timestamp: number;
    buyerIsMaker: boolean;
};

export type MarkPriceAndFundingRate = {
    symbol: string;
    markPrice: number;
    indexPrice: number;
    estimatedSettlePrice: number;
    lastFundingRate: number;
    nextFundingTime: number;
    interestRate: number;
    time: number;
};

export type FundingRate = {
    symbol: string;
    fundingRate: number;
    fundingTime: number;
};

export type PriceChangeStatistics = {
    symbol: string;
    priceChange: number;
    priceChangePercent: number;
    weightedAvgPrice: number;
    lastPrice: number;
    lastQty: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    quoteVolume: number;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
};

export type SymbolPrice = {
  symbol: string;
  price: number;
  time: number;
};

export type BestOrder = {
    symbol: string;
    bidPrice: number;
    bidQty: number;
    askPrice: number;
    askQty: number;
    transactionTime: number;
};

export type Interest = {
    symbol: string;
    openInterest: number;
    transactionTime: number;
};

export type OrderResponseType = 'ACK' | 'RESULT';

export type Side = 'BUY' | 'SELL';

export type MarginType = 'isolated' | 'cross';

export type PositionInfo = {
    symbol: string;
    marginType: MarginType;
    entryPrice: number;
    isAutoAddMargin: boolean;
    isolatedMargin: number;
    leverage: number;
    liquidationPrice: number;
    markPrice: number;
    maxNotionalValue: number;
    positionAmt: number;
    notional: number;
    isolatedWallet: number;
    unRealizedProfit: number;
    positionSide: PositionSide;
    updateTime: number;
};

export type LeverageBracket = {
    bracket: number;
    initialLeverage: number;
    notionalCap: number;
    notionalFloor: number;
    maintMarginRatio: number;
    cum: number;
};
