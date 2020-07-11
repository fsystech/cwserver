/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 6:22 PM 5/19/2020
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
export type IoResult = {
    ret_val: number;
    ret_msg: string;
    ret_data_table?: any;
}
export type QResult<R> = {
    isError: boolean; err?: Error; res?: QueryResult<R>;
}
export interface ISowDatabaseType {
    [id: string]: ( ...args: any[] ) => any;
    getConn(): any;
    executeIo( sp: string, ctx: string, formObj: string,
        next: ( resp: IoResult ) => void
    ): void;
    executeIoAsync( sp: string, ctx: string, formObj: string ): Promise<IoResult>;
    query<R extends QueryResultRow = any>(
        queryText: string,
        values: any[],
        callback: ( result: QResult<R> ) => void
    ): void;
    queryAsync<R extends QueryResultRow = any>(
        queryText: string,
        values: any[]
    ): Promise<QResult<R>>;
}