import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { Inset } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Loading } from 'src/components/loading'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { TokenBalanceListHeader } from 'src/components/TokenBalanceList/TokenBalanceListHeader'
import { balancesToSectionListData } from 'src/components/TokenBalanceList/utils'
import { ChainIdToCurrencyIdToPortfolioBalance, PortfolioBalance } from 'src/features/dataApi/types'
import { SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { toSupportedChainId } from 'src/utils/chainId'
import { currencyId } from 'src/utils/currencyId'

interface TokenBalanceListProps {
  loading: boolean
  balances: ChainIdToCurrencyIdToPortfolioBalance
  refreshing: boolean
  onRefresh: () => void
  onPressToken: (currency: Currency) => void
}

export function TokenBalanceList({
  balances,
  loading,
  refreshing,
  onRefresh,
  onPressToken,
}: TokenBalanceListProps) {
  const chainIdToCurrencyAmounts = useMemo(() => {
    return balancesToSectionListData(balances)
  }, [balances])
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PortfolioBalance>) => (
      <TokenBalanceItem balance={item} onPressToken={onPressToken} />
    ),
    [onPressToken]
  )

  if (loading) {
    return (
      <Box padding="lg">
        <Loading repeat={4} type="box" />
      </Box>
    )
  }

  return (
    <Trace logImpression section={SectionName.TokenBalance}>
      <SectionList
        ListFooterComponent={
          <Inset all="xxl">
            <Inset all="md" />
          </Inset>
        }
        keyExtractor={key}
        refreshing={refreshing}
        renderItem={renderItem}
        renderSectionHeader={({ section: { chainId } }) => (
          <TokenBalanceListHeader chainId={toSupportedChainId(chainId)!} />
        )}
        sections={chainIdToCurrencyAmounts}
        onRefresh={onRefresh}
      />
    </Trace>
  )
}

function key({ amount }: PortfolioBalance) {
  return currencyId(amount.currency)
}
