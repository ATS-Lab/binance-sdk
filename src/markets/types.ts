import {Account} from '../types';
import {ClientOptions} from '../client/types';


export type MarketOptions = {
    account?: Account;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};
