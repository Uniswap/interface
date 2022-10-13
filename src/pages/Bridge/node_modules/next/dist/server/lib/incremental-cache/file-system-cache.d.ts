import type { CacheHandler, CacheHandlerContext, CacheHandlerValue } from './';
export default class FileSystemCache implements CacheHandler {
    private fs;
    private flushToDisk?;
    private serverDistDir;
    private memoryCache?;
    private appDir;
    constructor(ctx: CacheHandlerContext);
    get(key: string): Promise<CacheHandlerValue | null>;
    set(key: string, data: CacheHandlerValue['value']): Promise<void>;
    private getFsPath;
}
