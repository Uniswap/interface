import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createSessionService', () => {
  let storage: SessionStorage
  let repository: SessionRepository
  let deviceIdService: DeviceIdService
  let uniswapIdentifierService: UniswapIdentifierService
  let service: SessionService

  beforeEach(() => {
    // In-memory storage implementation
    let data: { sessionId: string } | null = null
    storage = {
      get: async (): Promise<{ sessionId: string } | null> => data,
      set: async (newData): Promise<void> => {
        data = newData
      },
      clear: async (): Promise<void> => {
        data = null
      },
    }

    let deviceIdData: string | null = null
    deviceIdService = {
      getDeviceId: async (): Promise<string> => deviceIdData || '',
      setDeviceId: async (deviceId: string): Promise<void> => {
        deviceIdData = deviceId
      },
      removeDeviceId: async (): Promise<void> => {
        deviceIdData = null
      },
    }

    let uniswapIdentifierData: string | null = null
    uniswapIdentifierService = {
      getUniswapIdentifier: async (): Promise<string | null> => uniswapIdentifierData,
      setUniswapIdentifier: async (identifier: string): Promise<void> => {
        uniswapIdentifierData = identifier
      },
      removeUniswapIdentifier: async (): Promise<void> => {
        uniswapIdentifierData = null
      },
    }

    // In-memory repository implementation
    repository = {
      initSession: async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-123',
        needChallenge: false,
        extra: {},
      }),
      challenge: vi.fn(),
      upgradeSession: vi.fn(),
      deleteSession: vi.fn(),
    }

    service = createSessionService({
      sessionStorage: storage,
      sessionRepository: repository,
      deviceIdService,
      uniswapIdentifierService,
    })
  })

  describe('session lifecycle', () => {
    it('starts with no session', async () => {
      expect(await service.getSessionState()).toBeNull()
    })

    it('creates and retrieves sessions', async () => {
      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'test-session-123' })
    })

    it('removes sessions', async () => {
      await service.initSession()
      await service.removeSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('uses repository to generate session', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'custom-session-456',
        needChallenge: false,
        extra: {},
      })

      service = createSessionService({
        sessionStorage: storage,
        sessionRepository: repository,
        deviceIdService,
        uniswapIdentifierService,
      })

      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'custom-session-456' })
    })
  })

  describe('platform-specific behaviors', () => {
    it('stores session ID when provided (mobile/extension)', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'mobile-session-123',
        needChallenge: false,
        extra: {},
      })

      await service.initSession()
      expect(await service.getSessionState()).toEqual({ sessionId: 'mobile-session-123' })
    })

    it('does not store session when ID is undefined (web)', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: undefined, // Web uses cookies
        needChallenge: true,
        extra: { sitekey: 'turnstile-key' },
      })

      await service.initSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('handles different session ID values correctly', async () => {
      const sessionIds = ['mobile-123', 'extension-456', undefined]

      for (const sessionId of sessionIds) {
        // Reset storage
        await service.removeSession()

        repository.initSession = async (): Promise<{
          sessionId?: string
          needChallenge: boolean
          extra: Record<string, string>
        }> => ({
          sessionId,
          needChallenge: false,
          extra: {},
        })

        await service.initSession()

        if (sessionId) {
          expect(await service.getSessionState()).toEqual({ sessionId })
        } else {
          expect(await service.getSessionState()).toBeNull()
        }
      }
    })
  })

  describe('state persistence', () => {
    it('shares state between service instances using same storage', async () => {
      await service.initSession()

      const service2 = createSessionService({
        sessionStorage: storage,
        sessionRepository: repository,
        deviceIdService,
        uniswapIdentifierService,
      })

      expect(await service2.getSessionState()).toEqual({ sessionId: 'test-session-123' })
    })

    it('maintains independent state with different storage instances', async () => {
      // Create second set of dependencies
      let data2: { sessionId: string } | null = null
      const storage2: SessionStorage = {
        get: async (): Promise<{ sessionId: string } | null> => data2,
        set: async (newData): Promise<void> => {
          data2 = newData
        },
        clear: async (): Promise<void> => {
          data2 = null
        },
      }

      const service2 = createSessionService({
        sessionStorage: storage2,
        sessionRepository: repository,
        deviceIdService,
        uniswapIdentifierService,
      })

      await service.initSession()

      // Second service with its own storage should have its own session
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-456',
        needChallenge: false,
        extra: {},
      })

      await service2.initSession()

      expect(await service.getSessionState()).toEqual({ sessionId: 'test-session-123' })
      expect(await service2.getSessionState()).toEqual({ sessionId: 'test-session-456' })
    })
  })

  describe('error handling', () => {
    it('propagates storage read errors', async () => {
      storage.get = async (): Promise<{ sessionId: string } | null> => {
        throw new Error('Storage read failed')
      }

      await expect(service.getSessionState()).rejects.toThrow('Storage read failed')
    })

    it('propagates storage write errors', async () => {
      storage.set = async (): Promise<void> => {
        throw new Error('Storage write failed')
      }

      await expect(service.initSession()).rejects.toThrow('Storage write failed')
    })

    it('propagates repository errors', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => {
        throw new Error('API call failed')
      }

      await expect(service.initSession()).rejects.toThrow('API call failed')
    })

    it('preserves state when operations fail', async () => {
      await service.initSession()
      const originalState = await service.getSessionState()

      // Make clear fail
      storage.clear = async (): Promise<void> => {
        throw new Error('Clear failed')
      }

      await expect(service.removeSession()).rejects.toThrow('Clear failed')
      expect(await service.getSessionState()).toEqual(originalState)
    })
  })

  describe('integration scenarios', () => {
    it('handles complete session lifecycle', async () => {
      // Start with no session
      expect(await service.getSessionState()).toBeNull()

      // Create session
      await service.initSession()
      const session = await service.getSessionState()
      expect(session).toBeTruthy()
      expect(session?.sessionId).toBe('test-session-123')

      // Remove session
      await service.removeSession()
      expect(await service.getSessionState()).toBeNull()
    })

    it('handles multiple initialization attempts', async () => {
      // First initialization
      await service.initSession()
      const firstSession = await service.getSessionState()

      // Second initialization should replace
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'new-session-789',
        needChallenge: false,
        extra: {},
      })

      await service.initSession()
      const secondSession = await service.getSessionState()

      expect(secondSession).not.toEqual(firstSession)
      expect(secondSession).toEqual({ sessionId: 'new-session-789' })
    })
  })
  describe('device ID handling', () => {
    it('sets and gets device ID', async () => {
      // Second initialization should replace
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'new-session-789',
        needChallenge: false,
        extra: { device_id: 'test-device-id' },
      })

      await service.initSession()
      expect(await deviceIdService.getDeviceId()).toBe('test-device-id')
    })
  })

  describe('uniswap identifier handling', () => {
    it('persists uniswapIdentifier when provided in extra', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-123',
        needChallenge: false,
        extra: { uniswapIdentifier: '71cef16f-4d99-4082-987c-a6f810f9ca7f' },
      })

      await service.initSession()
      expect(await uniswapIdentifierService.getUniswapIdentifier()).toBe('71cef16f-4d99-4082-987c-a6f810f9ca7f')
    })

    it('does not persist uniswapIdentifier when not provided', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-123',
        needChallenge: false,
        extra: {},
      })

      await service.initSession()
      expect(await uniswapIdentifierService.getUniswapIdentifier()).toBeNull()
    })

    it('updates uniswapIdentifier on subsequent initSession calls', async () => {
      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-123',
        needChallenge: false,
        extra: { uniswapIdentifier: 'first-identifier' },
      })

      await service.initSession()
      expect(await uniswapIdentifierService.getUniswapIdentifier()).toBe('first-identifier')

      repository.initSession = async (): Promise<{
        sessionId?: string
        needChallenge: boolean
        extra: Record<string, string>
      }> => ({
        sessionId: 'test-session-456',
        needChallenge: false,
        extra: { uniswapIdentifier: 'second-identifier' },
      })

      await service.initSession()
      expect(await uniswapIdentifierService.getUniswapIdentifier()).toBe('second-identifier')
    })
  })
})
