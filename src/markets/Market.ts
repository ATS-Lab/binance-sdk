import WebSocket from 'ws';

import Client from '../client';

import {MarketOptions} from './types';
import {ClientOptions} from '../client/types';
import {Account} from '../types';


export default abstract class Market {
    protected constructor(options: MarketOptions) {
        this.client = new Client(options.clientOptions, options.account);

        this.setNetwork(!!options.isTestnet);
        this.isAuthorized = !!options.account;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected readonly client: Client;

    protected baseEndpoint: string;
    protected streamEndpoint: string;

    protected isAuthorized: boolean;
    protected stream: WebSocket | null;


    // ----- [ PUBLIC ABSTRACT METHODS ] -------------------------------------------------------------------------------

    public abstract setNetwork(isTestnet: boolean): void;

    public abstract initAccountData(): Promise<void>;

    public abstract testConnectivity(): Promise<boolean>;

    public abstract getServerTime(): Promise<number>;


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public setClientOptions(options?: ClientOptions): void {
        this.client.setOptions(options);
    }

    public setAccount(account?: Account): void {
        this.client.setAccount(account);

        this.isAuthorized = !!account;
        if (!this.isAuthorized) {
            this.stream?.close();
        }
    }

    public getUserDataStream(): WebSocket {
        if (!this.isAuthorized) {
            throw new Error('Not authorized');
        }
        if (!this.stream) {
            throw new Error('Stream not yet created');
        }

        return this.stream;
    }
}
