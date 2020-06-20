/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { IResponse } from './sow-server-core';
export declare type IChangeHeader = {
    sinceModify?: number | void;
    etag?: string;
};
export declare class SowHttpCache {
    /** Gets value in millisecond of {If-Modified-Since} from header. */
    static getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | void;
    /** Gets the {sinceModify, etag} from given header {If-None-Match, If-Modified-Since}. */
    static getChangedHeader(headers: IncomingHttpHeaders): IChangeHeader;
    /**
     * Write cache header
     * e.g. {last-modified, expires, ETag, cache-control, x-server-revalidate}.
     */
    static writeCacheHeader(res: IResponse, obj: {
        lastChangeTime?: number | void;
        etag?: string;
    }, cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    }): void;
    /** Create and Gets {etag} (timestamp ^ fsize). */
    static getEtag(timestamp: number, fsize: number): string;
    static isAcceptedEncoding(headers: IncomingHttpHeaders, name: string): boolean;
}
