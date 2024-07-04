import { Currency, TradeType } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { slippageToleranceToPercent } from 'wallet/src/features/transactions/swap/utils'

export function SwapSettingsMessage({
  inputWarning,
  trade,
  slippageTolerance,
  showSlippageWarning,
  showEmpty = true,
}: {
  inputWarning?: string
  trade: Trade<Currency, Currency, TradeType> | null
  slippageTolerance: number
  showSlippageWarning: boolean
  showEmpty?: boolean
}): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)

  if (inputWarning) {
    return (
      <Flex centered row gap="$spacing8" height={fonts.body2.lineHeight * 2 + spacing.spacing8}>
        <AlertTriangle color="$DEP_accentWarning" size="$icon.16" />
        <Text color="$DEP_accentWarning" textAlign="center" variant="body2">
          {inputWarning}
        </Text>
      </Flex>
    )
  }

  return trade ? (
    <Flex centered gap="$spacing8" py="$spacing4">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {trade.tradeType === TradeType.EXACT_INPUT
          ? t('swap.settings.slippage.input.receive.title')
          : t('swap.settings.slippage.output.spend.title')}{' '}
        {formatCurrencyAmount({
          value: trade.minimumAmountOut(slippageTolerancePercent),
          type: NumberType.TokenTx,
        })}{' '}
        {getSymbolDisplayText(
          trade.tradeType === TradeType.EXACT_INPUT
            ? trade.outputAmount.currency.symbol
            : trade.inputAmount.currency.symbol,
        )}
      </Text>
      {showSlippageWarning ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangle color={colors.DEP_accentWarning.val} size="$icon.16" />
          <Text color="$DEP_accentWarning" variant="body2">
            {t('swap.settings.slippage.warning.message')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : showEmpty ? (
    <Flex height={fonts.body2.lineHeight} />
  ) : null
}
