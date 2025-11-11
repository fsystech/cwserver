// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 12:47 PM 7/3/2020
// by rajib chy

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
                path: { resolve: () => void; }
            }
        }
    }
}
declare global {
    /**
     * `cwserver` import script/assets from local resource. If you like to use `pkg` ({@see https://github.com/vercel/pkg }) compiler, please override this method at root.
     */
    function _importLocalAssets(path: string): any;
}

if (!global._importLocalAssets) {
    global._importLocalAssets = (path: string): any => require(path);
}

export { }