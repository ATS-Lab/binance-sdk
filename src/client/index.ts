import https from 'https';
import crypto from 'crypto';
import qs from 'qs';

import {ClientOptions} from './types';
import {AccountConnection} from '../types';


const DefaultClientOptions: ClientOptions = {
    autoTimestamp: true,
    replaceTimestamp: false,
    recvWindow: 5000
};


export default class Client {
    constructor(
        options: ClientOptions = DefaultClientOptions,
        accountConnection?: AccountConnection
    ) {
        this.setOptions(options);
        this.setAccountConnection(accountConnection);
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private options: ClientOptions;
    private accountConnection: AccountConnection | null;


    // ----- [ STATIC PRIVATE METHODS ] --------------------------------------------------------------------------------

    private static validateOptions(options: ClientOptions): void {
        if (options.recvWindow) {
            if (!Number.isInteger(options.recvWindow) || (options.recvWindow < 1) || (options.recvWindow > 60000)) {
                throw new Error('The recvWindow must be a natural number no greater than 60000');
            }
        }
    }

    private static makeQueryString(parameters: any): string {
        return qs.stringify(parameters);
    }

    private static makeSignedQueryString(parameters: any, key: string): string {
        const queryString = Client.makeQueryString(parameters);

        const hmac = crypto.createHmac('sha256', key);
        const signature = hmac.update(queryString).digest('hex');

        return (queryString ? `${queryString}&` : '') + `signature=${signature}`;
    }


    // ----- [ PRIVATE METHODS ] ---------------------------------------------------------------------------------------

    private request(host: string, path: string, method: string, headers = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                host,
                path,
                method,
                headers
            };

            const request = https.request(options, (incomingMessage) => {
                let response = '';
                incomingMessage.on('data', (data) => {
                    response += data;
                });

                incomingMessage.on('end', () => {
                    response = JSON.parse(response);

                    if (incomingMessage.statusCode === 200) {
                        resolve(response);
                    } else {
                        reject(response);
                    }
                });
            });

            request.on('error', (error) => {
                reject(error.message);
            });

            request.end();
        });
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public setOptions(options?: ClientOptions): void {
        options = Object.assign({}, DefaultClientOptions, options);
        Client.validateOptions(options);

        this.options = options;
    }

    public setAccountConnection(accountConnection?: AccountConnection): void {
        this.accountConnection = accountConnection ?? null;
    }

    public publicRequest(method: string, baseEndpoint: string, path: string, parameters: any = {}): Promise<any> {
        path += '?' + Client.makeQueryString(parameters);
        return this.request(baseEndpoint, path, method);
    }

    public privateRequest(method: string, baseEndpoint: string, path: string, parameters: any = {}): Promise<any> {
        if (!this.accountConnection) {
            return Promise.reject(
                new Error('Unable to make an authenticated call because the API key and secret key was not provided')
            );
        }

        if (this.options.recvWindow) {
            parameters.recvWindow = parameters.recvWindow ?? this.options.recvWindow;
        }
        if (this.options.autoTimestamp) {
            if ((parameters.timestamp === undefined) || this.options.replaceTimestamp) {
                parameters.timestamp = Date.now();
            }
        }

        path += '?' + Client.makeSignedQueryString(parameters, this.accountConnection.secretKey);

        return this.request(baseEndpoint, path, method, {
            'Content-Type': 'application/json',
            'X-MBX-APIKEY': this.accountConnection.apiKey
        });
    }
}
