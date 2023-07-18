"use strict";
// Copyright Brian White. All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dicer = exports.PartStream = void 0;
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
// 12:03 AM 7/8/2023
// converted js to ts and updated by rajib chy
// sloved dicer DoS vulnerability @see https://security.snyk.io/vuln/SNYK-JS-DICER-2311764
const streamsearch_1 = __importDefault(require("streamsearch"));
const stream_1 = require("stream");
/// [PartStream]
class PartStream extends stream_1.Readable {
    constructor(config) {
        super(config);
    }
    _read(n) {
        // nothing to do
    }
}
exports.PartStream = PartStream;
/// [/PartStream]
/// [Header Parser]
const B_DCRLF = Buffer.from('\r\n\r\n');
const RE_CRLF = /\r\n/g;
// eslint-disable-next-line no-control-regex
const RE_HDR = /^([^:]+):[ \t]?([\x00-\xFF]+)?$/;
const MAX_HEADER_PAIRS = 2000; // From node's http.js
const MAX_HEADER_SIZE = 80 * 1024; // From node's http_parser
class HeaderParser extends stream_1.EventEmitter {
    constructor(cfg) {
        super();
        this.nread = 0;
        this.npairs = 0;
        this.buffer = '';
        this.maxed = false;
        this.finished = false;
        this.header = {};
        this.maxHeaderPairs = (cfg && typeof cfg.maxHeaderPairs === 'number'
            ? cfg.maxHeaderPairs
            : MAX_HEADER_PAIRS);
        this.ss = new streamsearch_1.default(B_DCRLF, (isMatch, data, start, end) => {
            if (data && !this.maxed) {
                if (this.nread + (end - start) > MAX_HEADER_SIZE) {
                    end = (MAX_HEADER_SIZE - this.nread);
                    this.nread = MAX_HEADER_SIZE;
                }
                else {
                    this.nread += (end - start);
                }
                if (this.nread === MAX_HEADER_SIZE)
                    this.maxed = true;
                this.buffer += data.toString('latin1', start, end);
            }
            if (isMatch)
                this._finish();
        });
    }
    push(data) {
        const r = this.ss.push(data);
        if (this.finished)
            return r;
    }
    reset() {
        this.finished = false;
        this.buffer = '';
        this.header = {};
        this.ss.reset();
    }
    _finish() {
        if (this.buffer) {
            this._parseHeader();
        }
        this.ss.matches = this.ss.maxMatches;
        const header = this.header;
        this.header = {};
        this.buffer = '';
        this.maxed = false;
        this.finished = true;
        this.nread = this.npairs = 0;
        this.emit('header', header);
    }
    _parseHeader() {
        var _a;
        if (this.npairs === this.maxHeaderPairs)
            return;
        const lines = this.buffer.split(RE_CRLF);
        const len = lines.length;
        let h;
        for (let i = 0; i < len; ++i) { // eslint-disable-line no-var
            if (lines[i].length === 0) {
                continue;
            }
            if (lines[i][0] === '\t' || lines[i][0] === ' ') {
                // folded header content
                // RFC2822 says to just remove the CRLF and not the whitespace following
                // it, so we follow the RFC and include the leading whitespace ...
                if (h) {
                    const headerPart = this.header[h];
                    if (headerPart) {
                        headerPart[headerPart.length - 1] += lines[i];
                    }
                    continue;
                }
            }
            const posColon = lines[i].indexOf(':');
            if (posColon === -1 || posColon === 0)
                return;
            const m = RE_HDR.exec(lines[i]);
            if (m !== null) {
                h = m[1].toLowerCase();
                if (!this.header[h]) {
                    this.header[h] = [(m[2] || '')];
                }
                else {
                    (_a = this.header[h]) === null || _a === void 0 ? void 0 : _a.push((m[2] || ''));
                }
                if (++this.npairs === this.maxHeaderPairs)
                    break;
            }
        }
    }
    ;
}
/// [/Header Parser]
/// [Dicer]
const DASH = 45;
const B_ONEDASH = Buffer.from('-');
const B_CRLF = Buffer.from('\r\n');
const EMPTY_FN = () => {
    // nothing to do
};
function _toAny(obj) {
    return obj;
}
class Dicer extends stream_1.Writable {
    constructor(cfg) {
        super(cfg);
        this._parts = 0;
        this._dashes = 0;
        this._pause = false;
        this._inHeader = true;
        this._finished = false;
        this._firstWrite = true;
        this._isPreamble = true;
        this._realFinish = false;
        this._ignoreData = false;
        this._justMatched = false;
        this._part = _toAny(null);
        this._bparser = _toAny(null);
        if (!cfg || (!cfg.headerFirst && typeof cfg.boundary !== 'string'))
            throw new TypeError('Boundary required');
        if (typeof cfg.boundary === 'string') {
            this.setBoundary(cfg.boundary);
        }
        this._headerFirst = cfg.headerFirst;
        this._cb = undefined;
        this._partOpts = (typeof cfg.partHwm === 'number'
            ? { highWaterMark: cfg.partHwm }
            : {});
        this._hparser = new HeaderParser(cfg);
        this._hparser.on('header', (header) => {
            this._inHeader = false;
            this._part.emit('header', header);
        });
        this._hparser.on('error', (err) => {
            if (this._part && !this._ignoreData) {
                this._part.emit('error', err);
                this._part.push(null);
            }
        });
    }
    emit(ev, ...args) {
        if (ev !== 'finish' || this._realFinish) {
            // @ts-ignore
            return stream_1.Readable.prototype.emit.apply(this, arguments);
        }
        if (this._finished)
            return true;
        process.nextTick(() => {
            this.emit('error', new Error('Unexpected end of multipart data'));
            if (this._part && !this._ignoreData) {
                const type = (this._isPreamble ? 'Preamble' : 'Part');
                this._part.emit('error', new Error(`${type} terminated early due to `
                    + 'unexpected end of multipart data'));
                this._part.push(null);
                process.nextTick(() => {
                    this._realFinish = true;
                    this.emit('finish');
                    this._realFinish = false;
                });
                return;
            }
            this._realFinish = true;
            this.emit('finish');
            this._realFinish = false;
        });
        return true;
    }
    _write(data, encoding, cb) {
        // Ignore unexpected data (e.g. extra trailer data after finished)
        if (!this._hparser && !this._bparser)
            return cb();
        if (this._headerFirst && this._isPreamble) {
            if (!this._part) {
                this._part = new PartStream(this._partOpts);
                if (this._events.preamble) {
                    this.emit('preamble', this._part);
                }
                else {
                    this._ignore();
                }
            }
            const r = this._hparser.push(data);
            if (!this._inHeader && r !== undefined && r < data.length) {
                data = data.slice(r);
            }
            else {
                return cb();
            }
        }
        // Allows for "easier" testing
        if (this._firstWrite) {
            this._bparser.push(B_CRLF);
            this._firstWrite = false;
        }
        this._bparser.push(data);
        if (this._pause) {
            this._cb = cb;
        }
        else {
            cb();
        }
    }
    reset() {
        // @ts-ignore
        delete this._part;
        // @ts-ignore
        delete this._bparser;
        // @ts-ignore
        delete this._hparser;
    }
    setBoundary(boundary) {
        this._bparser = new streamsearch_1.default(`\r\n--${boundary}`, this._onInfo.bind(this));
    }
    _onInfo(isMatch, data, start, end) {
        let buf, i = 0, shouldWriteMore = true;
        if (!this._part && this._justMatched && data) {
            while (this._dashes < 2 && (start + i) < end) {
                if (data[start + i] === DASH) {
                    ++i;
                    ++this._dashes;
                }
                else {
                    if (this._dashes) {
                        buf = B_ONEDASH;
                    }
                    this._dashes = 0;
                    break;
                }
            }
            if (this._dashes === 2) {
                if ((start + i) < end && this._events.trailer) {
                    this.emit('trailer', data.slice(start + i, end));
                }
                this.reset();
                this._finished = true;
                // No more parts will be added
                if (this._parts === 0) {
                    this._realFinish = true;
                    this.emit('finish');
                    this._realFinish = false;
                }
            }
            if (this._dashes)
                return;
        }
        if (this._justMatched) {
            this._justMatched = false;
        }
        if (!this._part) {
            this._part = new PartStream(this._partOpts);
            this._part._read = (n) => {
                this._unpause();
            };
            const ev = this._isPreamble ? 'preamble' : 'part';
            if (this._events[ev]) {
                this.emit(ev, this._part);
            }
            else {
                this._ignore();
            }
            if (!this._isPreamble)
                this._inHeader = true;
        }
        if (data && start < end && !this._ignoreData) {
            if (this._isPreamble || !this._inHeader) {
                if (buf) {
                    shouldWriteMore = this._part.push(buf);
                }
                shouldWriteMore = this._part.push(data.slice(start, end));
                if (!shouldWriteMore) {
                    this._pause = true;
                }
            }
            else if (!this._isPreamble && this._inHeader) {
                if (buf) {
                    this._hparser.push(buf);
                }
                const r = this._hparser.push(data.slice(start, end));
                if (!this._inHeader && r !== undefined && r < end) {
                    this._onInfo(false, data, start + r, end);
                }
            }
        }
        if (isMatch) {
            this._hparser.reset();
            if (this._isPreamble) {
                this._isPreamble = false;
            }
            else {
                ++this._parts;
                this._part.on('end', () => {
                    if (--this._parts === 0) {
                        if (this._finished) {
                            this._realFinish = true;
                            this.emit('finish');
                            this._realFinish = false;
                        }
                        else {
                            this._unpause();
                        }
                    }
                });
            }
            this._part.push(null);
            // @ts-ignore
            delete this._part;
            this._ignoreData = false;
            this._justMatched = true;
            this._dashes = 0;
        }
    }
    _ignore() {
        if (this._part && !this._ignoreData) {
            this._ignoreData = true;
            this._part.on('error', EMPTY_FN);
            // We must perform some kind of read on the stream even though we are
            // ignoring the data, otherwise node's Readable stream will not emit 'end'
            // after pushing null to the stream
            this._part.resume();
        }
    }
    _unpause() {
        if (!this._pause)
            return;
        this._pause = false;
        if (this._cb) {
            const cb = this._cb;
            delete this._cb;
            cb();
        }
    }
}
exports.Dicer = Dicer;
/// [/Dicer]
//# sourceMappingURL=dicer.js.map