import { BotDetectionType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createTurnstileSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileSolver'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock window.turnstile API
const mockTurnstileAPI = {
  render: vi.fn(),
  remove: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
  ready: vi.fn(),
}

// Setup DOM mocks
beforeAll(() => {
  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'div') {
      // Track created divs for assertions
      // eslint-disable-next-line no-extra-semi
      ;(element as any)._testCreated = true
    }
    return element
  })

  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    if (node instanceof HTMLScriptElement && node.src.includes('challenges.cloudflare.com')) {
      // Simulate script load immediately
      setTimeout(() => {
        // Set up the mock turnstile API
        // eslint-disable-next-line no-extra-semi
        ;(window as any).turnstile = mockTurnstileAPI
        if (node.onload) {
          node.onload({} as Event)
        }
      }, 0)
    }
    return node
  })

  const originalBodyAppendChild = document.body.appendChild.bind(document.body)
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    // eslint-disable-next-line no-extra-semi
    ;(node as any)._testAppended = true
    // Actually append to the DOM so we can query it later
    return originalBodyAppendChild(node)
  })

  vi.spyOn(Element.prototype, 'removeChild').mockImplementation(function (this: Element, child: Node) {
    // eslint-disable-next-line no-extra-semi
    ;(child as any)._testRemoved = true
    return child
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('Turnstile Solver Integration Tests', () => {
  beforeEach(() => {
    // Configure mock Turnstile API behavior
    mockTurnstileAPI.ready.mockImplementation((callback: () => void) => {
      // Call the callback immediately
      callback()
    })

    mockTurnstileAPI.render.mockImplementation((container: string | HTMLElement, options: any) => {
      // Simulate successful render and call the callback with a test token
      if (options.callback) {
        setTimeout(() => {
          options.callback('test-turnstile-solution-token')
        }, 10) // Small delay to simulate async behavior
      }
      return 'widget-123' // Return a mock widget ID
    })
  })

  afterEach(() => {
    // Clean up DOM
    document.querySelectorAll('div[id^="turnstile-"]').forEach((el) => el.remove())

    // Reset mocks to default successful behavior
    vi.clearAllMocks()
    ;(window as any).turnstile = undefined
  })

  it('verifies Turnstile solver basic functionality', async () => {
    // Create a challenge solver directly to test
    const turnstileSolver = createTurnstileSolver()

    // Create challenge data with proper structure
    const challengeData = {
      challengeId: 'dom-test-challenge-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: '0x4AAAAAABiAHneWOWZHzZtO',
          action: 'session_verification',
        }),
      },
    }

    // Execute the solver and wait for solution
    const solution = await turnstileSolver.solve(challengeData)

    // Verify solution was returned
    expect(solution).toBe('test-turnstile-solution-token')

    // Verify script injection was attempted
    expect(document.head.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
        async: true,
        defer: true,
      }),
    )
  })

  it('handles Turnstile solver errors properly', async () => {
    // Configure mock to simulate an error with proper timing
    mockTurnstileAPI.render.mockImplementation(async (container: string | HTMLElement, options: any) => {
      if (options['error-callback']) {
        // Use microtask to ensure promise handlers are set up
        await Promise.resolve().then(() => {
          options['error-callback']('NETWORK_ERROR')
        })
      }
      return 'widget-error-123'
    })

    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'error-test-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: 'test-site-key',
          action: 'test-action',
        }),
      },
    }

    // Should reject with Turnstile error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Turnstile error: NETWORK_ERROR')
  })

  it('handles expired tokens', async () => {
    // Configure mock to simulate token expiration
    mockTurnstileAPI.render.mockImplementation(async (container: string | HTMLElement, options: any) => {
      if (options['expired-callback']) {
        // Use microtask to ensure promise handlers are set up
        await Promise.resolve().then(() => {
          options['expired-callback']()
        })
      }
      return 'widget-expired-123'
    })

    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'expired-test-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: 'test-site-key',
          action: 'test-action',
        }),
      },
    }

    // Should reject with expiration error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Turnstile token expired')
  })

  it('handles timeout scenarios', async () => {
    // Configure mock to never call any callbacks
    mockTurnstileAPI.render.mockImplementation(() => {
      // Don't call any callbacks - simulate timeout
      return 'widget-timeout-123'
    })

    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'timeout-test-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: 'test-site-key',
          action: 'test-action',
        }),
      },
    }

    // Should reject with timeout error after 30 seconds
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Turnstile challenge timeout')
  }, 35000) // Extend test timeout since we're testing a 30s timeout

  it('handles missing challenge data', async () => {
    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'missing-data-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {}, // Missing challengeData
    }

    // Should reject with missing data error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Missing challengeData in challenge extra')
  })

  it('handles invalid challenge data JSON', async () => {
    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'invalid-json-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: 'invalid-json-{',
      },
    }

    // Should reject with JSON parse error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Failed to parse challengeData')
  })

  it('handles missing siteKey in challenge data', async () => {
    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'missing-sitekey-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          action: 'test-action',
          // Missing siteKey
        }),
      },
    }

    // Should reject with missing siteKey error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Missing siteKey in challengeData')
  })

  it('handles script loading failures', async () => {
    // Mock script loading failure
    vi.spyOn(document.head, 'appendChild').mockImplementationOnce((node) => {
      if (node instanceof HTMLScriptElement && node.src.includes('challenges.cloudflare.com')) {
        setTimeout(() => {
          if (node.onerror) {
            node.onerror({} as Event)
          }
        }, 0)
      }
      return node
    })

    const turnstileSolver = createTurnstileSolver()
    const challengeData = {
      challengeId: 'script-fail-123',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: 'test-site-key',
          action: 'test-action',
        }),
      },
    }

    // Should reject with script loading error
    await expect(turnstileSolver.solve(challengeData)).rejects.toThrow('Failed to load Turnstile script')
  })

  it('handles multiple concurrent solve requests', async () => {
    const turnstileSolver = createTurnstileSolver()

    // Create multiple challenge data objects
    const challenges = Array.from({ length: 3 }, (_, i) => ({
      challengeId: `concurrent-test-${i}`,
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: JSON.stringify({
          siteKey: `test-site-key-${i}`,
          action: 'test-action',
        }),
      },
    }))

    // Configure mock to return different tokens for each widget
    let widgetCounter = 0
    mockTurnstileAPI.render.mockImplementation((container: string | HTMLElement, options: any) => {
      const widgetId = `widget-${widgetCounter++}`
      if (options.callback) {
        setTimeout(() => {
          options.callback(`solution-for-${widgetId}`)
        }, 10)
      }
      return widgetId
    })

    // Execute all solvers concurrently
    const solutionPromises = challenges.map((challenge) => turnstileSolver.solve(challenge))

    // Wait for all solutions
    const solutions = await Promise.all(solutionPromises)

    // Verify all solutions are unique
    expect(solutions).toHaveLength(3)
    expect(new Set(solutions).size).toBe(3)
    solutions.forEach((solution) => {
      expect(solution).toMatch(/^solution-for-widget-\d+$/)
    })
  })
})
