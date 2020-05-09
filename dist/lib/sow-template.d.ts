import { IResInfo } from './sow-static';
import { ISowServer, IContext } from './sow-server';
export declare namespace Template {
    function parse(server: ISowServer, ctx: IContext, path: string, status?: IResInfo): any;
}
