import Stream, { Writable as WritableStream, Readable as ReadableStream } from "stream";
export declare class PartStream extends ReadableStream {
    constructor(config: any);
    _read(n: number): void;
}
type DicerConfig = {
    readonly partHwm?: number;
    readonly boundary?: string;
    readonly headerFirst?: boolean;
} & Stream.WritableOptions;
export declare class Dicer extends WritableStream {
    private _events;
    private _partOpts;
    private _parts;
    private _dashes;
    private _hparser;
    private _pause;
    private _inHeader;
    private _finished;
    private _firstWrite;
    private _isPreamble;
    private _realFinish;
    private _ignoreData;
    private _justMatched;
    private _cb;
    private _part;
    private _headerFirst;
    private _bparser;
    constructor(cfg: DicerConfig);
    emit(ev: string | symbol, ...args: any[]): boolean;
    _write(data: Buffer, encoding: string, cb: () => void): void;
    reset(): void;
    setBoundary(boundary: string): void;
    private _onInfo;
    private _ignore;
    private _unpause;
}
export {};
