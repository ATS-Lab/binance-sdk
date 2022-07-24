export type ClientOptions = {
    autoTimestamp?: boolean;
    recvWindow?: number;
};

export type ResponseConverter = (data: any) => any | any[];
