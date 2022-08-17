import { AnyAction } from '@reduxjs/toolkit'
import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { Dispatch, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Warning, WarningModalType } from 'src/components/warnings/types'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import {
  GasSpeed,
  useSwapActionHandlers,
  useSwapGasFee,
} from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import {
  GasFeeByTransactionType,
  OptimismL1FeeEstimate,
} from 'src/features/transactions/transactionState/transactionState'
import { formatPrice } from 'src/utils/format'

interface SwapDetailsProps {
  acceptedTrade: Trade<Currency, Currency, TradeType>
  trade: Trade<Currency, Currency, TradeType>
  dispatch: Dispatch<AnyAction>
  gasFeeEstimate?: GasFeeByTransactionType
  optimismL1Fee?: OptimismL1FeeEstimate
  newTradeToAccept: boolean
  warnings: Warning[]
  onAcceptTrade: () => void
}

export function SwapDetails({
  acceptedTrade,
  dispatch,
  gasFeeEstimate,
  optimismL1Fee,
  newTradeToAccept,
  trade,
  warnings,
  onAcceptTrade,
}: SwapDetailsProps) {
  const { t } = useTranslation()
  const [showInverseRate, setShowInverseRate] = useState(false)
  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const price = acceptedTrade.executionPrice
  const usdcPrice = useUSDCPrice(showInverseRate ? price.quoteCurrency : price.baseCurrency)
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)
  const rate = getRateToDisplay(trade, showInverseRate)
  const gasFee = useSwapGasFee(gasFeeEstimate, GasSpeed.Urgent, optimismL1Fee)

  const swapWarning = warnings.find(showWarningInPanel)
  const showWarning = swapWarning && !newTradeToAccept
  const onShowWarning = () => onShowSwapWarning(WarningModalType.INFORMATIONAL)

  return (
    <TransactionDetails
      chainId={acceptedTrade.inputAmount.currency.chainId}
      gasFee={gasFee}
      showWarning={showWarning}
      warning={swapWarning}
      onShowWarning={onShowWarning}>
      {newTradeToAccept && (
        <Flex
          row
          alignItems="center"
          backgroundColor="accentActiveSoft"
          borderTopEndRadius="lg"
          borderTopStartRadius="lg"
          flexGrow={1}
          gap="xs"
          justifyContent="space-between"
          p="xs">
          <Flex centered row flexBasis="30%" gap="none">
            <Text color="blue300" variant="subheadSmall">
              {t('Rate Updated')}
            </Text>
          </Flex>
          <Flex row flexBasis="70%" gap="xxs">
            <Flex centered row flexBasis="66%" flexGrow={1} gap="none">
              <TouchableOpacity onPress={() => setShowInverseRate(!showInverseRate)}>
                <Text adjustsFontSizeToFit color="blue300" numberOfLines={1} variant="subheadSmall">
                  {rate}
                </Text>
              </TouchableOpacity>
            </Flex>
            <Flex centered row flexBasis="33%" flexGrow={1} gap="none">
              <Button
                backgroundColor="accentActive"
                borderRadius="md"
                padding="xs"
                onPress={onAcceptTrade}>
                <Text variant="smallLabel">{t('Accept')}</Text>
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}
      <Flex row alignItems="center" gap="xs" justifyContent="space-between" p="md">
        <Text fontWeight="500" variant="subheadSmall">
          {t('Rate')}
        </Text>
        <TouchableOpacity onPress={() => setShowInverseRate(!showInverseRate)}>
          <Flex row gap="none">
            <Text variant="subheadSmall">{acceptedRate}</Text>
            <Text color="textSecondary" variant="subheadSmall">
              {usdcPrice &&
                ` (${formatPrice(usdcPrice, { maximumFractionDigits: 6, notation: 'standard' })})`}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </TransactionDetails>
  )
}
