import { Currency } from '@uniswap/sdk-core'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItemInfo, SectionList } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
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
  empty?: ReactElement | null
  header: ReactElement | null
  loading: boolean
  onPressToken: (currency: Currency) => void
  onRefresh?: () => void
  refreshing?: boolean
} & ViewProps

export function TokenBalanceList({
  balances,
  empty,
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

  return (
    <SharedElement id="portfolio-tokens-content">
      {view === ViewType.Flat ? (
        <FlatBalanceList
          balances={balances as FlatViewProps['balances']}
          empty={empty}
          header={header}
          onPressToken={onPressToken}
        />
      ) : (
        <NetworkBalanceList
          balances={balances as NetworkViewProps['balances']}
          header={header}
          onPressToken={onPressToken}
        />
      )}
    </SharedElement>
  )
}

function key({ amount }: PortfolioBalance) {
  return currencyId(amount.currency)
}

function FlatBalanceList({
  balances,
  empty,
  header,
  onPressToken,
}: Pick<FlatViewProps, 'balances'> &
  Pick<TokenBalanceListProps, 'onPressToken' | 'empty' | 'header'>) {
  return (
    <FlatList
      ListEmptyComponent={empty}
      ListHeaderComponent={header}
      data={balances}
      keyExtractor={(item: PortfolioBalance) => currencyId(item.amount.currency)}
      renderItem={({ item }) => (
        <TokenBalanceItem
          key={currencyId(item.amount.currency)}
          balance={item}
          onPressToken={onPressToken}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
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
