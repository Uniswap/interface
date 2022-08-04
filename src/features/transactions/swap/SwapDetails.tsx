import { AnyAction } from '@reduxjs/toolkit'
import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { ComponentProps, Dispatch, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { Warning, WarningModalType } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import {
  GasSpeed,
  useSwapActionHandlers,
  useSwapGasFee,
} from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  GasFeeByTransactionType,
  OptimismL1FeeEstimate,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
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

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
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
  const account = useActiveAccountWithThrow()
  const theme = useAppTheme()
  const [showInverseRate, setShowInverseRate] = useState(false)
  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const price = acceptedTrade.executionPrice
  const usdcPrice = useUSDCPrice(showInverseRate ? price.baseCurrency : price.quoteCurrency)
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)
  const rate = getRateToDisplay(trade, showInverseRate)
  const gasFee = useSwapGasFee(gasFeeEstimate, GasSpeed.Urgent, optimismL1Fee)
  const gasFeeUSD = useUSDGasPrice(acceptedTrade.inputAmount.currency.chainId, gasFee)

  const swapWarning = warnings.find(showWarningInPanel)
  const swapWarningColor = getWarningColor(swapWarning)

  return (
    <Flex
      backgroundColor="backgroundContainer"
      borderRadius="lg"
      gap="none"
      spacerProps={spacerProps}>
      {newTradeToAccept ? (
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
      ) : null}
      {!newTradeToAccept && swapWarning ? (
        <Button onPress={() => onShowSwapWarning(WarningModalType.INFORMATIONAL)}>
          <Flex
            row
            alignItems="center"
            backgroundColor={swapWarningColor.background}
            borderTopEndRadius="lg"
            borderTopStartRadius="lg"
            flexGrow={1}
            gap="xs"
            p="md">
            <AlertTriangle color={theme.colors[swapWarningColor?.text]} height={18} width={18} />
            <Flex flexGrow={1}>
              <Text color={swapWarningColor.text} variant="subheadSmall">
                {swapWarning.title}
              </Text>
            </Flex>
            <InfoCircle color={theme.colors.accentTextLightSecondary} height={18} width={18} />
          </Flex>
        </Button>
      ) : null}
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
      <Flex row justifyContent="space-between" p="md">
        <Text fontWeight="500" variant="subheadSmall">
          {t('Network fee')}
        </Text>
        <Text variant="subheadSmall">${gasFeeUSD}</Text>
      </Flex>
      <Box p="md">
        <AccountDetails address={account?.address} iconSize={24} />
      </Box>
    </Flex>
  )
}
