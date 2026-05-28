import { Result } from 'better-result'
import { FileStorageError } from '../../errors'
import type { FileStorage } from './fileStorage'

/**
 * In-memory FileStorage for tests. Mirrors the real implementation's atomic create-only set.
 */
export function createFileStorageMock(): FileStorage {
  const data = new Map<string, string>()
  return {
    set: async (key, value) => {
      if (data.has(key)) {
        return Result.err(new FileStorageError({ message: 'EEXIST' }))
      }
      data.set(key, value)
      return Result.ok(undefined)
    },
    get: async (key) =>
      data.has(key) ? Result.ok(data.get(key) ?? '') : Result.err(new FileStorageError({ message: 'ENOENT' })),
    delete: async (key) => {
      data.delete(key)
      return Result.ok(undefined)
    },
  }
}
