import type { IResInfo } from './app-static';
import type { IContext } from './context';
import { type SandBox, type SandBoxNext } from './app-template-ctx';
export type CompilerResult = {
    str: string;
    isScript?: boolean;
    isTemplate?: boolean;
    sandBox?: SandBox;
    err?: NodeJS.ErrnoException | Error | null;
};
type TemplateNextFunc = (params: CompilerResult) => void;
export declare function templateNext(ctx: IContext, next: SandBoxNext, isCompressed?: boolean): Promise<void>;
export declare class TemplateCore {
    /**
     * Compile a template script into a reusable sandbox function.
     * Never throws; failures are reported in `CompilerResult.err`.
     */
    static compileScript(str: string | undefined, vimCtx: Record<string, any>): CompilerResult;
    /** @deprecated Use {@link compileScript} */
    static compile(str: string | undefined, next: TemplateNextFunc, vimCtx: Record<string, any>): void;
    private static parseScript;
    private static isScript;
    static isTemplate(str: string): boolean;
    static isScriptTemplate(str: string): boolean;
    /**
     * Resolve directives (`#extends`, `#attach`) and compile the script (if any).
     * Rejects when a template is missing or malformed.
     */
    static runAsync(ctx: IContext, appRoot: string, str: string): Promise<CompilerResult>;
    /** @deprecated Use {@link runAsync} */
    static run(ctx: IContext, appRoot: string, str: string, next: TemplateNextFunc): void;
}
export declare class Template {
    static parse(ctx: IContext, path: string, status?: IResInfo): Promise<void>;
}
export {};
