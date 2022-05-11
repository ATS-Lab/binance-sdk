type MarketOptions = {
    accountConnection?: AccountConnection;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};

type AccountConnection = {
    apiKey: string;
    secretKey: string;
};