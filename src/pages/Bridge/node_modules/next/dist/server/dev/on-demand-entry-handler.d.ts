import type ws from 'ws';
import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { NextConfigComplete } from '../config-shared';
import { CompilerNameValues, COMPILER_INDEXES } from '../../shared/lib/constants';
declare const COMPILER_KEYS: CompilerNameValues[];
export declare const ADDED: unique symbol;
export declare const BUILDING: unique symbol;
export declare const BUILT: unique symbol;
interface EntryType {
    /**
     * Tells if a page is scheduled to be disposed.
     */
    dispose?: boolean;
    /**
     * Timestamp with the last time the page was active.
     */
    lastActiveTime?: number;
    /**
     * Page build status.
     */
    status?: typeof ADDED | typeof BUILDING | typeof BUILT;
    /**
     * Path to the page file relative to the dist folder with no extension.
     * For example: `pages/about/index`
     */
    bundlePath: string;
    /**
     * Webpack request to create a dependency for.
     */
    request: string;
}
export declare const enum EntryTypes {
    ENTRY = 0,
    CHILD_ENTRY = 1
}
interface Entry extends EntryType {
    type: EntryTypes.ENTRY;
    /**
     * The absolute page to the page file. Used for detecting if the file was removed. For example:
     * `/Users/Rick/project/pages/about/index.js`
     */
    absolutePagePath: string;
    /**
     * All parallel pages that match the same entry, for example:
     * ['/parallel/@bar/nested/@a/page', '/parallel/@bar/nested/@b/page', '/parallel/@foo/nested/@a/page', '/parallel/@foo/nested/@b/page']
     */
    appPaths: string[] | null;
}
interface ChildEntry extends EntryType {
    type: EntryTypes.CHILD_ENTRY;
    /**
     * Which parent entries use this childEntry.
     */
    parentEntries: Set<string>;
}
export declare const entries: {
    /**
     * The key composed of the compiler name and the page. For example:
     * `edge-server/about`
     */
    [entryName: string]: Entry | ChildEntry;
};
export declare const getInvalidator: () => Invalidator;
declare class Invalidator {
    private multiCompiler;
    private building;
    private rebuildAgain;
    constructor(multiCompiler: webpack.MultiCompiler);
    shouldRebuildAll(): boolean;
    invalidate(compilerKeys?: typeof COMPILER_KEYS): void;
    startBuilding(compilerKey: keyof typeof COMPILER_INDEXES): void;
    doneBuilding(): void;
}
export declare function onDemandEntryHandler({ maxInactiveAge, multiCompiler, nextConfig, pagesBufferLength, pagesDir, rootDir, appDir, }: {
    maxInactiveAge: number;
    multiCompiler: webpack.MultiCompiler;
    nextConfig: NextConfigComplete;
    pagesBufferLength: number;
    pagesDir?: string;
    rootDir: string;
    appDir?: string;
}): {
    ensurePage({ page, clientOnly, appPaths, }: {
        page: string;
        clientOnly: boolean;
        appPaths?: string[] | null | undefined;
    }): Promise<void>;
    onHMR(client: ws): void;
};
export {};
