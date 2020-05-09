export interface ISowDatabaseType {
    getClient(): any;
    executeIo( sp: string, ctx: string, formObj: string, next: ( resp: { ret_val: number, ret_msg: string, ret_data_table?: { [key: string]: any } } ) => void ): any;
    executeIoAsync( sp: string, ctx: string, formObj: string ): Promise<{ ret_val: number, ret_msg: string, ret_data_table?: { [key: string]: any } }>;
}
export class SowDatabaseType implements ISowDatabaseType {
    getClient() {
        throw new Error("Method not implemented.");
    }
    executeIo(sp: string, ctx: string, formObj: string, next: (resp: { ret_val: number; ret_msg: string; ret_data_table?: { [key: string]: any; } | undefined; }) => void) {
        throw new Error("Method not implemented.");
    }
    executeIoAsync(sp: string, ctx: string, formObj: string): Promise<{ ret_val: number; ret_msg: string; ret_data_table?: { [key: string]: any; } | undefined; }> {
        throw new Error("Method not implemented.");
    }
}