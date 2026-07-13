import { renderHook } from '@testing-library/react'
import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import type { providers } from 'ethers/lib/ethers'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import {
  getRecommendedGasFieldsFromQuoteGas,
  useRecommendedGasFields,
} from 'uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery', () => ({
  useGasFeeQuery: vi.fn(),
}))

const mockUseGasFeeQuery = useGasFeeQuery as unknown as Mock

describe('useRecommendedGasFields', () => {
  beforeEach(() => {
    mockUseGasFeeQuery.mockReturnValue({
      data: {
        params: {
          maxFeePerGas: '12000000000', // 12 GWEI
          maxPriorityFeePerGas: '2000000000', // 2 GWEI
          gasLimit: '21000',
        },
      },
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns the recommended fields derived from useGasFeeQuery', () => {
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBe('10') // 12 - 2
    expect(result.current.recommendedPriorityFeeGwei).toBe('2')
    expect(result.current.recommendedGasLimit).toBe('21000')
    expect(result.current.currentNetworkBaseFeeGwei).toBe('10')
    expect(result.current.isLoading).toBe(false)
  })

  it('requests the URGENT urgency level so the recommended baseline matches the fast tier', () => {
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    renderHook(() => useRecommendedGasFields({ tx }))
    expect(mockUseGasFeeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ tx, urgency: { level: Level.URGENT } }),
      }),
    )
  })

  it('returns undefined fields when params are missing (legacy / loading)', () => {
    mockUseGasFeeQuery.mockReturnValue({ data: undefined, isLoading: true, error: null })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.current.recommendedPriorityFeeGwei).toBeUndefined()
    expect(result.current.recommendedGasLimit).toBeUndefined()
    expect(result.current.currentNetworkBaseFeeGwei).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('returns undefined fields when the result is legacy (no maxFeePerGas)', () => {
    mockUseGasFeeQuery.mockReturnValue({
      data: { params: { gasPrice: '10000000000', gasLimit: '21000' } },
      isLoading: false,
      error: null,
    })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.current.recommendedPriorityFeeGwei).toBeUndefined()
    expect(result.current.recommendedGasLimit).toBeUndefined()
    expect(result.current.currentNetworkBaseFeeGwei).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('preserves sub-GWEI precision for the recommended values', () => {
    // Real values from a live /EstimateGasFee response — max base ≈ 0.14 GWEI,
    // priority ≈ 0.28 GWEI. Before the weiToGwei fix these truncated to "0".
    mockUseGasFeeQuery.mockReturnValue({
      data: {
        params: {
          maxFeePerGas: '425838314',
          maxPriorityFeePerGas: '283028660',
          gasLimit: '179262',
        },
      },
      isLoading: false,
      error: null,
    })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBe('0.142809654')
    expect(result.current.recommendedPriorityFeeGwei).toBe('0.28302866')
    expect(result.current.recommendedGasLimit).toBe('179262')
    expect(result.current.currentNetworkBaseFeeGwei).toBe('0.142809654')
  })

  it('returns undefined fields when tx is undefined (skipToken path)', () => {
    // Without a tx the query is skipped (skipToken in useGasFeeQuery returns
    // no data). Mirror that in the mock.
    mockUseGasFeeQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })
    const { result } = renderHook(() => useRecommendedGasFields({}))
    expect(result.current.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns undefined fields when maxPriorityFeePerGas is missing (partial EIP-1559 response)', () => {
    mockUseGasFeeQuery.mockReturnValue({
      data: { params: { maxFeePerGas: '12000000000', gasLimit: '21000' } },
      isLoading: false,
      error: null,
    })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.current.recommendedPriorityFeeGwei).toBeUndefined()
    expect(result.current.recommendedGasLimit).toBeUndefined()
  })

  it('returns undefined fields when gasLimit is missing (partial EIP-1559 response)', () => {
    mockUseGasFeeQuery.mockReturnValue({
      data: { params: { maxFeePerGas: '12000000000', maxPriorityFeePerGas: '2000000000' } },
      isLoading: false,
      error: null,
    })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.current.recommendedPriorityFeeGwei).toBeUndefined()
    expect(result.current.recommendedGasLimit).toBeUndefined()
  })

  it('floors baseFee at 0 when the service returns priority > maxFee', () => {
    // Misbehaving service: prio > maxFee. Pre-floor, sign-preserving BigInt
    // modulo would emit a malformed GWEI string.
    mockUseGasFeeQuery.mockReturnValue({
      data: {
        params: {
          maxFeePerGas: '1000000000', // 1 GWEI
          maxPriorityFeePerGas: '2000000000', // 2 GWEI
          gasLimit: '21000',
        },
      },
      isLoading: false,
      error: null,
    })
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBe('0')
    expect(result.current.recommendedPriorityFeeGwei).toBe('2')
    expect(result.current.currentNetworkBaseFeeGwei).toBe('0')
  })

  it('returns the quote-derived fallback when no tx-based estimate is available', () => {
    // No tx → query skipped → use the fallback (e.g. permit-signature swap).
    mockUseGasFeeQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })
    const fallback = {
      recommendedMaxBaseFeeGwei: '0.0005',
      recommendedPriorityFeeGwei: '0.001',
      recommendedGasLimit: '522820',
      currentNetworkBaseFeeGwei: '0.0005',
    }
    const { result } = renderHook(() => useRecommendedGasFields({ fallback }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBe('0.0005')
    expect(result.current.recommendedPriorityFeeGwei).toBe('0.001')
    expect(result.current.recommendedGasLimit).toBe('522820')
    expect(result.current.currentNetworkBaseFeeGwei).toBe('0.0005')
  })

  it('prefers the tx-based estimate over the fallback when both are available', () => {
    // beforeEach mock provides tx-based params (12/2 GWEI). The fallback must NOT win.
    const fallback = {
      recommendedMaxBaseFeeGwei: '0.0005',
      recommendedPriorityFeeGwei: '0.001',
      recommendedGasLimit: '522820',
      currentNetworkBaseFeeGwei: '0.0005',
    }
    const tx = { chainId: 1, from: '0x1', to: '0x2' } as providers.TransactionRequest
    const { result } = renderHook(() => useRecommendedGasFields({ tx, fallback }))
    expect(result.current.recommendedMaxBaseFeeGwei).toBe('10') // tx-based, not fallback
    expect(result.current.recommendedGasLimit).toBe('21000')
  })
})

describe('getRecommendedGasFieldsFromQuoteGas', () => {
  // Unichain-style gas estimate: sub-GWEI fees, with a fixed/unreliable
  // gasEstimate.gasLimit — so the gas limit must come from gasUseEstimate.
  const gasEstimate = {
    maxFeePerGas: '1500000',
    maxPriorityFeePerGas: '1000000',
    gasLimit: '61861', // intentionally ignored
    strategy: { limitInflationFactor: 1.15 },
  }

  it('derives base/priority from gasEstimate and gas limit from gasUseEstimate × inflation', () => {
    const result = getRecommendedGasFieldsFromQuoteGas({ gasUseEstimate: '454626', gasEstimate })
    expect(result.recommendedMaxBaseFeeGwei).toBe('0.0005') // (1500000 - 1000000) wei
    expect(result.recommendedPriorityFeeGwei).toBe('0.001') // 1000000 wei
    expect(result.recommendedGasLimit).toBe('522820') // round(454626 * 1.15), NOT 61861
    expect(result.currentNetworkBaseFeeGwei).toBe('0.0005')
  })

  it('falls back to gasEstimate.gasLimit when gasUseEstimate is absent', () => {
    const result = getRecommendedGasFieldsFromQuoteGas({ gasEstimate })
    expect(result.recommendedGasLimit).toBe('61861')
  })

  it('treats a missing limitInflationFactor as 1x', () => {
    const result = getRecommendedGasFieldsFromQuoteGas({
      gasUseEstimate: '454626',
      gasEstimate: { maxFeePerGas: '1500000', maxPriorityFeePerGas: '1000000' },
    })
    expect(result.recommendedGasLimit).toBe('454626')
  })

  it('returns all-undefined when the fee params are missing (e.g. legacy estimate)', () => {
    const result = getRecommendedGasFieldsFromQuoteGas({ gasUseEstimate: '454626', gasEstimate: { gasLimit: '61861' } })
    expect(result.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.recommendedPriorityFeeGwei).toBeUndefined()
    expect(result.recommendedGasLimit).toBeUndefined()
    expect(result.currentNetworkBaseFeeGwei).toBeUndefined()
  })

  it('returns all-undefined when given nothing', () => {
    const result = getRecommendedGasFieldsFromQuoteGas({})
    expect(result.recommendedMaxBaseFeeGwei).toBeUndefined()
    expect(result.recommendedGasLimit).toBeUndefined()
  })
})
