export type ClientOptions = {
    autoTimestamp?: boolean;
    recvWindow?: number;
};

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATH';

export type Parameters = {
    [key: string]: boolean | number | string | Parameters | Parameters[];
} | undefined;

export type ResponseConverter = (data: any) => any | any[];
