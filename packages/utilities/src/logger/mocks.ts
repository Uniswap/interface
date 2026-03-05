// mock this since it errors about multiple SDK instances in test mode
vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    // leave it empty as we should avoid it in test mode
    logger: {},
  },
}))

/**
 * Creates a mock logger object with all methods as vi.fn() spies.
 * Call this function to get a fresh mock logger for each test if needed.
 */
export function createMockLogger(): {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  setDatadogEnabled: ReturnType<typeof vi.fn>
} {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  }
}

/**
 * Shared mock logger instance for use in tests.
 * Note: Due to vitest hoisting, importing this for spy assertions may not work
 * across module boundaries. See usage patterns below.
 */
export const mockLogger = createMockLogger()

/**
 * Mock implementation for utilities/src/logger/logger module.
 *
 * Usage patterns:
 *
 * 1. To simply silence the logger (no spy assertions needed):
 *    ```ts
 *    import 'utilities/src/logger/mocks'
 *    ```
 *
 * 2. To spy on logger calls (e.g., expect(mockLogger.error).toHaveBeenCalled()):
 *    Use vi.hoisted to ensure the mock is available before vi.mock runs:
 *    ```ts
 *    const { mockLogger } = vi.hoisted(() => ({
 *      mockLogger: {
 *        debug: vi.fn(),
 *        info: vi.fn(),
 *        warn: vi.fn(),
 *        error: vi.fn(),
 *        setDatadogEnabled: vi.fn(),
 *      },
 *    }))
 *
 *    vi.mock('utilities/src/logger/logger', () => ({
 *      logger: mockLogger,
 *    }))
 *    ```
 *
 * 3. To customize mocked functions like getLogger:
 *    ```ts
 *    import 'utilities/src/logger/mocks'
 *    import { getLogger } from 'utilities/src/logger/logger'
 *
 *    // In test:
 *    vi.mocked(getLogger).mockReturnValue({ warn: mockWarn } as unknown as ReturnType<typeof getLogger>)
 *    ```
 */
vi.mock('utilities/src/logger/logger', () => ({
  logger: mockLogger,
  getLogger: vi.fn(() => createMockLogger()),
  getDevLogger: vi.fn(() => createMockLogger()),
  createLogger: vi.fn(() => createMockLogger()),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  addErrorExtras: vi.fn((error, context) => context),
}))
