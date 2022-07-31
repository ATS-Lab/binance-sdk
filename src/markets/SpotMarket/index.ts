import Market from '../Market';

import {MarketOptions} from '../types';


export default class SpotMarket extends Market {
    constructor(options: MarketOptions = {}) {
        super({
            testConnectivity: '/api/v3/ping',
            getServerTime: '/api/v1/time',
            createUserDataStream: '/api/v3/userDataStream',
            keepaliveUserDataStream: '/api/v3/userDataStream',
            closeUserDataStream: '/api/v3/userDataStream'
        }, options);
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public override setNetwork(isTestnet: boolean): void {
        if (isTestnet) {
            this.baseEndpoint = 'testnet.binance.vision';
            this.streamEndpoint = 'wss://testnet.binance.vision';
        } else {
            this.baseEndpoint = 'api.binance.com';
            this.streamEndpoint = 'wss://stream.binance.com';
        }
    }

    public override initAccountData(): Promise<void> {
        return super.initAccountData();
    }
}
