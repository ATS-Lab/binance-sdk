import {ClientOptions} from './client';


export type MarketOptions = {
    accountConnection?: AccountConnection;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};

export type AccountConnection = {
    apiKey: string;
    secretKey: string;
};