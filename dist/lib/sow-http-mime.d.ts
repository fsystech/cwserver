import { IContext } from './sow-server';
export interface IHttpMimeHandler {
    render(ctx: IContext, maybeDir?: string): void;
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
}
export declare class HttpMimeHandler implements IHttpMimeHandler {
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
    render(ctx: IContext, maybeDir?: string): void;
}
