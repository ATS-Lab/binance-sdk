import {ClientOptions} from '../client/types';


export type MarketOptions = {
    accountConnection?: AccountConnection;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};

export type AccountConnection = {
    apiKey: string;
    secretKey: string;
};
