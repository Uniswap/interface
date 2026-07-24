import { act } from '@testing-library/react-native'
import { type Currency } from '@uniswap/sdk-core'
import {
  RestrictionReason,
  useIsFeatureGated,
  useSetTokenAcknowledgement,
  useTokenComplianceStatus,
} from '@universe/compliance'
import { useIsRWAToken } from 'uniswap/src/features/rwa/useIsRWAToken'
import {
  useGeoRestrictionAcknowledgment,
  useNeedsGeoAcknowledgment,
} from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import type { Mock } from 'vitest'

const acknowledgeToken = vi.fn()

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useTokenComplianceStatus: vi.fn(),
  useSetTokenAcknowledgement: vi.fn(),
  useIsFeatureGated: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useIsRWAToken', () => ({
  useIsRWAToken: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: vi.fn(),
  useSwapFormStoreDerivedSwapInfo: vi.fn(),
}))

type DerivedSwapInfoSelector<T> = (s: { currencies: Record<string, { currency?: Currency } | undefined> }) => T

const mockUseTokenComplianceStatus = useTokenComplianceStatus as Mock
const mockUseSetTokenAcknowledgement = useSetTokenAcknowledgement as Mock
const mockUseIsFeatureGated = useIsFeatureGated as Mock
const mockUseIsRWAToken = useIsRWAToken as Mock
const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as Mock

const INPUT_CURRENCY = { chainId: 1, isNative: false, address: '0xINPUT' } as unknown as Currency
const OUTPUT_CURRENCY = { chainId: 1, isNative: false, address: '0xOUTPUT' } as unknown as Currency
const INPUT_KEY = '0xinput'
const OUTPUT_KEY = '0xoutput'

function setReasonsByAddress(byAddress: Record<string, RestrictionReason[]>): void {
  mockUseTokenComplianceStatus.mockImplementation((token?: { address: string }) => ({
    reasons: token ? (byAddress[token.address] ?? []) : [],
    isLoading: false,
  }))
}

describe(useGeoRestrictionAcknowledgment, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    acknowledgeToken.mockResolvedValue(undefined)
    mockUseSetTokenAcknowledgement.mockReturnValue({ acknowledgeToken, isPending: false })
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: DerivedSwapInfoSelector<unknown>) =>
      selector({ currencies: { input: { currency: INPUT_CURRENCY }, output: { currency: OUTPUT_CURRENCY } } }),
    )
    setReasonsByAddress({})
    mockUseIsFeatureGated.mockReturnValue(false)
    mockUseIsRWAToken.mockReturnValue(false)
  })

  it('is not acknowledged while a token still requires acknowledgement', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT] })
    const { result } = renderHookWithProviders(() => useGeoRestrictionAcknowledgment())
    expect(result.current.hasAcknowledged).toBe(false)
  })

  it('is acknowledged once the ack-gated token reports ACKNOWLEDGED', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.ACKNOWLEDGED] })
    const { result } = renderHookWithProviders(() => useGeoRestrictionAcknowledgment())
    expect(result.current.hasAcknowledged).toBe(true)
  })

  it('is not acknowledged when no token is ack-gated', () => {
    const { result } = renderHookWithProviders(() => useGeoRestrictionAcknowledgment())
    expect(result.current.hasAcknowledged).toBe(false)
  })

  it('acknowledges only the token still requiring acknowledgement', async () => {
    setReasonsByAddress({
      [INPUT_KEY]: [RestrictionReason.ACKNOWLEDGED],
      [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT],
    })
    const { result } = renderHookWithProviders(() => useGeoRestrictionAcknowledgment())
    await act(async () => {
      await result.current.setAcknowledged()
    })
    expect(acknowledgeToken).toHaveBeenCalledTimes(1)
    expect(acknowledgeToken).toHaveBeenCalledWith({ chainId: 1, address: OUTPUT_KEY })
  })

  it('acknowledges both tokens when both require acknowledgement', async () => {
    setReasonsByAddress({
      [INPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT],
      [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT],
    })
    const { result } = renderHookWithProviders(() => useGeoRestrictionAcknowledgment())
    await act(async () => {
      await result.current.setAcknowledged()
    })
    expect(acknowledgeToken).toHaveBeenCalledTimes(2)
  })

  describe(useNeedsGeoAcknowledgment, () => {
    it('is true when a token requires acknowledgement and is unacknowledged', () => {
      setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT] })
      const { result } = renderHookWithProviders(() => useNeedsGeoAcknowledgment())
      expect(result.current).toBe(true)
    })

    it('is false once the token is acknowledged', () => {
      setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.ACKNOWLEDGED] })
      const { result } = renderHookWithProviders(() => useNeedsGeoAcknowledgment())
      expect(result.current).toBe(false)
    })

    it('is false for a hard-blocked (restricted) token', () => {
      setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.DERIVATIVE] })
      const { result } = renderHookWithProviders(() => useNeedsGeoAcknowledgment())
      expect(result.current).toBe(false)
    })
  })
})
