import Stream, { Writable as WritableStream, Readable as ReadableStream } from "stream";
export declare class PartStream extends ReadableStream {
    /**
     * Creates a readable stream representing one part of a multipart body.
     *
     * @param config Options passed to the Readable stream constructor.
     */
    constructor(config: any);
    /**
     * Does nothing because data is pushed into the stream by the Dicer parser.
     *
     * @param n Requested number of bytes (ignored).
     */
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
    /**
     * Creates a multipart stream parser. Throws a TypeError if neither a boundary nor headerFirst is
     * provided.
     *
     * @param cfg Configuration with boundary, headerFirst, partHwm and stream writable options.
     */
    constructor(cfg: DicerConfig);
    /**
     * Emits events, but defers the 'finish' event: if the multipart data ended unexpectedly, it emits
     * errors on the parser and open part instead of finishing normally.
     *
     * @param ev Event name.
     * @param args Arguments passed to listeners.
     * @returns True if the event was emitted or handled.
     */
    emit(ev: string | symbol, ...args: any[]): boolean;
    /**
     * Writable implementation that accepts incoming chunks, parses part headers first when configured, and
     * passes data to the boundary search. Applies backpressure by holding the callback while paused.
     *
     * @param data Chunk of multipart data.
     * @param encoding Chunk encoding (unused).
     * @param cb Callback called when the chunk has been processed.
     */
    _write(data: Buffer, encoding: string, cb: () => void): void;
    /**
     * Releases the current part and the header and boundary parsers.
     */
    reset(): void;
    /**
     * Sets the multipart boundary by creating a search for the delimiter line preceding it.
     *
     * @param boundary Boundary string, without the leading dashes.
     */
    setBoundary(boundary: string): void;
    /**
     * Handles boundary search results: emits part and preamble streams, routes data to headers or the part
     * body, detects the closing delimiter and trailer, and emits finish when done.
     *
     * @param isMatch Whether a boundary was matched.
     * @param data Buffer holding the searched data.
     * @param start Start offset of the relevant data.
     * @param end End offset of the relevant data.
     */
    private _onInfo;
    /**
     * Marks the current part's data as ignored and resumes its stream so it still ends.
     */
    private _ignore;
    /**
     * Resumes writing after backpressure by clearing the pause flag and calling the held callback.
     */
    private _unpause;
}
export {};
