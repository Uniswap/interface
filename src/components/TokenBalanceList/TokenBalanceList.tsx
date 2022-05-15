import { Currency } from '@uniswap/sdk-core'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { ListRenderItemInfo, ScrollView, SectionList } from 'react-native'
import { Flex, Inset } from 'src/components/layout'
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

export enum ViewType {
  Flat = 'flat',
  Network = 'network',
}

type FlatViewProps = {
  view: ViewType.Flat
  balances: PortfolioBalance[]
}

type NetworkViewProps = {
  view: ViewType.Network
  balances: ChainIdToCurrencyIdToPortfolioBalance
}

type ViewProps = FlatViewProps | NetworkViewProps

type TokenBalanceListProps = {
  loading: boolean
  header: ReactElement
  refreshing?: boolean
  onRefresh?: () => void
  onPressToken: (currency: Currency) => void
} & ViewProps

export function TokenBalanceList({
  balances,
  header,
  loading,
  onPressToken,
  view,
}: TokenBalanceListProps) {
  if (loading) {
    return (
      <Box padding="sm">
        <Loading repeat={4} type="box" />
      </Box>
    )
  }

  if (view === ViewType.Flat) {
    return (
      <FlatBalanceList
        balances={balances as FlatViewProps['balances']}
        header={header}
        onPressToken={onPressToken}
      />
    )
  } else {
    return (
      <NetworkBalanceList
        balances={balances as NetworkViewProps['balances']}
        header={header}
        onPressToken={onPressToken}
      />
    )
  }
}

function key({ amount }: PortfolioBalance) {
  return currencyId(amount.currency)
}

function FlatBalanceList({
  balances,
  header,
  onPressToken,
}: Pick<FlatViewProps, 'balances'> & Pick<TokenBalanceListProps, 'onPressToken' | 'header'>) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Flex gap="none">
        {header}
        {balances.map((balance) => (
          <TokenBalanceItem
            key={currencyId(balance.amount.currency)}
            balance={balance}
            onPressToken={onPressToken}
          />
        ))}
      </Flex>
    </ScrollView>
  )
}

function NetworkBalanceList({
  balances,
  header,
  onPressToken,
}: Pick<NetworkViewProps, 'balances'> & Pick<TokenBalanceListProps, 'onPressToken' | 'header'>) {
  const chainIdToCurrencyAmounts = useMemo(() => {
    return balancesToSectionListData(balances)
  }, [balances])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PortfolioBalance>) => (
      <TokenBalanceItem balance={item} onPressToken={onPressToken} />
    ),
    [onPressToken]
  )

  return (
    <Trace logImpression section={SectionName.TokenBalance}>
      <SectionList
        ListFooterComponent={
          <Inset all="xxl">
            <Inset all="md" />
          </Inset>
        }
        ListHeaderComponent={header}
        keyExtractor={key}
        renderItem={renderItem}
        renderSectionHeader={({ section: { chainId } }) => (
          <TokenBalanceListHeader chainId={toSupportedChainId(chainId)!} />
        )}
        sections={chainIdToCurrencyAmounts}
      />
    </Trace>
  )
}
