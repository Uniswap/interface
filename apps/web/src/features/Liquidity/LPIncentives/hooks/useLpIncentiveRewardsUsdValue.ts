import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'
import { LP_INCENTIVES_DUST_THRESHOLD, LP_INCENTIVES_REWARD_TOKEN } from '~/features/Liquidity/LPIncentives/constants'

interface UseLpIncentiveRewardsUsdValueResult {
  usdValue: CurrencyAmount<Currency> | null
  formattedUsdValue: string | undefined
}

// Parses a raw LP-incentive rewards amount (UNI base units) and returns its USDC value.
// Skips the network fetch entirely when the amount is below LP_INCENTIVES_DUST_THRESHOLD —
// Mainnet claim gas typically exceeds the USD value of sub-millicent UNI rewards.
export function useLpIncentiveRewardsUsdValue(tokenRewards: string): UseLpIncentiveRewardsUsdValueResult {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const rewardsAmount = useMemo(() => {
    try {
      const raw = tokenRewards || '0'
      if (BigInt(raw) < LP_INCENTIVES_DUST_THRESHOLD) {
        return null
      }
      return CurrencyAmount.fromRawAmount(LP_INCENTIVES_REWARD_TOKEN, raw)
    } catch {
      return null
    }
  }, [tokenRewards])

  const usdValue = useUSDCValue(rewardsAmount, PollingInterval.Slow)
  const formattedUsdValue = usdValue
    ? convertFiatAmountFormatted(usdValue.toExact(), NumberType.PortfolioBalance)
    : undefined

  return { usdValue, formattedUsdValue }
}
