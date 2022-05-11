import Client from './client';



export default class SpotMarket {
    constructor(options: MarketOptions = {}) {
        if (options.isTestnet) {
            this.baseEndpoint = 'testnet.binance.vision';
        } else {
            this.baseEndpoint = 'api.binance.com';
        }
        this.client = new Client(options.accountConnection, options.clientOptions);
    }



    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private readonly baseEndpoint: string;
    private readonly client: Client;



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

    public getExchangeInfo(parameters?: {
        symbol: string;
    } | {
        symbols: string[];
    }): Promise<ExchangeInfo> {
        return this.client.publicRequest('GET', this.baseEndpoint, '/api/v3/exchangeInfo', parameters);
    }
}