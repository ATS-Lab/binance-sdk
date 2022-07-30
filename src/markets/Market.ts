import WebSocket from 'ws';

import Client from '../client';

import {MarketOptions} from './types';
import {ClientOptions, ResponseConverter} from '../client/types';
import {Account} from '../types';


export default abstract class Market {
    protected constructor(options: MarketOptions) {
        this.client = new Client(options.clientOptions, options.account);

        this.setNetwork(!!options.isTestnet);
        this.isAuthorized = !!options.account;
    }


    // ----- [ PROTECTED PROPERTIES ] ----------------------------------------------------------------------------------

    protected readonly client: Client;

    protected baseEndpoint: string;
    protected streamEndpoint: string;

    protected isAuthorized: boolean;
    protected stream: WebSocket | null;


    // ----- [ PROTECTED METHODS ] -------------------------------------------------------------------------------------

    protected baseInitAccountData(): Promise<void> {
        if (!this.isAuthorized) {
            return Promise.reject(new Error('Not authorized'));
        }

        return this.startUserDataStream();
    }

    protected baseTestConnectivity(path: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.client.publicRequest('GET', this.baseEndpoint, path, {})
                .then(() => resolve(true))
                .catch(() => resolve(false));
        });
    }

    protected baseGetServerTime(path: string): Promise<number> {
        const responseConverter: ResponseConverter = (data: any) => data.serverTime;

        return this.client.publicRequest('GET', this.baseEndpoint, path, {}, responseConverter);
    }

    protected baseCreateUserDataStream(path: string): Promise<string> {
        const responseConverter: ResponseConverter = (data: any) => data.listenKey;

        return this.client.privateRequest('POST', this.baseEndpoint, path, {}, responseConverter);
    }

    protected baseKeepaliveUserDataStream(path: string): Promise<void> {
        return this.client.privateRequest('PUT', this.baseEndpoint, path, {});
    }

    protected baseCloseUserDataStream(path: string): Promise<void> {
        return this.client.privateRequest('DELETE', this.baseEndpoint, path, {});
    }

    protected baseStartUserDataStream(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.createUserDataStream()
                .then((listenKey) => {
                    this.stream = new WebSocket(`${this.streamEndpoint}/ws/${listenKey}`);

                    const streamUpdateTimerId = setInterval(this.keepaliveUserDataStream, 15 * 60 * 1000);

                    this.stream.on('open', () => {
                        resolve();
                    });

                    this.stream.on('close', () => {
                        if (!this.stream) {
                            return;
                        }

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


    // ----- [ PROTECTED ABSTRACT METHODS ] ----------------------------------------------------------------------------

    protected abstract createUserDataStream(): Promise<string>;

    protected abstract keepaliveUserDataStream(): Promise<void>;

    protected abstract closeUserDataStream(): Promise<void>;

    protected abstract startUserDataStream(): Promise<void>;


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public setClientOptions(options?: ClientOptions): void {
        this.client.setOptions(options);
    }

    public setAccount(account?: Account): void {
        this.client.setAccount(account);

        this.isAuthorized = !!account;
        if (!this.isAuthorized) {
            this.stream?.close();
        }
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

    public abstract initAccountData(): Promise<void>;

    public abstract testConnectivity(): Promise<boolean>;

    public abstract getServerTime(): Promise<number>;
}
