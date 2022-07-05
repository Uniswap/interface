import {
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Price,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { useUSDCPrice } from 'src/features/routing/useUSDCPrice'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { formatPrice } from 'src/utils/format'

interface SwapDetailsProps {
  currencyOut: CurrencyAmount<NativeCurrency | Token>
  trade: Trade<Currency, Currency, TradeType>
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

export function SwapDetails({ currencyOut, trade }: SwapDetailsProps) {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()

  const price = trade.executionPrice
  const usdcPrice = useUSDCPrice(currencyOut.currency)

  const rate = `1 ${price.quoteCurrency?.symbol} = ${getFormattedPrice(price)} ${
    price.baseCurrency?.symbol
  }`

  // TODO: replace with updated gas fee estimate
  const gasFeeUSD = parseFloat(trade.quote!.gasUseEstimateUSD).toFixed(2)

  return (
    <Flex
      backgroundColor="backgroundContainer"
      borderRadius="lg"
      gap="none"
      spacerProps={spacerProps}>
      <Flex row justifyContent="space-between" p="md">
        <Text color="mainForeground">{t('Rate')}</Text>
        <Flex row gap="none">
          <Text color="mainForeground">{rate}</Text>
          <Text color="textSecondary">
            {usdcPrice &&
              ` (${formatPrice(usdcPrice, { maximumFractionDigits: 6, notation: 'standard' })})`}
          </Text>
        </Flex>
      </Flex>
      <Flex row justifyContent="space-between" p="md">
        <Text color="mainForeground">{t('Network fee')}</Text>
        <Text color="mainForeground">${gasFeeUSD}</Text>
      </Flex>
      <Box p="md">
        <AccountDetails address={account?.address} />
      </Box>
    </Flex>
  )
}
