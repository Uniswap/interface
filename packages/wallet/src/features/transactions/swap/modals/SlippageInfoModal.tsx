import { Currency, TradeType } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import { slippageToleranceToPercent } from 'wallet/src/features/transactions/swap/utils'
import { ModalName } from 'wallet/src/telemetry/constants'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export type SlippageInfoModalProps = {
  trade: Trade<Currency, Currency, TradeType>
  isCustomSlippage: boolean
  autoSlippageTolerance?: number
  onClose: () => void
}

export function SlippageInfoModal({
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
  onClose,
}: SlippageInfoModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()

  const { slippageTolerance, tradeType } = trade
  const showSlippageWarning = autoSlippageTolerance && slippageTolerance > autoSlippageTolerance
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)
  const amount = formatCurrencyAmount({
    value:
      trade.tradeType === TradeType.EXACT_INPUT
        ? trade.minimumAmountOut(slippageTolerancePercent)
        : trade.maximumAmountIn(slippageTolerancePercent),
    type: NumberType.TokenTx,
  })
  const symbol =
    trade.tradeType === TradeType.EXACT_INPUT
      ? trade.outputAmount.currency.symbol
      : trade.inputAmount.currency.symbol

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.SlippageInfo}
      onClose={onClose}>
      <Flex centered fill gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
          <Icons.Settings color="$neutral2" size="$icon.28" />
        </Flex>
        <Text textAlign="center" variant="body1">
          {t('Maximum slippage')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {tradeType === TradeType.EXACT_INPUT
            ? t(
                'If the price slips any further, your transaction will revert. Below is the minimum amount you are guaranteed to receive.'
              )
            : t(
                'If the price slips any further, your transaction will revert. Below is the maximum amount you would need to spend.'
              )}{' '}
        </Text>
        <Flex
          fill
          bg="$surface2"
          borderRadius="$rounded20"
          gap="$spacing8"
          px="$spacing16"
          py="$spacing12"
          width="100%">
          <Flex fill row alignItems="center" gap="$spacing12" justifyContent="space-between">
            <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body2">
              {t('Max slippage')}
            </Text>
            <Flex row gap="$spacing8">
              {!isCustomSlippage ? (
                <Flex centered bg="$accent2" borderRadius="$roundedFull" px="$spacing8">
                  <Text color="$accent1" variant="buttonLabel4">
                    {t('Auto')}
                  </Text>
                </Flex>
              ) : null}
              <Text
                color={showSlippageWarning ? '$DEP_accentWarning' : '$neutral1'}
                variant="subheading2">
                {formatPercent(slippageTolerance)}
              </Text>
            </Flex>
          </Flex>
          <Flex fill row alignItems="center" gap="$spacing12" justifyContent="space-between">
            <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body2">
              {tradeType === TradeType.EXACT_INPUT ? t('Receive at least') : t('Spend at most')}
            </Text>
            <Text color="$neutral1" textAlign="center" variant="subheading2">
              {amount + ' ' + getSymbolDisplayText(symbol)}
            </Text>
          </Flex>
        </Flex>
        {showSlippageWarning ? (
          <Flex centered row gap="$spacing8">
            <AlertTriangleIcon
              color={colors.DEP_accentWarning.val}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
            <Text color="$DEP_accentWarning" variant="body2">
              {t('Slippage may be higher than necessary')}
            </Text>
          </Flex>
        ) : null}
        <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} />
        <Flex centered row gap="$spacing12" pt="$spacing12">
          <Button fill testID="slippage-info-close" theme="secondary" onPress={onClose}>
            {t('Close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
