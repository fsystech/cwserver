import { IResInfo } from './sow-static';
import { IContext } from './sow-server';
declare type SendBoxNext = (ctx: IContext, body: string, isCompressed?: boolean) => void;
export declare type SendBox = (ctx: IContext, next: SendBoxNext, isCompressed?: boolean) => void;
export declare class TemplateCore {
    static compile(str?: string, next?: (str: string, isScript?: boolean) => void): SendBox;
    private static parseScript;
    private static isScript;
    static isTemplate(str: string): boolean;
    static isScriptTemplate(str: string): boolean;
    static run(appRoot: string, str: string, next?: (str: string, isScript?: boolean) => void): string | SendBox;
}
export declare namespace Template {
    function parse(ctx: IContext, path: string, status?: IResInfo): void;
}
export {};
