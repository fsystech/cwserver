import { IResInfo } from './app-static';
import { IContext } from './server';
import { type SandBox, type SandBoxNext } from './app-template-ctx';
export type CompilerResult = {
    str: string;
    isScript?: boolean;
    isTemplate?: boolean;
    sandBox?: SandBox;
    err?: NodeJS.ErrnoException | Error | null;
};
type TemplateNextFunc = (params: CompilerResult) => void;
export declare function templateNext(ctx: IContext, next: SandBoxNext, isCompressed?: boolean): void;
export declare class TemplateCore {
    static compile(str: string | undefined, next: TemplateNextFunc, vimCtx: NodeJS.Dict<any>): void;
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
