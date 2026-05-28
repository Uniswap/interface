import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFileStorage } from './fileStorage'

let baseDir: string

beforeEach(async () => {
  baseDir = await mkdtemp(join(tmpdir(), 'config-cli-fs-'))
})

afterEach(async () => {
  await rm(baseDir, { recursive: true, force: true })
})

describe('createFileStorage', () => {
  it('writes a new key', async () => {
    const storage = createFileStorage({ baseDir })

    const result = await storage.set('k1', 'hello')

    expect(result.isOk()).toBe(true)
    expect(await readFile(join(baseDir, 'k1'), 'utf8')).toBe('hello')
  })

  it('rejects set when the key already exists (atomic create-only semantics)', async () => {
    const storage = createFileStorage({ baseDir })
    await storage.set('k1', 'first')

    const result = await storage.set('k1', 'second')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      // EEXIST surfaces in the error message so callers (e.g. the lock service) can
      // distinguish "already held" from real I/O failures.
      expect(result.error.message).toContain('EEXIST')
    }
  })

  it('reads back what set wrote', async () => {
    const storage = createFileStorage({ baseDir })
    await storage.set('k1', 'roundtrip')

    const result = await storage.get('k1')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('roundtrip')
    }
  })

  it('returns an error from get when the key does not exist', async () => {
    const storage = createFileStorage({ baseDir })

    const result = await storage.get('missing')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('ENOENT')
    }
  })

  it('delete removes the key', async () => {
    const storage = createFileStorage({ baseDir })
    await storage.set('k1', 'doomed')

    const result = await storage.delete('k1')

    expect(result.isOk()).toBe(true)
    expect((await storage.get('k1')).isErr()).toBe(true)
  })

  it('delete is idempotent on missing keys', async () => {
    const storage = createFileStorage({ baseDir })

    const result = await storage.delete('never-existed')

    expect(result.isOk()).toBe(true)
  })

  it('round-trip works across two separate createFileStorage instances pointed at the same baseDir', async () => {
    const writer = createFileStorage({ baseDir })
    await writer.set('shared', 'value')

    // Simulates a second process: same backing dir, fresh service instance.
    await writeFile(join(baseDir, 'sentinel'), 'present')

    const reader = createFileStorage({ baseDir })
    const result = await reader.get('shared')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('value')
    }
  })

  // Keys are flat names per Storage<E>'s contract; anything that could escape baseDir or
  // hit a non-flat path must be rejected before reaching the filesystem.
  describe.each([
    ['empty', ''],
    ['dot', '.'],
    ['parent', '..'],
    ['relative traversal', '../escape'],
    ['absolute path', '/etc/passwd'],
    ['nested with separator', 'subdir/file'],
    ['backslash separator', 'subdir\\file'],
    ['embedded null byte', 'evil\0key'],
  ])('rejects invalid key (%s)', (_label, key) => {
    it('on set, get, and delete without touching the filesystem', async () => {
      const storage = createFileStorage({ baseDir })

      const setResult = await storage.set(key, 'value')
      const getResult = await storage.get(key)
      const deleteResult = await storage.delete(key)

      expect(setResult.isErr()).toBe(true)
      expect(getResult.isErr()).toBe(true)
      expect(deleteResult.isErr()).toBe(true)
      for (const result of [setResult, getResult, deleteResult]) {
        if (result.isErr()) {
          expect(result.error.message).toContain('Invalid storage key')
        }
      }
    })
  })
})
