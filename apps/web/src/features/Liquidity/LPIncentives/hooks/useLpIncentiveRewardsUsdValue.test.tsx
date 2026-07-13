import { renderHook } from '@testing-library/react'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { LP_INCENTIVES_REWARD_TOKEN } from '~/features/Liquidity/LPIncentives/constants'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'
import { mocked } from '~/test-utils/mocked'

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

const ONE_UNI_RAW = (BigInt(10) ** BigInt(LP_INCENTIVES_REWARD_TOKEN.decimals)).toString()
const FIVE_UNI_RAW = (BigInt(10) ** BigInt(LP_INCENTIVES_REWARD_TOKEN.decimals) * BigInt(5)).toString()
const POINT_ZERO_ZERO_ZERO_ONE_UNI_RAW = (BigInt(10) ** BigInt(LP_INCENTIVES_REWARD_TOKEN.decimals - 4)).toString() // 0.0001 UNI — below dust threshold

describe('useLpIncentiveRewardsUsdValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string | undefined | null) => `$${Number(value ?? 0).toFixed(2)}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
    mocked(useUSDCValue).mockReturnValue(null)
  })

  it('returns null usdValue and undefined formattedUsdValue when rewards are below the dust threshold', () => {
    const { result } = renderHook(() => useLpIncentiveRewardsUsdValue(POINT_ZERO_ZERO_ZERO_ONE_UNI_RAW))

    expect(result.current.usdValue).toBeNull()
    expect(result.current.formattedUsdValue).toBeUndefined()
  })

  it('passes null to useUSDCValue when below dust (does not fetch a price)', () => {
    renderHook(() => useLpIncentiveRewardsUsdValue(POINT_ZERO_ZERO_ZERO_ONE_UNI_RAW))

    expect(useUSDCValue).toHaveBeenCalledWith(null, expect.anything())
  })

  it('returns null and undefined when tokenRewards is an empty string', () => {
    const { result } = renderHook(() => useLpIncentiveRewardsUsdValue(''))

    expect(result.current.usdValue).toBeNull()
    expect(result.current.formattedUsdValue).toBeUndefined()
    expect(useUSDCValue).toHaveBeenCalledWith(null, expect.anything())
  })

  it('returns null and undefined when tokenRewards is an unparseable string', () => {
    const { result } = renderHook(() => useLpIncentiveRewardsUsdValue('not-a-number'))

    expect(result.current.usdValue).toBeNull()
    expect(result.current.formattedUsdValue).toBeUndefined()
    expect(useUSDCValue).toHaveBeenCalledWith(null, expect.anything())
  })

  it('returns the usdValue and formatted string when rewards are above the dust threshold and the price is available', () => {
    const fakeUsdValue = CurrencyAmount.fromRawAmount(USDC_MAINNET, '45660000') // $45.66
    mocked(useUSDCValue).mockReturnValue(fakeUsdValue)

    const { result } = renderHook(() => useLpIncentiveRewardsUsdValue(FIVE_UNI_RAW))

    expect(result.current.usdValue).toBe(fakeUsdValue)
    expect(result.current.formattedUsdValue).toBe('$45.66')
  })

  it('passes the parsed CurrencyAmount to useUSDCValue when above dust', () => {
    renderHook(() => useLpIncentiveRewardsUsdValue(ONE_UNI_RAW))

    const [amountArg] = mocked(useUSDCValue).mock.calls[0] ?? []
    expect(amountArg).not.toBeNull()
    expect(amountArg?.currency).toBe(LP_INCENTIVES_REWARD_TOKEN)
    expect(amountArg?.quotient.toString()).toBe(ONE_UNI_RAW)
  })

  it('returns null usdValue and undefined formatted when above dust but price is not yet loaded', () => {
    mocked(useUSDCValue).mockReturnValue(null)

    const { result } = renderHook(() => useLpIncentiveRewardsUsdValue(FIVE_UNI_RAW))

    expect(result.current.usdValue).toBeNull()
    expect(result.current.formattedUsdValue).toBeUndefined()
  })
})
