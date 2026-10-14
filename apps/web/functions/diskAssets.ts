import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Disk-backed `ASSETS` binding for createApp's getFont: serves files under `rootDir` by request pathname. */
export function createDiskAssets(rootDir: string): { fetch: (input: RequestInfo | URL) => Promise<Response> } {
  // Response BodyInit needs a Uint8Array; a Node Buffer is not one.
  const assetCache = new Map<string, Promise<Uint8Array<ArrayBuffer>>>()
  function readAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
    let cached = assetCache.get(path)
    if (!cached) {
      cached = readFile(path)
        .then((buf) => {
          const bytes = new Uint8Array(buf.byteLength)
          bytes.set(buf)
          return bytes
        })
        .catch((error: unknown) => {
          assetCache.delete(path)
          throw error
        })
      assetCache.set(path, cached)
    }
    return cached
  }

  return {
    fetch: async (input) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const pathname = new URL(urlStr).pathname
      try {
        return new Response(await readAsset(join(rootDir, pathname)))
      } catch {
        return new Response(null, { status: 404 })
      }
    },
  }
}
