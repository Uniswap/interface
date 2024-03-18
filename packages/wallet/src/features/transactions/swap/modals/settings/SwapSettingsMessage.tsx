import { Currency, TradeType } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { slippageToleranceToPercent } from 'wallet/src/features/transactions/swap/utils'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export function SwapSettingsMessage({
  inputWarning,
  trade,
  slippageTolerance,
  showSlippageWarning,
}: {
  inputWarning?: string
  trade: Trade<Currency, Currency, TradeType> | null
  slippageTolerance: number
  showSlippageWarning: boolean
}): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex centered row gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
        <AlertTriangleIcon
          color={colors.DEP_accentWarning.val}
          height={iconSizes.icon16}
          width={iconSizes.icon16}
        />
        <Text color="$DEP_accentWarning" textAlign="center" variant="body2">
          {inputWarning}
        </Text>
      </Flex>
    )
  }

  return trade ? (
    <Flex centered gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
      <Text color="$neutral2" textAlign="center" variant="body2">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('swap.settings.slippage.input.receive.unformatted', {
              amount: formatCurrencyAmount({
                value: trade.minimumAmountOut(slippageTolerancePercent),
                type: NumberType.TokenTx,
              }),
              tokenSymbol: getSymbolDisplayText(trade.outputAmount.currency.symbol),
            })
          : t('swap.settings.slippage.output.spend.unformatted', {
              amount: formatCurrencyAmount({
                value: trade.maximumAmountIn(slippageTolerancePercent),
                type: NumberType.TokenTx,
              }),
              tokenSymbol: getSymbolDisplayText(trade.inputAmount.currency.symbol),
            })}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangleIcon
            color={colors.DEP_accentWarning.val}
            height={iconSizes.icon16}
            width={iconSizes.icon16}
          />
          <Text color="$DEP_accentWarning" variant="body2">
            {t('swap.settings.slippage.warning.message')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : (
    <Flex height={fonts.body2.lineHeight} />
  )
}
