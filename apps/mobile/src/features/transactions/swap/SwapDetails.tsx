import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/WarningModal/types'
import { TracePressEvent } from 'src/components/telemetry/TraceEvent'
import { Text } from 'src/components/Text'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import { ElementName } from 'src/features/telemetry/constants'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { formatPrice, NumberType } from 'wallet/src/utils/format'

interface SwapDetailsProps {
  acceptedTrade: Trade<Currency, Currency, TradeType>
  trade: Trade<Currency, Currency, TradeType>
  gasFee?: string
  gasFallbackUsed?: boolean
  customSlippageTolerance?: number
  autoSlippageTolerance?: number
  newTradeToAccept: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  onShowGasWarning: () => void
  onShowSlippageModal: () => void
}

export function SwapDetails({
  acceptedTrade,
  gasFee,
  gasFallbackUsed,
  newTradeToAccept,
  customSlippageTolerance,
  autoSlippageTolerance,
  trade,
  warning,
  onAcceptTrade,
  onShowWarning,
  onShowGasWarning,
  onShowSlippageModal,
}: SwapDetailsProps): JSX.Element {
  const theme = useAppTheme()
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

  return (
    <TransactionDetails
      banner={
        newTradeToAccept ? (
          <Flex
            row
            alignItems="center"
            backgroundColor="background2"
            borderRadius="rounded16"
            flexShrink={1}
            gap="spacing12"
            justifyContent="space-between"
            px="spacing12"
            py="spacing12">
            <Flex centered row gap="none">
              <Text color="accentActive" variant="subheadSmall">
                {t('New rate')}
              </Text>
            </Flex>
            <Flex row flex={1} flexBasis="100%" flexShrink={1} gap="none" justifyContent="flex-end">
              <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
                <Text
                  adjustsFontSizeToFit
                  color="accentActive"
                  numberOfLines={1}
                  textAlign="center"
                  variant="subheadSmall">
                  {rate}
                </Text>
              </TouchableOpacity>
            </Flex>
            <Flex centered row gap="none">
              <TracePressEvent element={ElementName.AcceptNewRate}>
                <TouchableArea
                  backgroundColor="accentActive"
                  borderRadius="rounded8"
                  px="spacing8"
                  py="spacing4"
                  onPress={onAcceptTrade}>
                  <Text color="textOnBrightPrimary" variant="buttonLabelSmall">
                    {t('Accept')}
                  </Text>
                </TouchableArea>
              </TracePressEvent>
            </Flex>
          </Flex>
        ) : null
      }
      chainId={acceptedTrade.inputAmount.currency.chainId}
      gasFallbackUsed={gasFallbackUsed}
      gasFee={gasFee}
      showExpandedChildren={!!customSlippageTolerance}
      showWarning={warning && !newTradeToAccept}
      warning={warning}
      onShowGasWarning={onShowGasWarning}
      onShowWarning={onShowWarning}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="subheadSmall">{t('Rate')}</Text>
        <Flex row flexShrink={1} gap="none" justifyContent="flex-end">
          <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
            <Text adjustsFontSizeToFit numberOfLines={1} variant="subheadSmall">
              {acceptedRate}
              <Text color="textSecondary" variant="subheadSmall">
                {usdcPrice && ` (${formatPrice(usdcPrice, NumberType.FiatTokenPrice)})`}
              </Text>
            </Text>
          </TouchableOpacity>
        </Flex>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onShowSlippageModal}>
          <Flex row gap="spacing4">
            <Text variant="subheadSmall">{t('Max slippage')}</Text>
            <InfoCircle
              color={theme.colors.textPrimary}
              height={theme.iconSizes.icon20}
              width={theme.iconSizes.icon20}
            />
          </Flex>
        </TouchableArea>
        <Flex row gap="spacing8">
          {!customSlippageTolerance ? (
            <Flex centered bg="accentActionSoft" borderRadius="roundedFull" px="spacing8">
              <Text color="accentAction" variant="buttonLabelMicro">
                {t('Auto')}
              </Text>
            </Flex>
          ) : null}
          <Text
            color={showSlippageWarning ? 'accentWarning' : 'textPrimary'}
            variant="subheadSmall">
            {`${acceptedTrade.slippageTolerance.toFixed(2).toString()}%`}
          </Text>
        </Flex>
      </Flex>
    </TransactionDetails>
  )
}
