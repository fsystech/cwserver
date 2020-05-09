/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { IResponse } from './sow-server-core';
export declare namespace SowHttpCache {
    function getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | void;
    function getChangedHeader(headers: IncomingHttpHeaders): {
        sinceModify?: number | void;
        etag?: string;
    };
    function writeCacheHeader(res: IResponse, obj: {
        lastChangeTime?: number | void;
        etag?: string;
    }, cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    }): void;
    function getEtag(timestamp: number, fsize: number): string;
}
