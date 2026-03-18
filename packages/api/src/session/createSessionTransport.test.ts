import { createSessionTransport } from '@universe/api/src/session/createSessionTransport'
import { describe, expect, it } from 'vitest'

describe('createSessionTransport', () => {
  it('creates transport with baseUrl', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
    })

    expect(transport).toBeDefined()
  })

  it('includes credentials option when specified', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      credentials: 'include',
    })

    expect(transport).toBeDefined()
  })

  it('includes transportOptions when specified', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      transportOptions: {
        useBinaryFormat: true,
      },
    })

    expect(transport).toBeDefined()
  })

  it('creates transport with all options combined', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      headers: {
        'x-request-source': 'test',
        'x-uniswap-timezone': 'UTC',
      },
      cookie: 'session=abc123',
      credentials: 'include',
      getSessionId: async () => 'session-id',
      getDeviceId: async () => 'device-id',
      transportOptions: {
        useBinaryFormat: true,
      },
    })

    expect(transport).toBeDefined()
  })

  it('handles undefined getSessionId/getDeviceId', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      getSessionId: undefined,
      getDeviceId: undefined,
    })

    expect(transport).toBeDefined()
  })

  it('handles empty headers object', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      headers: {},
    })

    expect(transport).toBeDefined()
  })

  it('handles undefined cookie', () => {
    const transport = createSessionTransport({
      baseUrl: 'https://api.example.com',
      cookie: undefined,
    })

    expect(transport).toBeDefined()
  })
})
