// @vitest-environment node
// Real staging-backend integration tests for the headless session client.
// Runs in the optional `test:integration:backend` target, not the unit `test` target —
// same gating as session.integration.test.ts.
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createFileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
import { createHeadlessSessionClient } from '@universe/sessions/src/headless/createHeadlessSessionClient'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Real Backend Integration - Headless session client (file persistence)', () => {
  let dir: string
  let filePath: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'uniswap-headless-session-'))
    filePath = join(dir, 'session.json')
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('bootstraps a session against staging and persists it to disk with 0600', async () => {
    const store = createFileSessionStore({ filePath })
    const client = createHeadlessSessionClient({
      sessionStorage: store.sessionStorage,
      deviceIdService: store.deviceIdService,
    })

    const headers = await client.getSessionHeaders()

    expect(headers['x-request-source']).toBe('uniswap-extension')
    expect(headers['X-Session-ID']).toBeTruthy()
    expect(headers['X-Device-ID']).toBeTruthy()

    const raw = JSON.parse(await readFile(filePath, 'utf8'))
    expect(raw.UNISWAP_SESSION_ID).toBe(headers['X-Session-ID'])
    expect(raw.UNISWAP_DEVICE_ID).toBe(headers['X-Device-ID'])
    expect((await stat(filePath)).mode & 0o777).toBe(0o600)
  }, 60000)

  it('reuses the persisted session from a fresh client without re-bootstrapping', async () => {
    const persisted = JSON.parse(await readFile(filePath, 'utf8'))

    // Fresh store + client over the same file — simulates a new process.
    const store = createFileSessionStore({ filePath })
    const client = createHeadlessSessionClient({
      sessionStorage: store.sessionStorage,
      deviceIdService: store.deviceIdService,
    })

    const headers = await client.getSessionHeaders()

    expect(headers['X-Session-ID']).toBe(persisted.UNISWAP_SESSION_ID)
    expect(headers['X-Device-ID']).toBe(persisted.UNISWAP_DEVICE_ID)
  }, 60000)

  it('recover() re-establishes a working session', async () => {
    const store = createFileSessionStore({ filePath })
    const client = createHeadlessSessionClient({
      sessionStorage: store.sessionStorage,
      deviceIdService: store.deviceIdService,
    })

    await client.recover()

    const headers = await client.getSessionHeaders()
    expect(headers['X-Session-ID']).toBeTruthy()
  }, 60000)
})
