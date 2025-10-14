import { Currency } from '@uniswap/sdk-core'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { SwapFeeWarning } from 'uniswap/src/features/transactions/TransactionDetails/modals/SwapFeeWarning'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export function SwapFee({
  currency,
  swapFee,
  swapFeeUsd,
  loading,
}: {
  currency: Currency
  swapFee?: SwapFeeType
  swapFeeUsd?: number
  loading: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted, formatPercent, formatNumberOrString } = formatter

  // Track the last valid (non-loading) swapFee
  const lastValidSwapFee = useRef<SwapFeeType | undefined>(undefined)

  // Update the last valid swapFee when not loading
  if (!loading) {
    lastValidSwapFee.current = swapFee
  }

  const formattedAmountFiat =
    swapFeeUsd && !isNaN(swapFeeUsd) ? convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) : undefined

  const swapFeeInfo = swapFee
    ? {
        noFeeCharged: swapFee.percent.equalTo(0),
        formattedPercent: formatPercent(swapFee.percent.toFixed()),
        formattedAmount:
          getFormattedCurrencyAmount({ currency, amount: swapFee.amount, formatter }) +
          getSymbolDisplayText(currency.symbol),
        formattedAmountFiat,
      }
    : undefined

  // If we're loading and the last valid swapFee was null, don't show the fee line
  if (loading && !lastValidSwapFee.current) {
    return null
  }

  if (!swapFeeInfo && !loading) {
    return null
  }

  const showFeePercentage = swapFeeInfo?.formattedPercent && !swapFeeInfo.noFeeCharged
  const isJupiterSwap = currency.chainId === UniverseChainId.Solana

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <SwapFeeWarning noFee={Boolean(swapFeeInfo?.noFeeCharged)} isJupiter={isJupiterSwap}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {isJupiterSwap ? t('swap.fees.jupiter.label') : t('swap.details.uniswapFee')}
            {showFeePercentage && ` (${swapFeeInfo.formattedPercent})`}
          </Text>
        </Flex>
      </SwapFeeWarning>
      <IndicativeLoadingWrapper loading={loading}>
        {swapFeeInfo && (
          <Flex row alignItems="center" gap="$spacing8">
            <Flex row alignItems="center" justifyContent="space-between">
              <Text color="$neutral1" variant="body3">
                {swapFeeInfo.formattedAmountFiat ??
                  (swapFeeInfo.noFeeCharged
                    ? formatNumberOrString({ value: 0, type: NumberType.FiatGasPrice })
                    : swapFeeInfo.formattedAmount)}
              </Text>
            </Flex>
          </Flex>
        )}
      </IndicativeLoadingWrapper>
    </Flex>
  )
}
