import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout/Flex'
import { Warning } from 'src/components/modals/WarningModal/types'
import { Text } from 'src/components/Text'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import {
  TransactionDetails,
  TRANSACTION_DETAILS_SPACER,
} from 'src/features/transactions/TransactionDetails'
import { formatPrice, NumberType } from 'src/utils/format'

interface SwapDetailsProps {
  acceptedTrade: Trade<Currency, Currency, TradeType>
  trade: Trade<Currency, Currency, TradeType>
  gasFee?: string
  gasFallbackUsed?: boolean
  newTradeToAccept: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  onShowGasWarning: () => void
}

export function SwapDetails({
  acceptedTrade,
  gasFee,
  gasFallbackUsed,
  newTradeToAccept,
  trade,
  warning,
  onAcceptTrade,
  onShowWarning,
  onShowGasWarning,
}: SwapDetailsProps): JSX.Element {
  const { t } = useTranslation()
  const [showInverseRate, setShowInverseRate] = useState(false)

  const price = acceptedTrade.executionPrice
  const usdcPrice = useUSDCPrice(showInverseRate ? price.quoteCurrency : price.baseCurrency)
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)
  const rate = getRateToDisplay(trade, showInverseRate)

  return (
    <TransactionDetails
      banner={
        newTradeToAccept ? (
          <Flex
            row
            alignItems="center"
            backgroundColor="accentActiveSoft"
            borderRadius="md"
            flexShrink={1}
            gap="sm"
            justifyContent="space-between"
            p="xs"
            pl="md">
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
              <TouchableArea
                backgroundColor="accentActive"
                borderRadius="sm"
                px="xs"
                py="xs"
                onPress={onAcceptTrade}>
                <Text color="textOnBrightPrimary" variant="buttonLabelSmall">
                  {t('Accept')}
                </Text>
              </TouchableArea>
            </Flex>
          </Flex>
        ) : null
      }
      chainId={acceptedTrade.inputAmount.currency.chainId}
      gasFallbackUsed={gasFallbackUsed}
      gasFee={gasFee}
      showWarning={warning && !newTradeToAccept}
      warning={warning}
      onShowGasWarning={onShowGasWarning}
      onShowWarning={onShowWarning}>
      <Flex
        row
        alignItems="center"
        borderBottomColor={TRANSACTION_DETAILS_SPACER.color}
        borderBottomWidth={TRANSACTION_DETAILS_SPACER.width}
        gap="xs"
        justifyContent="space-between"
        p="md">
        <Text variant="subheadSmall">{t('Rate')}</Text>
        <Flex row flex={1} flexBasis="100%" flexShrink={1} gap="none" justifyContent="flex-end">
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
    </TransactionDetails>
  )
}
