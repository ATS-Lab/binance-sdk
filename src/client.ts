import https from 'https';
import crypto from 'crypto';
import querystring from 'querystring';

import {ClientOptions} from './types/client';
import {AccountConnection} from './types/market';


const ClientOptionsDefault: ClientOptions = {
    autoTimestamp: true,
    recvWindow: 5000
};


export default class Client {
    constructor(
        options: ClientOptions = ClientOptionsDefault,
        accountConnection?: AccountConnection
    ) {
        Client.validateOptions(options);

        this.options = Object.assign(ClientOptionsDefault, options);
        this.accountConnection = accountConnection;
    }


    // ----- [ PRIVATE PROPERTIES ] ------------------------------------------------------------------------------------

    private options: ClientOptions;
    private readonly accountConnection: AccountConnection | undefined;


    // ----- [ PRIVATE METHODS ] ---------------------------------------------------------------------------------------

    private static validateOptions(options: ClientOptions): void {
        if (options.recvWindow) {
            if (!Number.isInteger(options.recvWindow) || (options.recvWindow < 1) || (options.recvWindow > 60000)) {
                throw new Error('The recvWindow must be a natural number no greater than 60000');
            }
        }
    }

    private static makeQueryString(parameters: querystring.ParsedUrlQueryInput): string {
        const queryString = querystring.stringify(parameters);
        return queryString ? `?${queryString}` : queryString;
    }

    private static makeSignedQueryString(parameters: querystring.ParsedUrlQueryInput, key: string): string {
        const queryString = Client.makeQueryString(parameters);

        const hmac = crypto.createHmac('sha256', key);
        const signature = hmac.update(queryString).digest('hex');

        return (queryString ? `${queryString}&` : '?') + `signature=${signature}`;
    }

    private request(host: string, path: string, method: string, headers = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                host,
                path,
                method,
                headers,
            };

            const request = https.request(options, incomingMessage => {
                let response = '';
                incomingMessage.on('data', data => {
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

            request.on('error', error => {
                reject(error.message);
            });

            request.end();
        });
    }


    // ----- [ PUBLIC METHODS ] ----------------------------------------------------------------------------------------

    public publicRequest(method: string, baseEndpoint: string, path: string, parameters: any = {}): Promise<any> {
        path += Client.makeQueryString(parameters);
        return this.request(baseEndpoint, path, method);
    }

    public privateRequest(method: string, baseEndpoint: string, path: string, parameters: any = {}): Promise<any> {
        if (!this.accountConnection) {
            return Promise.reject('Unable to make an authenticated call because the API key and secret key was not provided');
        }

        if (this.options.recvWindow) {
            parameters.recvWindow = this.options.recvWindow;
        }
        if (this.options.autoTimestamp) {
            parameters.timestamp = Date.now();
        }

        path += Client.makeSignedQueryString(parameters, this.accountConnection.secretKey);

        return this.request(baseEndpoint, path, method, {
            'Content-Type': 'application/json',
            'X-MBX-APIKEY': this.accountConnection.apiKey
        });
    }
}