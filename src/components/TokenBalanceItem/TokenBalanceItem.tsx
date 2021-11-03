import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'

// TODO(#89): use date manipulation util
const d = new Date()
const YESTERDAY = Math.round(d.setDate(d.getDate() - 1))

interface TokenBalanceItemProps {
  balance: CurrencyAmount<Currency> | null
}

export function TokenBalanceItem({ balance }: TokenBalanceItemProps) {
  const { data } = useHourlyTokenPrices({
    token: balance?.currency.wrapped,
    timestamp: YESTERDAY,
  })

  const percentChange = useMemo(() => {
    if (!data || data.tokenHourDatas?.length === 0) return '-'

    const { tokenHourDatas: prices } = data

    // TODO: get current price from chain
    const startingPrice = prices[prices.length - 1].close

    return `${(((prices[0].close - startingPrice) / startingPrice) * 100).toFixed(1)}%`
  }, [data])

  return (
    <Button
      backgroundColor="white"
      flexDirection="row"
      width="100%"
      justifyContent="space-between"
      marginVertical="sm">
      <Box flexDirection="row">
        <Box width={40} height={40} borderRadius="full" backgroundColor="blue" />
        <Box marginHorizontal="sm" alignItems="flex-start">
          <Text fontSize={20} fontWeight="500">
            {balance?.currency.symbol}
          </Text>
          <Text fontSize={14} fontWeight="400" color="gray400">{`${balance?.toSignificant(6)} ${
            balance?.currency.symbol
          }`}</Text>
        </Box>
      </Box>
      <Box alignItems="flex-end">
        <Text fontSize={20} fontWeight="400">
          $9000.32
        </Text>
        <Text fontSize={14} color={'green'}>
          {percentChange}
        </Text>
      </Box>
    </Button>
  )
}
