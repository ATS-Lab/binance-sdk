import Client from '../client';

import {MarketOptions} from './types';


export default abstract class Market {
    protected constructor(options: MarketOptions, baseEndpoint: string, streamEndpoint: string) {
        this.client = new Client(options.clientOptions, options.accountConnection);
        this.baseEndpoint = baseEndpoint;
        this.streamEndpoint = streamEndpoint;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected readonly client: Client;
    protected readonly baseEndpoint: string;
    protected readonly streamEndpoint: string;


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public abstract testConnectivity(): Promise<boolean>;

    public abstract getServerTime(): Promise<number>;
}
