import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useDynamicConfigValue } from '@universe/gating'
import { useLPSlippageValue } from 'components/Liquidity/Create/hooks/useLPSlippageValues'
import { renderHook } from 'test-utils/render'
import { vi } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useDynamicConfigValue: vi.fn(),
}))

const useDynamicConfigValueMock = vi.mocked(useDynamicConfigValue)

describe('useLPSlippageValue', () => {
  const defaultSlippage = 2.5
  const v4SlippageOverride = 0.05

  beforeEach(() => {
    vi.clearAllMocks()
    useDynamicConfigValueMock
      .mockImplementationOnce(() => defaultSlippage)
      .mockImplementationOnce(() => v4SlippageOverride)
  })

  const makeCurrency = (isNative: boolean) => ({ isNative }) as any

  it('returns v4SlippageOverride for v4 + native pool', () => {
    const { result } = renderHook(() =>
      useLPSlippageValue({
        version: ProtocolVersion.V4,
        currencyA: makeCurrency(true),
        currencyB: makeCurrency(false),
      }),
    )
    expect(result.current).toBe(v4SlippageOverride)
  })

  it('returns defaultSlippage for v4 + non-native pool', () => {
    const { result } = renderHook(() =>
      useLPSlippageValue({
        version: ProtocolVersion.V4,
        currencyA: makeCurrency(false),
        currencyB: makeCurrency(false),
      }),
    )
    expect(result.current).toBe(defaultSlippage)
  })

  it('returns defaultSlippage for non-v4 + native pool', () => {
    const { result } = renderHook(() =>
      useLPSlippageValue({
        version: ProtocolVersion.V3,
        currencyA: makeCurrency(true),
        currencyB: makeCurrency(false),
      }),
    )
    expect(result.current).toBe(defaultSlippage)
  })

  it('returns defaultSlippage for non-v4 + non-native pool', () => {
    const { result } = renderHook(() =>
      useLPSlippageValue({
        version: ProtocolVersion.V2,
        currencyA: makeCurrency(false),
        currencyB: makeCurrency(false),
      }),
    )
    expect(result.current).toBe(defaultSlippage)
  })

  it('returns defaultSlippage if no version/currency provided', () => {
    const { result } = renderHook(() => useLPSlippageValue({}))
    expect(result.current).toBe(defaultSlippage)
  })
})
