import WebSocket from 'ws';

import Client from '../client';

import {PathsCommonMethods, MarketOptions} from './types';
import {ClientOptions, ResponseConverter} from '../client/types';
import {Account} from '../types';


export default abstract class Market {
    protected constructor(paths: PathsCommonMethods, options: MarketOptions) {
        this.paths = paths;
        this.client = new Client(options.clientOptions, options.account);

        this.setNetwork(!!options.isTestnet);
        this.isAuthorized = !!options.account;
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private readonly paths: PathsCommonMethods;


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected readonly client: Client;

    protected baseEndpoint: string;
    protected streamEndpoint: string;

    protected isAuthorized: boolean;
    protected stream: WebSocket | null;


    // ----- [ PROTECTED METHODS ] -------------------------------------------------------------------------------------

    protected createUserDataStream(): Promise<string> {
        const responseConverter: ResponseConverter = (data: any) => data.listenKey;

        return this.client.privateRequest(
            'POST',
            this.baseEndpoint,
            this.paths.createUserDataStream,
            {},
            responseConverter
        );
    }

    protected keepaliveUserDataStream(): Promise<void> {
        return this.client.privateRequest('PUT', this.baseEndpoint, this.paths.keepaliveUserDataStream, {});
    }

    protected closeUserDataStream(): Promise<void> {
        return this.client.privateRequest('DELETE', this.baseEndpoint, this.paths.closeUserDataStream, {});
    }

    protected startUserDataStream(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.createUserDataStream()
                .then((listenKey) => {
                    this.stream = new WebSocket(`${this.streamEndpoint}/ws/${listenKey}`);

                    const streamUpdateTimerId = setInterval(this.keepaliveUserDataStream, 15 * 60 * 1000);

                    this.stream.on('open', () => {
                        resolve();
                    });

                    this.stream.on('close', () => {
                        this.closeUserDataStream()
                            .then(() => {
                                clearInterval(streamUpdateTimerId);
                                this.stream = null;
                            });
                    });
                })
                .catch(reject);
        });
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public setClientOptions(options?: ClientOptions): void {
        this.client.setOptions(options);
    }

    public setAccount(account: Account | null): Promise<void> {
        return new Promise((resolve) => {
            this.stream?.on('close', () => {
                this.client.setAccount(account);
                this.isAuthorized = !!account;
                resolve();
            });
            this.stream?.close();
        });
    }

    public initAccountData(): Promise<void> {
        if (!this.isAuthorized) {
            return Promise.reject(new Error('Not authorized'));
        }

        return this.startUserDataStream();
    }

    public testConnectivity(): Promise<boolean> {
        return new Promise((resolve) => {
            this.client.publicRequest('GET', this.baseEndpoint, this.paths.testConnectivity, {})
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    public getServerTime(): Promise<number> {
        const responseConverter: ResponseConverter = (data: any) => data.serverTime;

        return this.client.publicRequest('GET', this.baseEndpoint, this.paths.getServerTime, {}, responseConverter);
    }

    public getUserDataStream(): WebSocket {
        if (!this.isAuthorized) {
            throw new Error('Not authorized');
        }
        if (!this.stream) {
            throw new Error('Stream not yet created');
        }

        return this.stream;
    }


    // ----- [ PUBLIC ABSTRACT METHODS ] -------------------------------------------------------------------------------

    public abstract setNetwork(isTestnet: boolean): void;
}
