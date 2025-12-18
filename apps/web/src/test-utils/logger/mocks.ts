// Import this file (test-utils/mocks/logger) at the top of a test file to mock
// the logger module. This prevents console.info/warn/error calls from
// logSwapQuoteFetch and other logging functions from triggering jest-fail-on-console.

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  },
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  })),
  getDevLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  })),
}))
