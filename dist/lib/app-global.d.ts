import { IApplication } from './server-core';
import { IController } from './app-controller';
import { ICwServer } from './server';
import { IMimeType } from './http-mime-types';
import { SandBox } from './app-template';
type IViewRegister = (app: IApplication, controller: IController, server: ICwServer) => void;
interface ICwGlobalServer {
    /**
     * Register new `view` module
     * @param ev  Event name
     * @param next View register function
     */
    on(ev: "register-view", next: IViewRegister): void;
    emit(ev: "register-view", app: IApplication, controller: IController, server: ICwServer): void;
}
interface ICwGlobal {
    isInitilized: boolean;
    readonly HttpMime: IMimeType<string>;
    readonly server: ICwGlobalServer;
    readonly templateCtx: NodeJS.Dict<SandBox>;
}
declare global {
    namespace NodeJS {
        interface Global {
            cw: ICwGlobal;
        }
        interface ProcessEnv {
            PORT?: string;
            SCRIPT?: "TS" | 'JS';
            IISNODE_VERSION?: string;
            APP_CONFIG_NAME?: string;
        }
        interface Process {
            /**
             * ```ts
             * If you build `cwserver` with `pkg`
             * please create folder to `project_root/lib/cwserver/`
             * copy `mime-types.json` and `schema.json` from node_module/cwserver
             * and please create folder to `project_root/lib/cwserver/dist/error_page`
             * copy all error page from node_module/cwserver/dist/error_page
             * ```
             * define {@see https://github.com/vercel/pkg }
             */
            pkg?: {
                mount: () => void;
                entrypoint: string;
                defaultEntrypoint: string;
                path: {
                    resolve: () => void;
                };
            };
        }
    }
}
declare global {
    var cw: ICwGlobal;
    /**
     * `cwserver` import script/assets from local resource. If you like to use `pkg` ({@see https://github.com/vercel/pkg }) compiler, please override this method at root.
     */
    function _importLocalAssets(path: string): any;
}
export {};
