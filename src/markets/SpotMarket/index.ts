import Market from '../Market';

import {MarketOptions} from '../types';


export default class SpotMarket extends Market {
    constructor(options: MarketOptions = {}) {
        super(options);
    }


    // ----- [ PROTECTED METHODS ] -------------------------------------------------------------------------------------

    protected override createUserDataStream(): Promise<string> {
        return this.baseCreateUserDataStream('/api/v3/userDataStream');
    }

    protected override keepaliveUserDataStream(): Promise<void> {
        return this.baseKeepaliveUserDataStream('/api/v3/userDataStream');
    }

    protected override closeUserDataStream(): Promise<void> {
        return this.baseCloseUserDataStream('/api/v3/userDataStream');
    }

    protected override startUserDataStream(): Promise<void> {
        return this.baseStartUserDataStream();
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
        return this.baseInitAccountData();
    }

    public override testConnectivity(): Promise<boolean> {
        return this.baseTestConnectivity('/api/v3/ping');
    }

    public override getServerTime(): Promise<number> {
        return this.baseGetServerTime('api/v1/time');
    }
}
