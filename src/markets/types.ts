import {AccountConnection} from '../types';
import {ClientOptions} from '../client/types';


export type MarketOptions = {
    accountConnection?: AccountConnection;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};
