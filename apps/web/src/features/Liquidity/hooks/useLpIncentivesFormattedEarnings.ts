import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { LP_INCENTIVES_REWARD_TOKEN } from '~/features/Liquidity/LPIncentives/constants'

interface UseLpIncentivesFormattedEarningsProps {
  liquidityPosition: PositionInfo
  fiatFeeValue0: Maybe<CurrencyAmount<Currency>>
  fiatFeeValue1: Maybe<CurrencyAmount<Currency>>
}

interface LpIncentivesEarningsResult {
  uniLpRewardsCurrencyAmount?: CurrencyAmount<Currency>
  uniLpRewardsFiatValue?: CurrencyAmount<Currency>
  totalEarningsFiatValue?: CurrencyAmount<Currency>
  totalFormattedEarnings?: string
  totalFeesFiatValue?: CurrencyAmount<Currency>
  formattedFeesValue?: string
  formattedRewardsValue?: string
  hasRewards: boolean
  hasFees: boolean
}

export function useLpIncentivesFormattedEarnings({
  liquidityPosition,
  fiatFeeValue0,
  fiatFeeValue1,
}: UseLpIncentivesFormattedEarningsProps): LpIncentivesEarningsResult {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const { price: uniPrice } = useUSDCPrice(LP_INCENTIVES_REWARD_TOKEN)

  return useMemo(() => {
    const formatCurrency = (value: CurrencyAmount<Currency>) => {
      return convertFiatAmountFormatted(value.toExact(), NumberType.FiatStandard)
    }

    const result: LpIncentivesEarningsResult = {
      uniLpRewardsCurrencyAmount: undefined,
      uniLpRewardsFiatValue: undefined,
      totalFeesFiatValue: undefined,
      formattedFeesValue: undefined,
      formattedRewardsValue: undefined,
      hasRewards: false,
      hasFees: false,
      totalEarningsFiatValue: undefined,
      totalFormattedEarnings: undefined,
    }

    if (fiatFeeValue0 && fiatFeeValue1) {
      result.totalFeesFiatValue = fiatFeeValue0.add(fiatFeeValue1)
      result.formattedFeesValue = formatCurrency(result.totalFeesFiatValue)
      result.hasFees = result.totalFeesFiatValue.greaterThan(0)
    } else if (fiatFeeValue0) {
      result.totalFeesFiatValue = fiatFeeValue0
      result.formattedFeesValue = formatCurrency(result.totalFeesFiatValue)
      result.hasFees = result.totalFeesFiatValue.greaterThan(0)
    } else if (fiatFeeValue1) {
      result.totalFeesFiatValue = fiatFeeValue1
      result.formattedFeesValue = formatCurrency(result.totalFeesFiatValue)
      result.hasFees = result.totalFeesFiatValue.greaterThan(0)
    }

    const shouldIncludeRewards =
      liquidityPosition.version === ProtocolVersion.V4 &&
      liquidityPosition.unclaimedRewardsAmountUni &&
      liquidityPosition.unclaimedRewardsAmountUni !== '0' &&
      isLPIncentivesEnabled

    result.totalEarningsFiatValue = result.totalFeesFiatValue
    result.totalFormattedEarnings = result.formattedFeesValue

    // If no rewards and no LP incentives enabled, return early with just fees data
    if (!shouldIncludeRewards) {
      return result
    }

    // Create a UNI token amount from the unclaimed rewards (using Mainnet UNI)
    const uniLpRewardsCurrencyAmount = CurrencyAmount.fromRawAmount(
      LP_INCENTIVES_REWARD_TOKEN,
      liquidityPosition.unclaimedRewardsAmountUni as string,
    )

    // Set the UNI rewards currency amount in the result
    result.uniLpRewardsCurrencyAmount = uniLpRewardsCurrencyAmount
    result.hasRewards = uniLpRewardsCurrencyAmount.greaterThan(0)

    const uniLpRewardsFiatValue = uniPrice ? uniPrice.quote(uniLpRewardsCurrencyAmount) : undefined
    result.uniLpRewardsFiatValue = uniLpRewardsFiatValue

    if (uniLpRewardsFiatValue) {
      result.formattedRewardsValue = formatCurrency(uniLpRewardsFiatValue)
      // Fees and rewards may be in different USDC tokens with different decimals
      // (e.g. BNB USDC has 18 decimals, Mainnet USDC has 6). Add as numbers via
      // toExact() to avoid mixing quotients from different decimal scales.
      const feesExact = result.totalFeesFiatValue ? Number(result.totalFeesFiatValue.toExact()) : 0
      const rewardsExact = Number(uniLpRewardsFiatValue.toExact())
      const totalExact = feesExact + rewardsExact

      result.totalFormattedEarnings = convertFiatAmountFormatted(totalExact.toString(), NumberType.FiatStandard)
      // Build totalEarningsFiatValue in the fees currency so percentage calculations
      // in consumers (which compare against fiatFeeValue0/1.quotient) stay consistent.
      const targetCurrency = result.totalFeesFiatValue?.currency ?? uniLpRewardsFiatValue.currency
      result.totalEarningsFiatValue = CurrencyAmount.fromRawAmount(
        targetCurrency,
        JSBI.BigInt(Math.round(totalExact * 10 ** targetCurrency.decimals)),
      )
    }

    return result
  }, [fiatFeeValue0, fiatFeeValue1, liquidityPosition, isLPIncentivesEnabled, uniPrice, convertFiatAmountFormatted])
}
