/**
 * Finds a page file with the given parameters. If the page is duplicated with
 * multiple extensions it will throw, otherwise it will return the *relative*
 * path to the page file or null if it is not found.
 *
 * @param pagesDir Absolute path to the pages folder with trailing `/pages`.
 * @param normalizedPagePath The page normalized (it will be denormalized).
 * @param pageExtensions Array of page extensions.
 */
export declare function findPageFile(pagesDir: string, normalizedPagePath: string, pageExtensions: string[], isAppDir: boolean): Promise<string | null>;
export declare function isLayoutsLeafPage(filePath: string): boolean;
