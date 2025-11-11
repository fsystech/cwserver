declare global {
    namespace NodeJS {
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
    /**
     * `cwserver` import script/assets from local resource. If you like to use `pkg` ({@see https://github.com/vercel/pkg }) compiler, please override this method at root.
     */
    function _importLocalAssets(path: string): any;
}
export {};
