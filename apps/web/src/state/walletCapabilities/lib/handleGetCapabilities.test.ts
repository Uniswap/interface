import { getCapabilities as wagmi_getCapabilities } from '@wagmi/core/experimental'
import {
  handleGetCapabilities,
  isAtomicBatchingSupportedByChainId,
} from 'state/walletCapabilities/lib/handleGetCapabilities'
import { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { getLogger } from 'utilities/src/logger/logger'

// Mock dependencies
jest.mock('@wagmi/core/experimental', () => ({
  getCapabilities: jest.fn(),
}))

jest.mock('components/Web3Provider/wagmiConfig', () => ({
  wagmiConfig: {},
}))

jest.mock('utilities/src/logger/logger', () => ({
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
  })),
}))

describe('walletCapabilities', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => jest.useRealTimers())

  describe('handleGetCapabilities', () => {
    const mockCapabilities: GetCapabilitiesResult = {
      '0x1': { atomic: { status: 'supported' } },
    }

    it('returns capabilities for valid response', async () => {
      ;(wagmi_getCapabilities as jest.Mock).mockResolvedValue(mockCapabilities)
      expect(await handleGetCapabilities()).toEqual(mockCapabilities)
    })

    it('returns null for invalid response', async () => {
      // Make sure the logger is properly mocked before the test
      const mockLoggerWarn = jest.fn()
      ;(getLogger as jest.Mock).mockReturnValue({ error: jest.fn(), warn: mockLoggerWarn })

      // Invalid mock response (missing 0x prefix)
      ;(wagmi_getCapabilities as jest.Mock).mockResolvedValue({ asdada: { atomic: { status: 'supported' } } })

      expect(await handleGetCapabilities()).toBeNull()
      expect(mockLoggerWarn).toHaveBeenCalled()
    })

    it('returns null on timeout', async () => {
      ;(wagmi_getCapabilities as jest.Mock).mockImplementation(() => new Promise(() => {}))
      const resultPromise = handleGetCapabilities()
      jest.advanceTimersByTime(5000)
      expect(await resultPromise).toBeNull()
    })

    it('returns null on error', async () => {
      // Make sure the logger is properly mocked before the test
      const mockLoggerWarn = jest.fn()
      ;(getLogger as jest.Mock).mockReturnValue({ error: jest.fn(), warn: mockLoggerWarn })
      ;(wagmi_getCapabilities as jest.Mock).mockRejectedValue(new Error('API error'))

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
