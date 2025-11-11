// Copyright (c) 2022 FSys Tech Ltd.
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

import { IContext } from "./server";

// 11:43 PM 11/11/2025
// by rajib chy

export type SandBoxNext = (ctx: IContext, body: string, isCompressed?: boolean) => void;
export type SandBox = (ctx: IContext, next: SandBoxNext, isCompressed?: boolean) => void;


export interface ITemplateCtx {
    getCtx(key: string): SandBox;
    deleteCtx(key: string): boolean;
    setCtx(key: string, sendBox: SandBox): void;
}

class TemplateCtxHandler {
    private _templateCtx: Map<string, SandBox>;
    constructor() {
        this._templateCtx = new Map();
    }

    public getCtx(key: string): SandBox {
        return this._templateCtx.get(key);
    }

    public setCtx(key: string, sendBox: SandBox): void {
        this._templateCtx.set(key, sendBox);
    }

    public deleteCtx(key: string): boolean {
        return this._templateCtx.delete(key);
    }
}

class ITemplateCtxStatic {
    private static _instance: ITemplateCtx = null;
    public static getInstance(): ITemplateCtx {
        if (this._instance === null) {
            this._instance = new TemplateCtxHandler();
        }
        return this._instance;
    }
}


export const TemplateCtx = ITemplateCtxStatic.getInstance();