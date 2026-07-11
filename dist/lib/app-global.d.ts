declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string;
            SCRIPT?: "TS" | 'JS';
            IISNODE_VERSION?: string;
            APP_CONFIG_NAME?: string;
            /**
             * Minimum response size, in bytes, required before HTTP response
             * compression is applied.
             *
             * If omitted or invalid, the default threshold is 8 KiB (8192 bytes).
             */
            COMPRESSION_THRESHOLD?: string;
            /**
             * Maximum response payload size (in bytes) to compress entirely in memory.
             *
             * Responses larger than this value are compressed using a streaming
             * pipeline instead of allocating an in-memory compressed buffer.
             *
             * Default: `65536` (64 KiB)
             */
            DEFAULT_MAX_MEMORY_COMPRESS_SIZE?: string;
            /**
             * Specifies the default content compression algorithm for server responses.
             *
             * @remarks
             * The server negotiates the response compression using the client's
             * `Accept-Encoding` header. This value defines the server's preferred
             * algorithm when multiple supported algorithms are available.
             *
             * Can be configured using the `DEFAULT_CONTENT_COMPRESSION`
             * environment variable (`process.env.DEFAULT_CONTENT_COMPRESSION`).
             *
             * @default 'gzip'
             * @type {'gzip' | 'br' | 'zstd'}
             */
            DEFAULT_CONTENT_COMPRESSION?: 'gzip' | 'br' | 'zstd';
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
/**
 * Supported HTTP response compression algorithms.
 *
 * - `"GZIP"` - Widely supported compression format offering an excellent
 *   balance between compression ratio and performance.
 * - `"BROTLI"` - Modern compression algorithm that typically produces
 *   smaller payloads than GZIP, especially for text-based content.
 * - `"ZSTD"` - Zstandard compression algorithm designed to provide high
 *   compression ratios with very fast compression and decompression speeds.
 */
export type CompressionType = "gzip" | "br" | "zstd";
export {};
