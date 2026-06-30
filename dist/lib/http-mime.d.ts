import type { IContext } from './context';
export interface IHttpMimeHandler {
    renderAsync(ctx: IContext, maybeDir?: string): Promise<void>;
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
}
export declare class HttpMimeHandler implements IHttpMimeHandler {
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
    renderAsync(ctx: IContext, maybeDir?: string): Promise<void>;
}
