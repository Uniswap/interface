import { getCapabilities as wagmi_getCapabilities } from '@wagmi/core/experimental'
import {
  handleGetCapabilities,
  isAtomicBatchingSupportedByChainId,
} from 'state/walletCapabilities/lib/handleGetCapabilities'
import { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { getLogger } from 'utilities/src/logger/logger'
import type { Mock } from 'vitest'

// Mock dependencies
vi.mock('@wagmi/core/experimental', () => ({
  getCapabilities: vi.fn(),
}))

vi.mock('components/Web3Provider/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('utilities/src/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
  })),
}))

describe('walletCapabilities', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  describe('handleGetCapabilities', () => {
    const mockCapabilities: GetCapabilitiesResult = {
      '0x1': { atomic: { status: 'supported' } },
    }

    it('returns capabilities for valid response', async () => {
      ;(wagmi_getCapabilities as Mock).mockResolvedValue(mockCapabilities)
      expect(await handleGetCapabilities()).toEqual(mockCapabilities)
    })

    it('returns null for invalid response', async () => {
      // Make sure the logger is properly mocked before the test
      const mockLoggerWarn = vi.fn()
      ;(getLogger as Mock).mockReturnValue({ error: vi.fn(), warn: mockLoggerWarn })

      // Invalid mock response (missing 0x prefix)
      ;(wagmi_getCapabilities as Mock).mockResolvedValue({ asdada: { atomic: { status: 'supported' } } })

      expect(await handleGetCapabilities()).toBeNull()
      expect(mockLoggerWarn).toHaveBeenCalled()
    })

    it('returns null on timeout', async () => {
      ;(wagmi_getCapabilities as Mock).mockImplementation(() => new Promise(() => {}))
      const resultPromise = handleGetCapabilities()
      vi.advanceTimersByTime(5000)
      expect(await resultPromise).toBeNull()
    })

    it('returns null on error', async () => {
      // Make sure the logger is properly mocked before the test
      const mockLoggerWarn = vi.fn()
      ;(getLogger as Mock).mockReturnValue({ error: vi.fn(), warn: mockLoggerWarn })
      ;(wagmi_getCapabilities as Mock).mockRejectedValue(new Error('API error'))

      expect(await handleGetCapabilities()).toBeNull()
      expect(mockLoggerWarn).toHaveBeenCalled()
    })
  })

  describe('isAtomicBatchingSupportedByChainId', () => {
    const mockCapabilities: GetCapabilitiesResult = { '0x1': { atomic: { status: 'supported' } } }

    it('returns expected support status', () => {
      expect(isAtomicBatchingSupportedByChainId(mockCapabilities, 1)).toBe(true)

      const readyCapabilities: GetCapabilitiesResult = { '0x1': { atomic: { status: 'ready' } } }
      expect(isAtomicBatchingSupportedByChainId(readyCapabilities, 1)).toBe(true)

      const unsupportedCapabilities: GetCapabilitiesResult = { '0x1': { atomic: { status: 'unsupported' } } }
      expect(isAtomicBatchingSupportedByChainId(unsupportedCapabilities, 1)).toBe(false)

      expect(isAtomicBatchingSupportedByChainId(mockCapabilities, 2)).toBe(false)
    })
  })
})
