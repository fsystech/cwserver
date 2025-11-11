import { IContext } from "./server";
export type SandBoxNext = (ctx: IContext, body: string, isCompressed?: boolean) => void;
export type SandBox = (ctx: IContext, next: SandBoxNext, isCompressed?: boolean) => void;
export interface ITemplateCtx {
    getCtx(key: string): SandBox;
    deleteCtx(key: string): boolean;
    setCtx(key: string, sendBox: SandBox): void;
}
export declare const TemplateCtx: ITemplateCtx;
