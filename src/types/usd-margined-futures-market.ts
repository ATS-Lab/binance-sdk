type ExchangeInfo = {
    exchangeFilters: ExchangeFilter[];
    rateLimits: RateLimiter[];
    serverTime: number;
    assets: AssetInfo[];
    symbols: SymbolExchangeInfo[];
    timezone: string;
};

// ----- Rate limiters -----

type RateLimiter = {
    rateLimitType: RateLimiterType;
    interval: RateLimiterInterval;
    intervalNum: number;
    limit: number;
};

type RateLimiterType = 'REQUEST_WEIGHT' | 'ORDERS';

type RateLimiterInterval = 'SECOND' | 'MINUTE';

// ----- Exchange filters -----

type ExchangeFilter = any;

// ----- Asset info -----

type AssetInfo = {
    asset: string;
    marginAvailable: boolean;
    autoAssetExchange: string;
};

// ---- Symbol exchange info ----

type SymbolExchangeInfo = {
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

type ContractType = 'PERPETUAL'
    | 'CURRENT_MONTH'
    | 'NEXT_MONTH'
    | 'CURRENT_QUARTER'
    | 'NEXT_QUARTER';


// ----- Enum definitions -----

type Interval =
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


type WorkingType = 'MARK_PRICE' | 'CONTRACT_PRICE';

type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX'

type PositionSide = 'BOTH' | 'LONG' | 'SHORT';

type OrderSide = 'BUY' | 'SELL';

type OrderType =
    'LIMIT' |
    'MARKET' |
    'STOP' |
    'STOP_MARKET' |
    'TAKE_PROFIT' |
    'TAKE_PROFIT_MARKET' |
    'TRAILING_STOP_MARKET';

type OrderStatus =
    'NEW' |
    'PARTIALLY_FILLED' |
    'FILLED' |
    'CANCELED' |
    'REJECTED' |
    'EXPIRED';

type ContractStatus =
    'PENDING_TRADING' |
    'TRADING' |
    'PRE_DELIVERING' |
    'DELIVERING' |
    'DELIVERED' |
    'PRE_SETTLE' |
    'SETTLING' |
    'CLOSE';


type SymbolType = 'FUTURE';


// ----- Symbol filters -----

type SymbolFilter =
    SymbolPriceFilter |
    SymbolLotSizeFilter |
    SymbolMarketLotSizeFilter |
    SymbolMaxOrdersFilter |
    SymbolMaxAlgoOrdersFilter |
    SymbolPercentPriceFilter |
    SymbolMinNotionalFilter;


type SymbolPriceFilter = {
    filterType: 'PRICE_FILTER';
    minPrice: string;
    maxPrice: string;
    tickSize: string;
};

type SymbolLotSizeFilter = {
    filterType: 'LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
};

type SymbolMarketLotSizeFilter = {
    filterType: 'MARKET_LOT_SIZE';
    minQty: string;
    maxQty: string;
    stepSize: string;
};


type SymbolMaxOrdersFilter = {
    filterType: 'MAX_NUM_ORDERS';
    maxNumOrders: number;
};

type SymbolMaxAlgoOrdersFilter = {
    filterType: 'MAX_NUM_ALGO_ORDERS';
    maxNumAlgoOrders: number;
};

type SymbolPercentPriceFilter = {
    filterType: 'PERCENT_PRICE';
    multiplierUp: string;
    multiplierDown: string;
    multiplierDecimal: number;
};

type SymbolMinNotionalFilter = {
    filterType: 'MIN_NOTIONAL';
    notional: string;
};

type OrderBook = {
    lastUpdateId: number;
    messageOutputTime: number;
    transactionTime: number;
    bids: Bid[];
    asks: Ask[];
};

type Bid = {
    price: number;
    qty: number;
};

type Ask = {
    price: number;
    qty: number;
};

type Trade = {
    id: number;
    price: number;
    qty: number;
    quoteQty: number;
    time: number;
    isBuyerMaker: boolean;
};

type AggregateTrade = {
    aggregateTradeId: number;
    price: string;
    qty: string;
    firstTradeId: number;
    lastTradeId: number;
    timestamp: number;
    buyerIsMaker: boolean;
};

type MarkPriceAndFundingRate = {
    symbol: string;
    markPrice: number;
    indexPrice: number;
    estimatedSettlePrice: number;
    lastFundingRate: number;
    nextFundingTime: number;
    interestRate: number;
    time: number;
};

type FundingRate = {
    symbol: string;
    fundingRate: number;
    fundingTime: number;
};

type PriceChangeStatistics = {
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

type SymbolPrice = {
  symbol: string;
  price: number;
  time: number;
};

type BestOrder = {
    symbol: string;
    bidPrice: number;
    bidQty: number;
    askPrice: number;
    askQty: number;
    transactionTime: number;
};

type Interest = {
    symbol: string;
    openInterest: number;
    transactionTime: number;
};