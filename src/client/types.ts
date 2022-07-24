export type ClientOptions = {
    autoTimestamp?: boolean;
    recvWindow?: number;
};

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATH';

export type ResponseConverter = (data: any) => any | any[];
