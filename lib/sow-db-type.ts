// Copyright (c) 2022 Safe Online World Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 6:22 PM 5/19/2020
// by rajib chy
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
    [id: string]: (...args: any[]) => any;
    getConn(): any;
    executeIo(sp: string, ctx: string, formObj: string,
        next: (resp: IoResult) => void
    ): void;
    executeIoAsync(sp: string, ctx: string, formObj: string): Promise<IoResult>;
    query<R extends QueryResultRow = any>(
        queryText: string,
        values: any[],
        callback: (result: QResult<R>) => void
    ): void;
    queryAsync<R extends QueryResultRow = any>(
        queryText: string,
        values: any[]
    ): Promise<QResult<R>>;
}