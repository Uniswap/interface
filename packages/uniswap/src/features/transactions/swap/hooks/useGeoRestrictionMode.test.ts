import { type Currency } from '@uniswap/sdk-core'
import { RestrictionReason, useIsFeatureGated, useTokenComplianceStatus } from '@universe/compliance'
import { useIsRWAToken } from 'uniswap/src/features/rwa/useIsRWAToken'
import { useGeoRestrictionMode } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import type { Mock } from 'vitest'

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useTokenComplianceStatus: vi.fn(),
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

function renderMode(): string {
  return renderHookWithProviders(() => useGeoRestrictionMode()).result.current
}

describe(useGeoRestrictionMode, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation((selector: DerivedSwapInfoSelector<unknown>) =>
      selector({ currencies: { input: { currency: INPUT_CURRENCY }, output: { currency: OUTPUT_CURRENCY } } }),
    )
    setReasonsByAddress({})
    mockUseIsFeatureGated.mockReturnValue(false)
    mockUseIsRWAToken.mockReturnValue(false)
  })

  it('returns default when neither token is restricted', () => {
    expect(renderMode()).toBe('default')
  })

  it('returns restricted when the output token is hard-blocked (DERIVATIVE)', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.DERIVATIVE] })
    expect(renderMode()).toBe('restricted')
  })

  it('returns restricted when the input token is hard-blocked (DERIVATIVE)', () => {
    setReasonsByAddress({ [INPUT_KEY]: [RestrictionReason.DERIVATIVE] })
    expect(renderMode()).toBe('restricted')
  })

  it('returns unrestricted when a token requires acknowledgement', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT] })
    expect(renderMode()).toBe('unrestricted')
  })

  it('returns unrestricted when a token is already acknowledged', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.ACKNOWLEDGED] })
    expect(renderMode()).toBe('unrestricted')
  })

  it('prefers restricted over unrestricted across the two swap tokens', () => {
    setReasonsByAddress({
      [INPUT_KEY]: [RestrictionReason.DERIVATIVE],
      [OUTPUT_KEY]: [RestrictionReason.REQUIRES_ACKNOWLEDGEMENT],
    })
    expect(renderMode()).toBe('restricted')
  })

  it('fails safe to restricted for an unrecognized (future) reason', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [999 as RestrictionReason] })
    expect(renderMode()).toBe('restricted')
  })

  it('returns default for UNSPECIFIED so the generic blocked-token UX handles it (not geo)', () => {
    setReasonsByAddress({ [OUTPUT_KEY]: [RestrictionReason.UNSPECIFIED] })
    expect(renderMode()).toBe('default')
  })

  it('returns restricted when RWA is region-blocked and the token is an RWA', () => {
    mockUseIsFeatureGated.mockReturnValue(true)
    mockUseIsRWAToken.mockReturnValue(true)
    expect(renderMode()).toBe('restricted')
  })

  it('falls through to compliance reasons when the region blocks RWA but the token is not an RWA', () => {
    mockUseIsFeatureGated.mockReturnValue(true)
    mockUseIsRWAToken.mockReturnValue(false)
    expect(renderMode()).toBe('default')
  })
})
