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
/**
 * Placeholder for the template response callback; the implementation is not provided and calling it
 * throws an Error.
 *
 * @param ctx Current request context.
 * @param next Response callback that sends the rendered body.
 * @param isCompressed Whether the output should be gzip compressed.
 * @returns Never returns normally; it always throws "Function not implemented."
 */
export declare function templateNext(ctx: IContext, next: SandBoxNext, isCompressed?: boolean): Promise<void>;
export declare class TemplateCore {
    /**
     * Compiles a template script string into a reusable sandbox function using a restricted VM context.
     * Never throws exceptions directly; any compilation or execution failures are caught and reported in `CompilerResult.err`.
     *
     * @param str - The raw template script content/string to compile.
     * @param vimCtx - Additional contextual variables to securely expose within the template execution sandbox.
     * @returns A `CompilerResult` object containing the script string, compilation status, sandbox function, or any encountered error.
     */
    static compileScript(str: string | undefined, vimCtx: Record<string, any>): CompilerResult;
    /** @deprecated Use {@link compileScript} */
    static compile(str: string | undefined, next: TemplateNextFunc, vimCtx: Record<string, any>): void;
    /**
     * Converts template text containing script and write tags into a JavaScript source string that builds
     * the output.
     *
     * @param str Template source with script tags.
     * @returns The generated script source.
     */
    private static parseScript;
    /**
     * Tests whether the string contains a template engine script tag.
     *
     * @param str Template source text.
     * @returns True if script tags are present, otherwise false.
     */
    private static isScript;
    /**
     * Tests whether the string uses "#attach" or "#extends" directives.
     *
     * @param str Template source text.
     * @returns True if the string contains a template directive, otherwise false.
     */
    static isTemplate(str: string): boolean;
    /**
     * Tests whether the string is previously generated script output by checking the first line for the
     * template script marker.
     *
     * @param str Cached template text.
     * @returns True if the first line contains the script marker, otherwise false.
     */
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
    /**
     * Renders a template file for a request, choosing live compile, memory cache or file cache according
     * to the template configuration. Also sets the context served-from url.
     *
     * @param ctx Current request context.
     * @param path Absolute path of the template file.
     * @param status Optional response info; defaults to a 200 status for the path.
     * @returns A promise that resolves when the response has been handled.
     */
    static parse(ctx: IContext, path: string, status?: IResInfo): Promise<void>;
}
export {};
