import {
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { Trade } from 'src/features/swap/useTrade'
import { formatCurrencyAmount, formatPrice } from 'src/utils/format'

interface SwapDetailsProps {
  currencyIn: CurrencyAmount<NativeCurrency | Token> | null | undefined
  currencyOut: CurrencyAmount<NativeCurrency | Token> | null | undefined
  trade: Trade<Currency, Currency, TradeType>
}

export function SwapDetails({ currencyOut, trade }: SwapDetailsProps) {
  const { t } = useTranslation()

  const minReceived = trade.worstExecutionPrice(new Percent(DEFAULT_SLIPPAGE_TOLERANCE, 100))
  const gasFeeUSD = parseFloat(trade.quote!.gasUseEstimateUSD).toFixed(2)

  return (
    <AnimatedBox entering={FadeIn}>
      <Flex borderColor="gray100" borderRadius="md" borderWidth={1} gap="xs" my="sm" p="md">
        <Text color="textColor" variant="h6">
          {t('Transaction Details')}
        </Text>
        <Box bg="gray100" height={1} my="xs" />
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="gray600" variant="h6">
            {t('Expected Output')}
          </Text>
          <Text color="gray600" variant="h6">
            {`${formatCurrencyAmount(currencyOut)} ${currencyOut?.currency.symbol}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="gray600" variant="h6">
            {t('Price Impact')}
          </Text>
          <Text color="gray600" variant="h6">
            {trade.priceImpact ? `${trade.priceImpact.multiply(-1).toFixed(2)}%` : '-'}
          </Text>
        </Box>
        <Box bg="gray100" height={1} my="xs" />
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="gray600" variant="h6">
            {`${t('Min. received after slippage')} (${DEFAULT_SLIPPAGE_TOLERANCE}%)`}
          </Text>
          <Text color="gray600" variant="h6">
            {`${formatPrice(minReceived).replace('$', '')} ${currencyOut?.currency.symbol}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="gray600" variant="h6">
            {t('Network Fee')}
          </Text>
          <Text color="gray600" variant="h6">
            {`~$${gasFeeUSD}`}
          </Text>
        </Box>
      </Flex>
    </AnimatedBox>
  )
}
