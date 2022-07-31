import https from 'https';
import crypto from 'crypto';
import qs from 'qs';

import {ClientOptions, RequestMethod, Parameters, ResponseConverter} from './types';
import {Account} from '../types';


const DefaultClientOptions: ClientOptions = {
    autoTimestamp: true,
    recvWindow: 5000
};


export default class Client {
    constructor(
        options: ClientOptions = DefaultClientOptions,
        account?: Account
    ) {
        this.setOptions(options);
        this.setAccount(account ?? null);
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private options: ClientOptions;
    private account: Account | null;


    // ----- [ STATIC PRIVATE METHODS ] --------------------------------------------------------------------------------

    private static validateOptions(options: ClientOptions): void {
        if (options.recvWindow) {
            if (!Number.isInteger(options.recvWindow) || (options.recvWindow < 1) || (options.recvWindow > 60000)) {
                throw new Error('The recvWindow must be a natural number no greater than 60000');
            }
        }
    }

    private static makeQueryString(parameters: Parameters): string {
        return qs.stringify(parameters);
    }

    private static makeSignedQueryString(parameters: Parameters, key: string): string {
        const queryString = Client.makeQueryString(parameters);

        const hmac = crypto.createHmac('sha256', key);
        const signature = hmac.update(queryString).digest('hex');

        return (queryString ? `${queryString}&` : '') + `signature=${signature}`;
    }

    private static processResponse(response: any, responseConverter?: ResponseConverter): any | any[] {
        if (responseConverter) {
            if (Array.isArray(response)) {
                return response.map(responseConverter);
            } else {
                return responseConverter(response);
            }
        } else {
            return response;
        }
    }


    // ----- [ PRIVATE METHODS ] ---------------------------------------------------------------------------------------

    private applyOptions(parameters: Parameters): Parameters {
        if (!parameters) {
            parameters = {};
        }

        if (this.options.recvWindow) {
            parameters['recvWindow'] = parameters['recvWindow'] ?? this.options.recvWindow;
        }
        if (this.options.autoTimestamp && !parameters['timestamp']) {
            parameters['timestamp'] = Date.now();
        }

        return parameters;
    }

    private request<T>(options: https.RequestOptions, responseConverter?: ResponseConverter): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const request = https.request(options, (incomingMessage) => {
                let response = '';
                incomingMessage.on('data', (data) => {
                    response += data;
                });

                incomingMessage.on('end', () => {
                    response = JSON.parse(response);

                    if (incomingMessage.statusCode === 200) {
                        resolve(Client.processResponse(response, responseConverter));
                    } else {
                        reject(response);
                    }
                });
            });

            request.on('error', (error) => {
                reject(error);
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

    public setAccount(account: Account | null): void {
        this.account = account;
    }

    public publicRequest<T>(
        method: RequestMethod,
        host: string,
        path: string,
        parameters: Parameters,
        responseConverter?: ResponseConverter
    ): Promise<T> {
        path += '?' + Client.makeQueryString(parameters);
        return this.request<T>({host, path, method}, responseConverter);
    }

    public privateRequest<T>(
        method: RequestMethod,
        host: string,
        path: string,
        parameters: Parameters,
        responseConverter?: ResponseConverter
    ): Promise<T> {
        if (!this.account) {
            return Promise.reject(
                new Error('Unable to make an authenticated call because the API key and secret key was not provided')
            );
        }

        parameters = this.applyOptions(parameters);
        path += '?' + Client.makeSignedQueryString(parameters, this.account.secretKey);

        const headers = {
            'Content-Type': 'application/json',
            'X-MBX-APIKEY': this.account.apiKey
        };

        return this.request<T>({host, path, method, headers}, responseConverter);
    }
}
