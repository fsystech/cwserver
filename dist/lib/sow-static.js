"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToResponseTime = exports.ToNumber = exports.ResInfo = exports.Session = void 0;
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