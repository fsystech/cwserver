export interface ISowDatabaseType {
    getClient(): any;
    executeIo(sp: string, ctx: string, formObj: string, next: (resp: {
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        };
    }) => void): any;
    executeIoAsync(sp: string, ctx: string, formObj: string): Promise<{
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        };
    }>;
}
export declare class SowDatabaseType implements ISowDatabaseType {
    getClient(): void;
    executeIo(sp: string, ctx: string, formObj: string, next: (resp: {
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        } | undefined;
    }) => void): void;
    executeIoAsync(sp: string, ctx: string, formObj: string): Promise<{
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        } | undefined;
    }>;
}
