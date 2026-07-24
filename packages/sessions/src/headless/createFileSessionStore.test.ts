// @vitest-environment node
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { createFileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('createFileSessionStore', () => {
  let dir: string
  let filePath: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'uniswap-session-store-'))
    filePath = join(dir, 'nested', 'session.json')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('defaults to ~/.uniswap/session.json', () => {
    const store = createFileSessionStore()
    expect(store.filePath).toBe(join(homedir(), '.uniswap', 'session.json'))
  })

  it('returns empty state when the file does not exist', async () => {
    const store = createFileSessionStore({ filePath })
    expect(await store.sessionStorage.get()).toBeNull()
    expect(await store.deviceIdService.getDeviceId()).toBeNull()
  })

  it('round-trips the session ID', async () => {
    const store = createFileSessionStore({ filePath })
    await store.sessionStorage.set({ sessionId: 'session-123' })
    expect(await store.sessionStorage.get()).toEqual({ sessionId: 'session-123' })
  })

  it('round-trips the device ID', async () => {
    const store = createFileSessionStore({ filePath })
    await store.deviceIdService.setDeviceId('device-456')
    expect(await store.deviceIdService.getDeviceId()).toBe('device-456')
  })

  it('persists with the same storage keys the apps use', async () => {
    const store = createFileSessionStore({ filePath })
    await store.sessionStorage.set({ sessionId: 'session-123' })
    await store.deviceIdService.setDeviceId('device-456')
    const raw = JSON.parse(await readFile(filePath, 'utf8'))
    expect(raw).toEqual({
      UNISWAP_SESSION_ID: 'session-123',
      UNISWAP_DEVICE_ID: 'device-456',
    })
  })

  it('persists across store instances pointed at the same file', async () => {
    const first = createFileSessionStore({ filePath })
    await first.sessionStorage.set({ sessionId: 'session-123' })
    await first.deviceIdService.setDeviceId('device-456')

    const second = createFileSessionStore({ filePath })
    expect(await second.sessionStorage.get()).toEqual({ sessionId: 'session-123' })
    expect(await second.deviceIdService.getDeviceId()).toBe('device-456')
  })

  it('creates the file with 0600 permissions and the directory with 0700', async () => {
    const store = createFileSessionStore({ filePath })
    await store.sessionStorage.set({ sessionId: 'session-123' })

    const fileMode = (await stat(filePath)).mode & 0o777
    expect(fileMode).toBe(0o600)

    const dirMode = (await stat(join(dir, 'nested'))).mode & 0o777
    expect(dirMode).toBe(0o700)
  })

  it('clears the session ID without touching the device ID', async () => {
    const store = createFileSessionStore({ filePath })
    await store.sessionStorage.set({ sessionId: 'session-123' })
    await store.deviceIdService.setDeviceId('device-456')

    await store.sessionStorage.clear()

    expect(await store.sessionStorage.get()).toBeNull()
    expect(await store.deviceIdService.getDeviceId()).toBe('device-456')
  })

  it('removes the device ID without touching the session ID', async () => {
    const store = createFileSessionStore({ filePath })
    await store.sessionStorage.set({ sessionId: 'session-123' })
    await store.deviceIdService.setDeviceId('device-456')

    await store.deviceIdService.removeDeviceId()

    expect(await store.deviceIdService.getDeviceId()).toBeNull()
    expect(await store.sessionStorage.get()).toEqual({ sessionId: 'session-123' })
  })

  it('recovers from a corrupt file by starting fresh', async () => {
    const store = createFileSessionStore({ filePath: join(dir, 'session.json') })
    await writeFile(join(dir, 'session.json'), 'not json {{{', 'utf8')

    expect(await store.sessionStorage.get()).toBeNull()
    expect(await store.deviceIdService.getDeviceId()).toBeNull()

    await store.sessionStorage.set({ sessionId: 'fresh-session' })
    expect(await store.sessionStorage.get()).toEqual({ sessionId: 'fresh-session' })
  })

  it('recovers from a schema-invalid file by starting fresh', async () => {
    const store = createFileSessionStore({ filePath: join(dir, 'session.json') })
    await writeFile(join(dir, 'session.json'), JSON.stringify({ UNISWAP_SESSION_ID: 42 }), 'utf8')

    expect(await store.sessionStorage.get()).toBeNull()
  })

  it('does not lose writes when session and device IDs are set concurrently', async () => {
    const store = createFileSessionStore({ filePath })
    await Promise.all([
      store.sessionStorage.set({ sessionId: 'session-123' }),
      store.deviceIdService.setDeviceId('device-456'),
    ])

    expect(await store.sessionStorage.get()).toEqual({ sessionId: 'session-123' })
    expect(await store.deviceIdService.getDeviceId()).toBe('device-456')
  })
})
