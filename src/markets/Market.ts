import WebSocket from 'ws';

import Client from '../client';

import {MarketOptions} from './types';
import {ClientOptions} from '../client/types';
import {AccountConnection} from '../types';


export default abstract class Market {
    protected constructor(options: MarketOptions) {
        this.client = new Client(options.clientOptions, options.accountConnection);

        this.setEndpoints(!!options.isTestnet);
        this.isAuthorized = !!options.accountConnection;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected readonly client: Client;

    protected baseEndpoint: string;
    protected streamEndpoint: string;

    protected isAuthorized: boolean;
    protected stream: WebSocket | null;


    // ----- [ PUBLIC ABSTRACT METHODS ] -------------------------------------------------------------------------------

    public abstract setEndpoints(isTestnet: boolean): void;

    public abstract testConnectivity(): Promise<boolean>;

    public abstract getServerTime(): Promise<number>;


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public setClientOptions(options?: ClientOptions): void {
        this.client.setOptions(options);
    }

    public setAccountConnection(accountConnection?: AccountConnection): void {
        this.client.setAccountConnection(accountConnection);
        this.isAuthorized = !!accountConnection;
    }
}
