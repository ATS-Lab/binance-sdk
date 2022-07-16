import Market from '../market';

import {MarketOptions} from '../types';


export default class SpotMarket extends Market {
    constructor(options: MarketOptions = {}) {
        if (options.isTestnet) {
            super(options, 'testnet.binance.vision');
        } else {
            super(options, 'api.binance.com');
        }
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public testConnectivity(): Promise<boolean> {
        return new Promise(resolve => {
            this.client.publicRequest('GET', this.baseEndpoint, '/api/v3/ping')
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    public getServerTime(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, 'fapi/v1/time')
                .then(data => {
                    resolve(data.serverTime);
                })
                .catch(reject);
        });
    }
}
