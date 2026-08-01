// @vitest-environment node
import {
  ChallengeResponse,
  ChallengeType,
  InitSessionResponse,
  VerifyResponse,
  VerifySuccess,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createHeadlessSessionClient } from '@universe/sessions/src/headless/createHeadlessSessionClient'
import {
  createMockSessionClient,
  defineMockEndpoints,
  InMemoryDeviceIdService,
  InMemorySessionStorage,
} from '@universe/sessions/src/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory stand-in for the file store so persistence-seam tests never touch the real
// filesystem (`~/.uniswap/session.json`). Only used by tests that omit a seam — every
// other test injects both seams and must never construct the file store.
const fileStoreMock = vi.hoisted(() => {
  const state: { sessionId?: string; deviceId?: string } = {}
  const createFileSessionStore = vi.fn(() => ({
    sessionStorage: {
      get: async (): Promise<{ sessionId: string } | null> => (state.sessionId ? { sessionId: state.sessionId } : null),
      set: async (session: { sessionId: string }): Promise<void> => {
        state.sessionId = session.sessionId
      },
      clear: async (): Promise<void> => {
        delete state.sessionId
      },
    },
    deviceIdService: {
      getDeviceId: async (): Promise<string | null> => state.deviceId ?? null,
      setDeviceId: async (deviceId: string): Promise<void> => {
        state.deviceId = deviceId
      },
      removeDeviceId: async (): Promise<void> => {
        delete state.deviceId
      },
    },
    filePath: '/mock/session.json',
  }))
  return { createFileSessionStore, state }
})

vi.mock('@universe/sessions/src/headless/createFileSessionStore', () => ({
  createFileSessionStore: fileStoreMock.createFileSessionStore,
}))

function createSuccessVerifyResponse(): VerifyResponse {
  const response = new VerifyResponse({ retry: false })
  response.outcome = { case: 'success', value: new VerifySuccess({}) }
  return response
}

interface Harness {
  client: ReturnType<typeof createHeadlessSessionClient>
  sessionStorage: InMemorySessionStorage
  deviceIdService: InMemoryDeviceIdService
  initSession: ReturnType<typeof vi.fn>
  challenge: ReturnType<typeof vi.fn>
  verify: ReturnType<typeof vi.fn>
}

async function createHarness(options?: {
  storedSessionId?: string
  storedDeviceId?: string
  needChallenge?: boolean
}): Promise<Harness> {
  const sessionStorage = new InMemorySessionStorage()
  const deviceIdService = new InMemoryDeviceIdService()

  if (options?.storedSessionId) {
    await sessionStorage.set({ sessionId: options.storedSessionId })
  }
  if (options?.storedDeviceId) {
    await deviceIdService.setDeviceId(options.storedDeviceId)
  }

  const initSession = vi.fn().mockResolvedValue(
    new InitSessionResponse({
      sessionId: 'backend-session-1',
      deviceId: 'backend-device-1',
      needChallenge: options?.needChallenge ?? false,
      extra: {},
    }),
  )
  const challenge = vi.fn().mockResolvedValue(
    new ChallengeResponse({
      challengeId: 'challenge-1',
      challengeType: ChallengeType.UNSPECIFIED,
      extra: {},
    }),
  )
  const verify = vi.fn().mockResolvedValue(createSuccessVerifyResponse())

  const mockEndpoints = defineMockEndpoints({
    '/uniswap.platformservice.v1.SessionService/InitSession': initSession,
    '/uniswap.platformservice.v1.SessionService/Challenge': challenge,
    '/uniswap.platformservice.v1.SessionService/Verify': verify,
  })

  const client = createHeadlessSessionClient({
    sessionStorage,
    deviceIdService,
    sessionClient: createMockSessionClient(mockEndpoints, sessionStorage, deviceIdService),
  })

  return { client, sessionStorage, deviceIdService, initSession, challenge, verify }
}

describe('createHeadlessSessionClient', () => {
  describe('persistence seams', () => {
    beforeEach(() => {
      delete fileStoreMock.state.sessionId
      delete fileStoreMock.state.deviceId
      fileStoreMock.createFileSessionStore.mockClear()
    })

    it('never constructs the file store when both seams are injected', async () => {
      const { client } = await createHarness({ storedSessionId: 'persisted-session' })

      await client.getSessionHeaders()

      expect(fileStoreMock.createFileSessionStore).not.toHaveBeenCalled()
    })

    it('honors an injected sessionStorage and file-backs only the missing deviceIdService', async () => {
      const sessionStorage = new InMemorySessionStorage()
      await sessionStorage.set({ sessionId: 'injected-session' })
      fileStoreMock.state.deviceId = 'file-device'

      const client = createHeadlessSessionClient({
        sessionStorage,
        sessionClient: createMockSessionClient(defineMockEndpoints({}), sessionStorage, new InMemoryDeviceIdService()),
      })

      expect(await client.getSessionHeaders()).toEqual({
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'injected-session',
        'X-Device-ID': 'file-device',
      })
    })

    it('honors an injected deviceIdService and file-backs only the missing sessionStorage', async () => {
      const deviceIdService = new InMemoryDeviceIdService()
      await deviceIdService.setDeviceId('injected-device')
      fileStoreMock.state.sessionId = 'file-session'

      const client = createHeadlessSessionClient({
        deviceIdService,
        sessionClient: createMockSessionClient(defineMockEndpoints({}), new InMemorySessionStorage(), deviceIdService),
      })

      expect(await client.getSessionHeaders()).toEqual({
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'file-session',
        'X-Device-ID': 'injected-device',
      })
    })
  })

  describe('reuse-before-init', () => {
    it('returns headers from storage without any network calls when a session is persisted', async () => {
      const { client, initSession, challenge, verify } = await createHarness({
        storedSessionId: 'persisted-session',
        storedDeviceId: 'persisted-device',
      })

      const headers = await client.getSessionHeaders()

      expect(headers).toEqual({
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'persisted-session',
        'X-Device-ID': 'persisted-device',
      })
      expect(initSession).not.toHaveBeenCalled()
      expect(challenge).not.toHaveBeenCalled()
      expect(verify).not.toHaveBeenCalled()
    })

    it('bootstraps and persists when no session is stored', async () => {
      const { client, sessionStorage, deviceIdService, initSession } = await createHarness()

      const headers = await client.getSessionHeaders()

      expect(initSession).toHaveBeenCalledTimes(1)
      expect(headers).toEqual({
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'backend-session-1',
        'X-Device-ID': 'backend-device-1',
      })
      expect(await sessionStorage.get()).toEqual({ sessionId: 'backend-session-1' })
      expect(await deviceIdService.getDeviceId()).toBe('backend-device-1')
    })

    it('does not bootstrap again on subsequent calls', async () => {
      const { client, initSession } = await createHarness()

      await client.getSessionHeaders()
      await client.getSessionHeaders()

      expect(initSession).toHaveBeenCalledTimes(1)
    })

    it('completes the challenge flow when the backend requires it', async () => {
      const { client, challenge, verify } = await createHarness({ needChallenge: true })

      const headers = await client.getSessionHeaders()

      expect(challenge).toHaveBeenCalledTimes(1)
      expect(verify).toHaveBeenCalledTimes(1)
      expect(headers['X-Session-ID']).toBe('backend-session-1')
    })
  })

  describe('single-flight', () => {
    it('shares one bootstrap across concurrent getSessionHeaders calls', async () => {
      const { client, initSession } = await createHarness()

      const results = await Promise.all([
        client.getSessionHeaders(),
        client.getSessionHeaders(),
        client.getSessionHeaders(),
      ])

      expect(initSession).toHaveBeenCalledTimes(1)
      for (const headers of results) {
        expect(headers['X-Session-ID']).toBe('backend-session-1')
      }
    })

    it('shares one re-bootstrap across concurrent recover calls', async () => {
      const { client, initSession } = await createHarness({ storedSessionId: 'stale-session' })

      await Promise.all([client.recover(), client.recover(), client.recover()])

      expect(initSession).toHaveBeenCalledTimes(1)
    })

    it('recovers again after a previous recovery settled', async () => {
      const { client, initSession } = await createHarness({ storedSessionId: 'stale-session' })

      await client.recover()
      await client.recover()

      expect(initSession).toHaveBeenCalledTimes(2)
    })

    it('replaces a stale persisted session on recover', async () => {
      const { client, sessionStorage } = await createHarness({ storedSessionId: 'stale-session' })

      await client.recover()

      expect(await sessionStorage.get()).toEqual({ sessionId: 'backend-session-1' })
      expect((await client.getSessionHeaders())['X-Session-ID']).toBe('backend-session-1')
    })
  })

  describe('getSessionHeaders', () => {
    it('uses the configured request source', async () => {
      const sessionStorage = new InMemorySessionStorage()
      const deviceIdService = new InMemoryDeviceIdService()
      await sessionStorage.set({ sessionId: 'persisted-session' })

      const client = createHeadlessSessionClient({
        requestSource: 'uniswap-ios',
        sessionStorage,
        deviceIdService,
        sessionClient: createMockSessionClient(defineMockEndpoints({}), sessionStorage, deviceIdService),
      })

      expect((await client.getSessionHeaders())['x-request-source']).toBe('uniswap-ios')
    })

    it('omits the device ID header when none is known', async () => {
      const sessionStorage = new InMemorySessionStorage()
      const deviceIdService = new InMemoryDeviceIdService()
      await sessionStorage.set({ sessionId: 'persisted-session' })

      const client = createHeadlessSessionClient({
        sessionStorage,
        deviceIdService,
        sessionClient: createMockSessionClient(defineMockEndpoints({}), sessionStorage, deviceIdService),
      })

      expect(await client.getSessionHeaders()).toEqual({
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'persisted-session',
      })
    })

    it('fails with a typed error when bootstrap yields no session ID', async () => {
      const sessionStorage = new InMemorySessionStorage()
      const deviceIdService = new InMemoryDeviceIdService()
      const mockEndpoints = defineMockEndpoints({
        '/uniswap.platformservice.v1.SessionService/InitSession': vi
          .fn()
          .mockResolvedValue(new InitSessionResponse({ needChallenge: false, extra: {} })),
      })

      const client = createHeadlessSessionClient({
        sessionStorage,
        deviceIdService,
        sessionClient: createMockSessionClient(mockEndpoints, sessionStorage, deviceIdService),
      })

      await expect(client.getSessionHeaders()).rejects.toMatchObject({ name: 'HeadlessSessionBootstrapError' })
    })
  })
})
