import Market from '../market';

import {MarketOptions} from '../types';


export default class SpotMarket extends Market {
    constructor(options: MarketOptions = {}) {
        if (options.isTestnet) {
            super(options, 'testnet.binance.vision', 'wss://testnet.binance.vision');
        } else {
            super(options, 'api.binance.com', 'wss://stream.binance.com');
        }
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public override testConnectivity(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            this.client.publicRequest('GET', this.baseEndpoint, '/api/v3/ping')
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    public override getServerTime(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.client.publicRequest('GET', this.baseEndpoint, 'api/v1/time')
                .then(data => {
                    resolve(data.serverTime);
                })
                .catch(reject);
        });
    }
}
