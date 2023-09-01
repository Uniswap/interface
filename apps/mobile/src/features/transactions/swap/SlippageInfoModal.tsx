import { Currency, TradeType } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { slippageToleranceToPercent } from 'src/features/transactions/swap/utils'
import { openUri } from 'src/utils/linking'
import { Icons } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { fonts } from 'ui/src/theme'
import { formatCurrencyAmount, NumberType } from 'utilities/src/format/format'
import { SWAP_SLIPPAGE_HELP_PAGE_URL } from 'wallet/src/constants/urls'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'

export type SlippageInfoModalProps = {
  trade: Trade<Currency, Currency, TradeType>
  isCustomSlippage: boolean
  autoSlippageTolerance?: number
  onClose: () => void
}

export default function SlippageInfoModal({
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
  onClose,
}: SlippageInfoModalProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(SWAP_SLIPPAGE_HELP_PAGE_URL)
  }

  const { slippageTolerance, tradeType } = trade
  const showSlippageWarning = autoSlippageTolerance && slippageTolerance > autoSlippageTolerance
  const slippageTolerancePercent = slippageToleranceToPercent(slippageTolerance)
  const amount = formatCurrencyAmount(
    trade.tradeType === TradeType.EXACT_INPUT
      ? trade.minimumAmountOut(slippageTolerancePercent)
      : trade.maximumAmountIn(slippageTolerancePercent),
    NumberType.TokenTx
  )
  const symbol =
    trade.tradeType === TradeType.EXACT_INPUT
      ? trade.outputAmount.currency.symbol
      : trade.inputAmount.currency.symbol

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.surface1}
      name={ModalName.SlippageInfo}
      onClose={onClose}>
      <Flex centered fill gap="spacing16" mb="spacing12" p="spacing24">
        <Flex centered backgroundColor="surface2" borderRadius="rounded12" p="spacing12">
          <Icons.Settings
            color={theme.colors.neutral2}
            height={theme.iconSizes.icon28}
            width={theme.iconSizes.icon28}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {t('Maximum slippage')}
        </Text>
        <Text color="neutral2" textAlign="center" variant="bodySmall">
          {tradeType === TradeType.EXACT_INPUT
            ? t(
                'If the price slips any further, your transaction will revert. Below is the minimum amount you are guaranteed to receive.'
              )
            : t(
                'If the price slips any further, your transaction will revert. Below is the maximum amount you would need to spend.'
              )}{' '}
          <TouchableArea onPress={onPressLearnMore}>
            <Text
              color="accent1"
              lineHeight={fonts.bodySmall.fontSize - 1}
              variant="buttonLabelSmall">
              {t('Learn more')}
            </Text>
          </TouchableArea>
        </Text>
        <Flex fill bg="surface2" borderRadius="rounded20" p="spacing12" width="100%">
          <Flex fill row justifyContent="space-between">
            <Text color="neutral2" variant="bodySmall">
              {t('Max slippage')}
            </Text>
            <Flex row gap="spacing8">
              {!isCustomSlippage ? (
                <Flex centered bg="accent2" borderRadius="roundedFull" px="spacing8">
                  <Text color="accent1" variant="buttonLabelMicro">
                    {t('Auto')}
                  </Text>
                </Flex>
              ) : null}
              <Text
                color={showSlippageWarning ? 'DEP_accentWarning' : 'neutral1'}
                variant="subheadSmall">{`${slippageTolerance.toFixed(2).toString()}%`}</Text>
            </Flex>
          </Flex>
          <Flex fill row justifyContent="space-between">
            <Text color="neutral2" variant="bodySmall">
              {tradeType === TradeType.EXACT_INPUT ? t('Receive at least') : t('Spend at most')}
            </Text>
            <Text color="neutral1" textAlign="center" variant="subheadSmall">
              {amount + ' ' + symbol}
            </Text>
          </Flex>
        </Flex>
        {showSlippageWarning ? (
          <Flex centered row gap="spacing8">
            <AlertTriangleIcon
              color={theme.colors.DEP_accentWarning}
              height={theme.iconSizes.icon16}
              width={theme.iconSizes.icon16}
            />
            <Text color="DEP_accentWarning" variant="bodySmall">
              {t('Slippage may be higher than necessary')}
            </Text>
          </Flex>
        ) : null}
        <Flex centered row gap="spacing12" pt="spacing12">
          <Button fill emphasis={ButtonEmphasis.Secondary} label={t('Close')} onPress={onClose} />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
