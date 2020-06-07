/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:01 PM 5/2/2020
export interface ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void
}
export interface IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    tryServer: boolean;
}
export class Session implements ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void;
    constructor() {
        this.isAuthenticated = false;
        this.loginId = "";
        this.roleId = "";
        this.userData = void 0;
    };
}
export class ResInfo implements IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    tryServer: boolean;
    constructor() {
        this.code = 0; this.isValid = false;
        this.isErrorCode = false;
        this.isInternalErrorCode = false;
        this.tryServer = false;
    };
}
export function ToNumber( obj: any ): number {
    if ( !obj ) return 0;
    if ( typeof ( obj ) === "number" ) return obj;
    if ( isNaN( obj ) ) return 0;
    return parseFloat( obj );
}
const _map: {
    month: { [key: number]: string },
    day: { [key: number]: string }
} = {
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
const dfo = ( t: number ): string => {
    t = t === 0 ? 1 : t;
    return _map.day[t];
};
const dfon = ( t: number ): any => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
};
const dfm = ( t: number ): string => {
    t += 1;
    return _map.month[t];
};
export function ToResponseTime( timestamp?: number ): string {
    // Thu, 01 May 2020 23:34:07 GMT
    const date = typeof ( timestamp ) === "number" && timestamp > 0 ? new Date( timestamp ) : new Date();
    return `${dfo( date.getDay() )}, ${dfon( date.getDate() )} ${dfm( date.getMonth() )} ${date.getFullYear()} ${dfon( date.getHours() )}:${dfon( date.getMinutes() )}:${dfon( date.getSeconds() )} GMT`;
}