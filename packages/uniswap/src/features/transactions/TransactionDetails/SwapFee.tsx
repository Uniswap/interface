import { Currency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { IndicativeLoadingWrapper } from 'uniswap/src/components/misc/IndicativeLoadingWrapper'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SwapFeeWarning } from 'uniswap/src/features/transactions/swap/modals/SwapFeeWarning'
import { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
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

  const formattedAmountFiat =
    swapFeeUsd && !isNaN(swapFeeUsd) ? convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) : undefined

  const swapFeeInfo = swapFee
    ? {
        noFeeCharged: swapFee.percent.equalTo(0),
        formattedPercent: formatPercent(swapFee.percent.toFixed()),
        formattedAmount:
          getFormattedCurrencyAmount(currency, swapFee.amount, formatter) + getSymbolDisplayText(currency.symbol),
        formattedAmountFiat,
      }
    : undefined

  if (!swapFeeInfo && !loading) {
    return null
  }

  const showFeePercentage = swapFeeInfo?.formattedPercent && !swapFeeInfo.noFeeCharged

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <SwapFeeWarning noFee={Boolean(swapFeeInfo?.noFeeCharged)}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.details.uniswapFee')}
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
