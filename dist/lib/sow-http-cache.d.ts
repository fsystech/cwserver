/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { IResponse } from './sow-server-core';
export declare namespace SowHttpCache {
    /** Gets value in millisecond of {If-Modified-Since} from header. */
    function getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | void;
    /** Gets the {sinceModify, etag} from given header {If-None-Match, If-Modified-Since}. */
    function getChangedHeader(headers: IncomingHttpHeaders): {
        sinceModify?: number | void;
        etag?: string;
    };
    /**
     * Write cache header
     * e.g. {last-modified, expires, ETag, cache-control, x-server-revalidate}.
     */
    function writeCacheHeader(res: IResponse, obj: {
        lastChangeTime?: number | void;
        etag?: string;
    }, cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    }): void;
    /** Create and Gets {etag} (timestamp ^ fsize). */
    function getEtag(timestamp: number, fsize: number): string;
}
