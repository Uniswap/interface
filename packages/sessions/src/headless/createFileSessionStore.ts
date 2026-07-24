import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import { createSessionStorage } from '@universe/sessions/src/session-storage/createSessionStorage'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import { z } from 'zod'

/**
 * On-disk shape of the persisted session file. Keys intentionally match the storage keys
 * the apps use (`packages/api/src/storage/`), so a headless session is interchangeable
 * with an app-persisted one.
 */
const persistedSessionFileSchema = z.object({
  UNISWAP_SESSION_ID: z.string().optional(),
  UNISWAP_DEVICE_ID: z.string().optional(),
})

type PersistedSessionFile = z.infer<typeof persistedSessionFileSchema>

/**
 * File-backed drivers for the session persistence seams, for Node (headless) consumers.
 * Both services read from and write to the same JSON file.
 */
interface FileSessionStore {
  /** Session ID persistence, backed by the JSON file. */
  sessionStorage: SessionStorage
  /** Device ID persistence, backed by the same JSON file. */
  deviceIdService: DeviceIdService
  /** Absolute path of the backing file. */
  filePath: string
}

function defaultSessionFilePath(): string {
  return join(homedir(), '.uniswap', 'session.json')
}

/**
 * Creates file-backed `SessionStorage` and `DeviceIdService` drivers persisting to a JSON
 * file (default `~/.uniswap/session.json`) — the Node counterpart of the apps' storage
 * drivers, storing the same `UNISWAP_SESSION_ID` / `UNISWAP_DEVICE_ID` values.
 *
 * Invariants:
 * - The file is created with mode 0600 (and its directory 0700) — session IDs are secrets.
 * - Writes are atomic (temp file + rename) and serialized, so concurrent sets can't
 *   interleave read-modify-write cycles or expose partially written JSON.
 * - A missing, unreadable, corrupt, or schema-invalid file reads as empty state; the next
 *   write starts fresh. Corruption never throws to callers.
 *
 * Requires a Node runtime (`node:fs`). Constructing the store performs no I/O — the file
 * is only touched by the returned services' methods.
 */
function createFileSessionStore(ctx?: { filePath?: string }): FileSessionStore {
  const filePath = ctx?.filePath ?? defaultSessionFilePath()

  // Serializes every read/write so read-modify-write updates are linearizable within
  // this process. Failures propagate to the enqueued caller but never break the chain.
  let queue: Promise<unknown> = Promise.resolve()
  function enqueue<T>(op: () => Promise<T>): Promise<T> {
    const result = queue.then(op, op)
    queue = result.catch(() => undefined)
    return result
  }

  async function read(): Promise<PersistedSessionFile> {
    let raw: string
    try {
      raw = await readFile(filePath, 'utf8')
    } catch {
      return {}
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {}
    }
    const result = persistedSessionFileSchema.safeParse(parsed)
    return result.success ? result.data : {}
  }

  async function write(contents: PersistedSessionFile): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 })
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
    await writeFile(tempPath, `${JSON.stringify(contents, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
    await rename(tempPath, filePath)
  }

  async function update(mutate: (current: PersistedSessionFile) => PersistedSessionFile): Promise<void> {
    return enqueue(async () => write(mutate(await read())))
  }

  const sessionStorage = createSessionStorage({
    getSessionId: async () => enqueue(read).then((contents) => contents.UNISWAP_SESSION_ID ?? null),
    setSessionId: async (sessionId) => update((current) => ({ ...current, UNISWAP_SESSION_ID: sessionId })),
    clearSessionId: async () => update(({ UNISWAP_SESSION_ID: _cleared, ...rest }) => rest),
  })

  // Implements the interface directly: `createDeviceIdService`'s ctx requires a non-null
  // `getDeviceId`, but a file store legitimately starts empty (device IDs are backend-issued).
  const deviceIdService: DeviceIdService = {
    getDeviceId: async () => enqueue(read).then((contents) => contents.UNISWAP_DEVICE_ID ?? null),
    setDeviceId: async (deviceId) => update((current) => ({ ...current, UNISWAP_DEVICE_ID: deviceId })),
    removeDeviceId: async () => update(({ UNISWAP_DEVICE_ID: _removed, ...rest }) => rest),
  }

  return { sessionStorage, deviceIdService, filePath }
}

export { createFileSessionStore }
export type { FileSessionStore }
