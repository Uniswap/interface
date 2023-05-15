import { Currency, TradeType } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { SWAP_SLIPPAGE_HELP_PAGE_URL } from 'src/constants/urls'
import { ModalName } from 'src/features/telemetry/constants'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { slippageToleranceToPercent } from 'src/features/transactions/swap/utils'
import { openUri } from 'src/utils/linking'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import { opacify } from 'ui/src/theme/color/utils'
import { formatCurrencyAmount, NumberType } from 'wallet/src/utils/format'

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

  const onPressLearnMore = (): void => {
    openUri(SWAP_SLIPPAGE_HELP_PAGE_URL)
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
      backgroundColor={theme.colors.background1}
      name={ModalName.SlippageInfo}
      onClose={onClose}>
      <Flex centered fill gap="spacing16" mb="spacing12" p="spacing24">
        <Flex
          centered
          borderRadius="rounded12"
          p="spacing12"
          style={{
            backgroundColor: opacify(12, theme.colors.textTertiary),
          }}>
          <SettingsIcon
            color={theme.colors.textTertiary}
            height={theme.iconSizes.icon28}
            width={theme.iconSizes.icon28}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {t('Maximum slippage')}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {tradeType === TradeType.EXACT_INPUT
            ? t(
                'If the price slips any further, your transaction will revert. Below is the minimum amount you are guaranteed to receive.'
              )
            : t(
                'If the price slips any further, your transaction will revert. Below is the maximum amount you would need to spend.'
              )}{' '}
          <TouchableArea height={18} onPress={onPressLearnMore}>
            <Text color="accentActive" variant="buttonLabelSmall">
              {t('Learn more')}
            </Text>
          </TouchableArea>
        </Text>
        <Flex fill bg="background2" borderRadius="rounded20" p="spacing12" width="100%">
          <Flex fill row justifyContent="space-between">
            <Text color="textSecondary" variant="bodySmall">
              {t('Max slippage')}
            </Text>
            <Flex row gap="spacing8">
              {!isCustomSlippage ? (
                <Flex centered bg="accentActionSoft" borderRadius="roundedFull" px="spacing8">
                  <Text color="accentAction" variant="buttonLabelMicro">
                    {t('Auto')}
                  </Text>
                </Flex>
              ) : null}
              <Text
                color={showSlippageWarning ? 'accentWarning' : 'textPrimary'}
                variant="subheadSmall">{`${slippageTolerance.toFixed(2).toString()}%`}</Text>
            </Flex>
          </Flex>
          <Flex fill row justifyContent="space-between">
            <Text color="textSecondary" variant="bodySmall">
              {tradeType === TradeType.EXACT_INPUT ? t('Receive at least') : t('Spend at most')}
            </Text>
            <Text color="textPrimary" textAlign="center" variant="subheadSmall">
              {amount + ' ' + symbol}
            </Text>
          </Flex>
        </Flex>
        {showSlippageWarning ? (
          <Flex centered row gap="spacing8">
            <AlertTriangleIcon
              color={theme.colors.accentWarning}
              height={theme.iconSizes.icon16}
              width={theme.iconSizes.icon16}
            />
            <Text color="accentWarning" variant="bodySmall">
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
