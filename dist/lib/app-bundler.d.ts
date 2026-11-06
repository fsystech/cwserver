import { IApplication } from './server-core';
import type { ICwServer } from './server';
import type { IController } from './app-controller';
export declare const __moduleName: string;
export declare class Bundler {
    /**
     * Registers the bundler route on the controller. Requests are served via the in-memory builder when
     * gzip is unsupported or file caching is disabled, otherwise via the file cache.
     *
     * @param app Application instance (unused).
     * @param controller Controller on which the bundler GET route is registered.
     * @param server Server instance providing the bundler configuration.
     */
    static Init(app: IApplication, controller: IController, server: ICwServer): void;
}
