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
import { FADE_DURATION } from 'src/constants/animations'
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
    <AnimatedBox entering={FadeIn.duration(FADE_DURATION)}>
      <Flex gap="xs" borderRadius="md" borderColor="gray100" borderWidth={1} p="md" my="sm">
        <Text variant="h6" color="black">
          {t('Transaction Details')}
        </Text>
        <Box my="xs" height={1} bg="gray100" />
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="h6" color="gray600">
            {t('Expected Output')}
          </Text>
          <Text variant="h6" color="gray600">
            {`${formatCurrencyAmount(currencyOut)} ${currencyOut?.currency.symbol}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="h6" color="gray600">
            {t('Price Impact')}
          </Text>
          <Text variant="h6" color="gray600">
            {trade.priceImpact ? `${trade.priceImpact.multiply(-1).toFixed(2)}%` : '-'}
          </Text>
        </Box>
        <Box my="xs" height={1} bg="gray100" />
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="h6" color="gray600">
            {`${t('Min. received after slippage')} (${DEFAULT_SLIPPAGE_TOLERANCE}%)`}
          </Text>
          <Text variant="h6" color="gray600">
            {`${formatPrice(minReceived)} ${currencyOut?.currency.symbol}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="h6" color="gray600">
            {t('Network Fee')}
          </Text>
          <Text variant="h6" color="gray600">
            {`~$${gasFeeUSD}`}
          </Text>
        </Box>
      </Flex>
    </AnimatedBox>
  )
}
