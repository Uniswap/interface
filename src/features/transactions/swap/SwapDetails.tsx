import { AnyAction } from '@reduxjs/toolkit'
import {
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Price,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import React, { ComponentProps, Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { formatPrice } from 'src/utils/format'

interface SwapDetailsProps {
  currencyOut: CurrencyAmount<NativeCurrency | Token>
  trade: Trade<Currency, Currency, TradeType>
  warnings: Warning[]
  dispatch: Dispatch<AnyAction>
}

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
}

const getFormattedPrice = (price: Price<Currency, Currency>) => {
  try {
    return price.invert()?.toSignificant(4) ?? '-'
  } catch (error) {
    return '0'
  }
}

export function SwapDetails({ currencyOut, trade, warnings, dispatch }: SwapDetailsProps) {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()
  const theme = useAppTheme()
  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const price = trade.executionPrice
  const usdcPrice = useUSDCPrice(currencyOut.currency)

  const rate = `1 ${price.quoteCurrency?.symbol} = ${getFormattedPrice(price)} ${
    price.baseCurrency?.symbol
  }`

  // TODO: replace with updated gas fee estimate
  const gasFeeUSD = parseFloat(trade.quote!.gasUseEstimateUSD).toFixed(2)
  const swapWarning = warnings.find(showWarningInPanel)
  const swapWarningColor = getWarningColor(swapWarning)

  return (
    <Flex
      backgroundColor="backgroundContainer"
      borderRadius="lg"
      gap="none"
      spacerProps={spacerProps}>
      {swapWarning ? (
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
              <Text color={swapWarningColor.text}>{swapWarning.title}</Text>
            </Flex>
            <InfoCircle color={theme.colors.accentTextLightSecondary} height={18} width={18} />
          </Flex>
        </Button>
      ) : null}
      <Flex row justifyContent="space-between" p="md">
        <Text color="textPrimary">{t('Rate')}</Text>
        <Flex row gap="none">
          <Text color="textPrimary">{rate}</Text>
          <Text color="textSecondary">
            {usdcPrice &&
              ` (${formatPrice(usdcPrice, { maximumFractionDigits: 6, notation: 'standard' })})`}
          </Text>
        </Flex>
      </Flex>
      <Flex row justifyContent="space-between" p="md">
        <Text color="textPrimary">{t('Network fee')}</Text>
        <Text color="textPrimary">${gasFeeUSD}</Text>
      </Flex>
      <Box p="md">
        <AccountDetails address={account?.address} />
      </Box>
    </Flex>
  )
}
