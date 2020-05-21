/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
export interface FieldDef {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
}
export interface QueryResultRow {
    [column: string]: any;
}
export interface QueryResultBase {
    command: string;
    rowCount: number;
    oid: number;
    fields: FieldDef[];
}
export interface QueryResult<R extends QueryResultRow = any> extends QueryResultBase {
    rows: R[];
}
export interface ISowDatabaseType {
    [id: string]: ( ...args: any[] ) => any;
    getConn(): any;
    executeIo( sp: string, ctx: string, formObj: string, next: ( resp: {
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        };
    } ) => void ): void;
    executeIoAsync( sp: string, ctx: string, formObj: string ): Promise<{
        ret_val: number;
        ret_msg: string;
        ret_data_table?: {
            [key: string]: any;
        };
    }>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>( queryText: string, values: any[], callback: ( result: {
        isError: boolean;
        err?: Error;
        res?: QueryResult<R>;
    } ) => void ): void;
    queryAsync<R extends QueryResultRow = any, I extends any[] = any[]>( queryText: string, values: any[] ): Promise<{
        isError: boolean;
        err?: Error;
        res?: QueryResult<R>;
    }>;
}