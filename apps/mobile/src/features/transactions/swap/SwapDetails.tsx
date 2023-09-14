import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/WarningModal/types'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { ElementName } from 'src/features/telemetry/constants'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { Icons, useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { formatPrice, NumberType } from 'utilities/src/format/format'
import { useUSDCPrice } from 'wallet/src/features/routing/useUSDCPrice'
import { useShouldUseMEVBlocker } from 'wallet/src/features/transactions/swap/customRpc'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'

interface SwapDetailsProps {
  acceptedTrade: Trade<Currency, Currency, TradeType>
  trade: Trade<Currency, Currency, TradeType>
  gasFeeUSD?: string
  gasFallbackUsed?: boolean
  customSlippageTolerance?: number
  autoSlippageTolerance?: number
  newTradeRequiresAcceptance: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  onShowGasWarning: () => void
  onShowSlippageModal: () => void
  onShowSwapProtectionModal: () => void
}

export function SwapDetails({
  acceptedTrade,
  gasFeeUSD,
  gasFallbackUsed,
  newTradeRequiresAcceptance,
  customSlippageTolerance,
  autoSlippageTolerance,
  trade,
  warning,
  onAcceptTrade,
  onShowWarning,
  onShowGasWarning,
  onShowSlippageModal,
  onShowSwapProtectionModal,
}: SwapDetailsProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [showInverseRate, setShowInverseRate] = useState(false)

  const price = acceptedTrade.executionPrice
  const usdcPrice = useUSDCPrice(showInverseRate ? price.quoteCurrency : price.baseCurrency)
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)
  const rate = getRateToDisplay(trade, showInverseRate)

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning = autoSlippageTolerance
    ? acceptedTrade.slippageTolerance > autoSlippageTolerance
    : false

  const shouldUseMevBlocker = useShouldUseMEVBlocker(trade?.inputAmount.currency.chainId)

  return (
    <TransactionDetails
      banner={
        newTradeRequiresAcceptance ? (
          <Flex
            row
            alignItems="center"
            backgroundColor="surface2"
            borderRadius="rounded16"
            flexShrink={1}
            gap="spacing12"
            justifyContent="space-between"
            px="spacing12"
            py="spacing12">
            <Flex centered row gap="none">
              <Text color="accent1" variant="subheadSmall">
                {t('New rate')}
              </Text>
            </Flex>
            <Flex row flex={1} flexBasis="100%" flexShrink={1} gap="none" justifyContent="flex-end">
              <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
                <Text
                  adjustsFontSizeToFit
                  color="accent1"
                  numberOfLines={1}
                  textAlign="center"
                  variant="subheadSmall">
                  {rate}
                </Text>
              </TouchableOpacity>
            </Flex>
            <Flex centered row gap="none">
              <Trace logPress element={ElementName.AcceptNewRate}>
                <TouchableArea
                  backgroundColor="accent1"
                  borderRadius="rounded8"
                  px="spacing8"
                  py="spacing4"
                  onPress={onAcceptTrade}>
                  <Text color="sporeWhite" variant="buttonLabelSmall">
                    {t('Accept')}
                  </Text>
                </TouchableArea>
              </Trace>
            </Flex>
          </Flex>
        ) : null
      }
      chainId={acceptedTrade.inputAmount.currency.chainId}
      gasFallbackUsed={gasFallbackUsed}
      gasFeeUSD={gasFeeUSD}
      showExpandedChildren={!!customSlippageTolerance}
      showWarning={warning && !newTradeRequiresAcceptance}
      warning={warning}
      onShowGasWarning={onShowGasWarning}
      onShowWarning={onShowWarning}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="subheadSmall">{t('Rate')}</Text>
        <Flex row flexShrink={1} gap="none" justifyContent="flex-end">
          <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
            <Text adjustsFontSizeToFit numberOfLines={1} variant="subheadSmall">
              {acceptedRate}
              <Text color="neutral2" variant="subheadSmall">
                {usdcPrice && ` (${formatPrice(usdcPrice, NumberType.FiatTokenPrice)})`}
              </Text>
            </Text>
          </TouchableOpacity>
        </Flex>
      </Flex>
      {shouldUseMevBlocker && (
        <Flex row alignItems="center" justifyContent="space-between">
          <TouchableArea onPress={onShowSwapProtectionModal}>
            <Flex centered row gap="spacing4">
              <Text variant="subheadSmall">{t('Swap protection')}</Text>
              <InfoCircle
                color={colors.neutral1.val}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            </Flex>
          </TouchableArea>
          <Flex centered row gap="spacing8">
            <Icons.ShieldCheck
              color={colors.neutral3.val}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
            <Text color="neutral1" variant="subheadSmall">
              {t('On')}
            </Text>
          </Flex>
        </Flex>
      )}
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onShowSlippageModal}>
          <Flex centered row gap="spacing4">
            <Text variant="subheadSmall">{t('Max slippage')}</Text>
            <InfoCircle
              color={colors.neutral1.val}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </Flex>
        </TouchableArea>
        <Flex row gap="spacing8">
          {!customSlippageTolerance ? (
            <Flex centered bg="accent2" borderRadius="roundedFull" px="spacing8">
              <Text color="accent1" variant="buttonLabelMicro">
                {t('Auto')}
              </Text>
            </Flex>
          ) : null}
          <Text
            color={showSlippageWarning ? 'DEP_accentWarning' : 'neutral1'}
            variant="subheadSmall">
            {`${acceptedTrade.slippageTolerance.toFixed(2).toString()}%`}
          </Text>
        </Flex>
      </Flex>
    </TransactionDetails>
  )
}
