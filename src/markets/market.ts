import WebSocket from 'ws';

import Client from '../client';

import {MarketOptions} from './types';


export default abstract class Market {
    protected constructor(options: MarketOptions) {
        this.client = new Client(options.clientOptions, options.accountConnection);
        this.setEndpoints(!!options.isTestnet);
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected baseEndpoint: string;
    protected streamEndpoint: string;
    protected stream: WebSocket | null;


    // ----- [ PUBLIC PROPERTIES ] -------------------------------------------------------------------------------------

    public readonly client: Client;


    // ----- [ PUBLIC ABSTRACT METHODS ] -------------------------------------------------------------------------------

    public abstract setEndpoints(isTestnet: boolean): void;

    public abstract testConnectivity(): Promise<boolean>;

    public abstract getServerTime(): Promise<number>;
}
