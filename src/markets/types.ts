import {Account} from '../types';
import {ClientOptions} from '../client/types';


export type PathsCommonMethods = {
    testConnectivity: string;
    getServerTime: string;
    createUserDataStream: string;
    keepaliveUserDataStream: string;
    closeUserDataStream: string;
};

export type MarketOptions = {
    account?: Account;
    clientOptions?: ClientOptions;
    isTestnet?: boolean;
};
