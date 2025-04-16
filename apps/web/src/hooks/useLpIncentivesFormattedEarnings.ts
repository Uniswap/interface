import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount, type Currency } from '@uniswap/sdk-core'
import { PositionInfo } from 'components/Liquidity/types'
import { useMemo } from 'react'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

interface UseLpIncentivesFormattedEarningsProps {
  liquidityPosition: PositionInfo
  fiatFeeValue0?: CurrencyAmount<Currency>
  fiatFeeValue1?: CurrencyAmount<Currency>
}

interface LpIncentivesEarningsResult {
  lpIncentivesFormattedEarnings?: string
  uniLpRewardsCurrencyAmount?: CurrencyAmount<Currency>
  uniLpRewardsFiatValue?: CurrencyAmount<Currency>
}

export function useLpIncentivesFormattedEarnings({
  liquidityPosition,
  fiatFeeValue0,
  fiatFeeValue1,
}: UseLpIncentivesFormattedEarningsProps): LpIncentivesEarningsResult {
  const { formatCurrencyAmount } = useLocalizationContext()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const { price: uniPrice } = useUSDCPrice(UNI[UniverseChainId.Mainnet])

  return useMemo(() => {
    const result: LpIncentivesEarningsResult = {
      lpIncentivesFormattedEarnings: undefined,
      uniLpRewardsCurrencyAmount: undefined,
      uniLpRewardsFiatValue: undefined,
    }

    if (
      liquidityPosition.version !== ProtocolVersion.V4 ||
      !liquidityPosition.unclaimedRewardsAmountUni ||
      liquidityPosition.unclaimedRewardsAmountUni === '0' ||
      !isLPIncentivesEnabled
    ) {
      return result
    }

    // Create a UNI token amount from the unclaimed rewards (using Mainnet UNI)
    const uniLpRewardsCurrencyAmount = CurrencyAmount.fromRawAmount(
      UNI[UniverseChainId.Mainnet],
      liquidityPosition.unclaimedRewardsAmountUni,
    )

    // Set the UNI rewards currency amount in the result
    result.uniLpRewardsCurrencyAmount = uniLpRewardsCurrencyAmount

    // Convert UNI token amount to fiat value
    const uniLpRewardsFiatValue = uniPrice ? uniPrice.quote(uniLpRewardsCurrencyAmount) : undefined

    result.uniLpRewardsFiatValue = uniLpRewardsFiatValue

    // Format the UNI rewards value if available
    const formattedUniRewardsValue = uniLpRewardsFiatValue
      ? formatCurrencyAmount({
          value: uniLpRewardsFiatValue,
          type: NumberType.FiatStandard,
        })
      : undefined

    // Format the fees value if both fee values are available
    const formattedFeesValue =
      fiatFeeValue0 && fiatFeeValue1
        ? formatCurrencyAmount({
            value: fiatFeeValue0.add(fiatFeeValue1),
            type: NumberType.FiatStandard,
          })
        : undefined

    if (formattedFeesValue && formattedUniRewardsValue && fiatFeeValue0) {
      // Extract numeric values from the formatted strings
      // We need to handle different currency formats (e.g., $1,234.56, €1.234,56)
      const feesNumeric = parseFloat(formattedFeesValue.replace(/[^0-9.-]+/g, ''))
      const uniNumeric = parseFloat(formattedUniRewardsValue.replace(/[^0-9.-]+/g, ''))

      // Add the numeric values
      const totalNumeric = feesNumeric + uniNumeric

      // Format the total value using the same currency as fiatFeeValue0
      // This ensures we use the user's preferred currency
      result.lpIncentivesFormattedEarnings = formatCurrencyAmount({
        value: CurrencyAmount.fromRawAmount(
          fiatFeeValue0.currency,
          Math.floor(totalNumeric * Math.pow(10, fiatFeeValue0.currency.decimals)).toString(),
        ),
        type: NumberType.FiatStandard,
      })
    }
    // If we only have UNI rewards, return just that
    else if (formattedUniRewardsValue) {
      result.lpIncentivesFormattedEarnings = formattedUniRewardsValue
    }
    // If we only have fees, return just that
    else if (formattedFeesValue) {
      result.lpIncentivesFormattedEarnings = formattedFeesValue
    }

    return result
  }, [isLPIncentivesEnabled, fiatFeeValue0, fiatFeeValue1, formatCurrencyAmount, liquidityPosition, uniPrice])
}
