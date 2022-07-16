import Market from '../market';

import {MarketOptions} from '../types';


export default class SpotMarket extends Market {
    constructor(options: MarketOptions = {}) {
        super(options);
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public override setEndpoints(isTestnet: boolean): void {
        if (isTestnet) {
            this.baseEndpoint = 'testnet.binance.vision';
            this.streamEndpoint = 'wss://testnet.binance.vision';
        } else {
            this.baseEndpoint = 'api.binance.com';
            this.streamEndpoint = 'wss://stream.binance.com';
        }
    }

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
