import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Result } from 'better-result'
import { errorToString } from 'utilities/src/errors'
import { FileStorageError } from '../../errors'
import type { Storage } from './types'

export type FileStorage = Storage<FileStorageError>

/**
 * Storage backed by individual files under `baseDir`. `set` is **atomic create-only** —
 * it fails when the key already exists. This makes it suitable as the backing for the
 * lock service, where atomic claim is the correctness primitive. For overwrite semantics,
 * `delete` first.
 */
export function createFileStorage({ baseDir }: { baseDir: string }): FileStorage {
  const fail = (cause: unknown): FileStorageError => new FileStorageError({ message: errorToString(cause) })

  // Enforces the Storage contract that keys are flat identifiers — see `Storage<E>` in
  // ./types.ts. Without this, `join(baseDir, '../../etc/passwd')` would resolve outside
  // baseDir and a malicious key could read/write/delete arbitrary files.
  const resolvePath = (key: string): Result<string, FileStorageError> => {
    if (
      key.length === 0 ||
      key === '.' ||
      key === '..' ||
      key.includes('/') ||
      key.includes('\\') ||
      key.includes('\0')
    ) {
      return Result.err(new FileStorageError({ message: `Invalid storage key: ${JSON.stringify(key)}` }))
    }
    return Result.ok(join(baseDir, key))
  }

  return {
    set: async (key, value) => {
      const pathResult = resolvePath(key)
      if (pathResult.isErr()) {
        return Result.err(pathResult.error)
      }
      try {
        await mkdir(baseDir, { recursive: true })
        // `wx` = O_WRONLY | O_CREAT | O_EXCL — atomically fails if the file exists.
        // writeFile handles the open/write/close lifecycle for us, so no nested cleanup.
        await writeFile(pathResult.value, value, { flag: 'wx' })
        return Result.ok(undefined)
      } catch (cause) {
        return Result.err(fail(cause))
      }
    },

    get: async (key) => {
      const pathResult = resolvePath(key)
      if (pathResult.isErr()) {
        return Result.err(pathResult.error)
      }
      try {
        return Result.ok(await readFile(pathResult.value, 'utf8'))
      } catch (cause) {
        return Result.err(fail(cause))
      }
    },

    delete: async (key) => {
      const pathResult = resolvePath(key)
      if (pathResult.isErr()) {
        return Result.err(pathResult.error)
      }
      try {
        await unlink(pathResult.value)
        return Result.ok(undefined)
      } catch (cause) {
        // Idempotent: a missing file is the desired post-state.
        if ((cause as NodeJS.ErrnoException).code === 'ENOENT') {
          return Result.ok(undefined)
        }
        return Result.err(fail(cause))
      }
    },
  }
}
