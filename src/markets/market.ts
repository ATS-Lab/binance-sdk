import Client from '../client';

import {MarketOptions} from '../types/market';


export default abstract class Market {
    protected constructor(options: MarketOptions, baseEndpoint: string) {
        this.client = new Client(options.clientOptions, options.accountConnection);
        this.baseEndpoint = baseEndpoint;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected  readonly client: Client;
    protected readonly baseEndpoint: string;
}