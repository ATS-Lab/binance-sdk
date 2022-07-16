import Index from '../client';

import {MarketOptions} from './types';


export default abstract class Market {
    protected constructor(options: MarketOptions, baseEndpoint: string) {
        this.client = new Index(options.clientOptions, options.accountConnection);
        this.baseEndpoint = baseEndpoint;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected  readonly client: Index;
    protected readonly baseEndpoint: string;
}
