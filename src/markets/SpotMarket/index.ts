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


    // ----- [ PROTECTED METHODS ] -------------------------------------------------------------------------------------

    protected override setNetwork(isTestnet: boolean): void {
        if (isTestnet) {
            this.baseEndpoint = 'testnet.binance.vision';
            this.streamEndpoint = 'wss://testnet.binance.vision';
        } else {
            this.baseEndpoint = 'api.binance.com';
            this.streamEndpoint = 'wss://stream.binance.com';
        }
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public override initAccountData(): Promise<void> {
        return new Promise((resolve, reject) => {
            super.initAccountData()
                .then(() => {
                    this.isAccountDataInitialized = true;
                    resolve();
                })
                .catch(reject);
        });
    }
}
