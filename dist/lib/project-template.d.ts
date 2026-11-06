/**
 * Creates a new project from the bundled template under the application root, copying the www tree,
 * server.js and web.config, and setting hostInfo.root in the project's app config. Throws when the
 * template or app root is missing, or the project exists and force is not set.
 *
 * @param settings Options: appRoot (parent directory), projectRoot (project folder name), allExample (also copy
 *   examples), force (replace an existing project), isTest (test mode, quiet and uses test files).
 */
export declare function createProjectTemplate(settings: {
    appRoot: string;
    projectRoot: string;
    allExample?: boolean;
    force?: boolean;
    isTest?: boolean;
}): void;
