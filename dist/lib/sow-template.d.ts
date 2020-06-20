/// <reference types="node" />
import { IResInfo } from './sow-static';
import { IContext } from './sow-server';
declare type SendBoxNext = (ctx: IContext, body: string, isCompressed?: boolean) => void;
export declare type SendBox = (ctx: IContext, next: SendBoxNext, isCompressed?: boolean) => void;
export declare type CompilerResult = {
    str: string;
    isScript?: boolean;
    isTemplate?: boolean;
    sendBox?: SendBox;
    err?: NodeJS.ErrnoException | Error | null;
};
declare type TemplateNextFunc = (params: CompilerResult) => void;
export declare function templateNext(ctx: IContext, next: SendBoxNext, isCompressed?: boolean): void;
export declare class TemplateCore {
    static compile(str: string | undefined, next: TemplateNextFunc): void;
    private static parseScript;
    private static isScript;
    static isTemplate(str: string): boolean;
    static isScriptTemplate(str: string): boolean;
    private static _run;
    static run(ctx: IContext, appRoot: string, str: string, next: TemplateNextFunc): void;
}
export declare class Template {
    static parse(ctx: IContext, path: string, status?: IResInfo): void;
}
export {};
