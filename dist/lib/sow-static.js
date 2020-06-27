"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToResponseTime = exports.ToNumber = exports.ResInfo = exports.Session = exports.BufferArray = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:01 PM 5/2/2020
const sow_util_1 = require("./sow-util");
class BufferArray {
    constructor() {
        this._data = [];
        this._isDispose = false;
        this._length = 0;
    }
    get _msg() {
        return "This `BufferArray` instance already disposed....";
    }
    get data() {
        sow_util_1.assert(!this._isDispose, this._msg);
        return Buffer.concat(this._data, this.length);
    }
    get length() {
        sow_util_1.assert(!this._isDispose, this._msg);
        return this._length;
    }
    push(buff) {
        sow_util_1.assert(!this._isDispose, this._msg);
        if (Buffer.isBuffer(buff)) {
            this._length += buff.length;
            this._data.push(buff);
            return buff.length;
        }
        const nBuff = Buffer.from(buff);
        this._length += nBuff.length;
        this._data.push(nBuff);
        return nBuff.length;
    }
    clear() {
        sow_util_1.assert(!this._isDispose, this._msg);
        this._data.length = 0;
        this._length = 0;
    }
    toString(encoding) {
        return this.data.toString(encoding);
    }
    dispose() {
        if (!this._isDispose) {
            this._isDispose = true;
            this._data.length = 0;
            this._length = 0;
            delete this._data;
            delete this._length;
        }
        return void 0;
    }
}
exports.BufferArray = BufferArray;
class Session {
    constructor() {
        this.isAuthenticated = false;
        this.loginId = "";
        this.roleId = "";
        this.userData = void 0;
    }
    ;
}
exports.Session = Session;
class ResInfo {
    constructor() {
        this.code = 0;
        this.isValid = false;
        this.isErrorCode = false;
        this.isInternalErrorCode = false;
        this.description = "Ok";
    }
    ;
}
exports.ResInfo = ResInfo;
function ToNumber(obj) {
    if (!obj)
        return 0;
    if (typeof (obj) === "number")
        return obj;
    if (isNaN(obj))
        return 0;
    return parseFloat(obj);
}
exports.ToNumber = ToNumber;
const _map = {
    month: {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'July',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec'
    },
    day: {
        0: "Sun",
        1: "Mon",
        2: "Tue",
        3: "Wed",
        4: "Thu",
        5: "Fri",
        6: "Sat"
    }
};
const dfo = (t) => {
    t = t === 0 ? 1 : t;
    return _map.day[t];
};
const dfon = (t) => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
};
const dfm = (t) => {
    t += 1;
    return _map.month[t];
};
function ToResponseTime(timestamp) {
    // Thu, 01 May 2020 23:34:07 GMT
    const date = typeof (timestamp) === "number" && timestamp > 0 ? new Date(timestamp) : new Date();
    return `${dfo(date.getDay())}, ${dfon(date.getDate())} ${dfm(date.getMonth())} ${date.getFullYear()} ${dfon(date.getHours())}:${dfon(date.getMinutes())}:${dfon(date.getSeconds())} GMT`;
}
exports.ToResponseTime = ToResponseTime;
//# sourceMappingURL=sow-static.js.map