import { Currency } from '@uniswap/sdk-core'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, SectionList } from 'react-native'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { TokenBalanceListHeader } from 'src/components/TokenBalanceList/TokenBalanceListHeader'
import { balancesToSectionListData } from 'src/components/TokenBalanceList/utils'
import { useSortedPortfolioBalancesList } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { Screens } from 'src/screens/Screens'
import { toSupportedChainId } from 'src/utils/chainId'
import { currencyId } from 'src/utils/currencyId'

export enum ViewType {
  Flat = 'flat',
  Network = 'network',
}

type FlatViewProps = {
  view: ViewType.Flat
  count?: number
}

type NetworkViewProps = {
  view: ViewType.Network
  count?: number
}

type ViewProps = FlatViewProps | NetworkViewProps

type TokenBalanceListProps = {
  empty?: ReactElement | null
  onPressToken: (currency: Currency) => void
  onRefresh?: () => void
  refreshing?: boolean
  owner: Address
} & ViewProps

export function TokenBalanceList({
  owner,
  empty,
  onPressToken,
  view,
  count,
}: TokenBalanceListProps) {
  const balances = useSortedPortfolioBalancesList(owner, true)
  const { t } = useTranslation()
  const navigation = useHomeStackNavigation()

  const header: ReactElement = useMemo(
    () => (
      <BaseCard.Header
        title={t('Tokens ({{totalCount}})', { totalCount: balances.length })}
        onPress={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
      />
    ),
    [balances.length, navigation, owner, t]
  )

  const truncatedBalances = useMemo(() => balances.slice(0, count), [balances, count])

  return view === ViewType.Flat ? (
    <FlatBalanceList
      balances={truncatedBalances}
      empty={empty}
      header={header}
      onPressToken={onPressToken}
    />
  ) : (
    <NetworkBalanceList balances={truncatedBalances} header={header} onPressToken={onPressToken} />
  )
}

function key({ currency }: PortfolioBalance) {
  return currencyId(currency)
}

function FlatBalanceList({
  balances,
  empty,
  header,
  onPressToken,
}: Pick<TokenBalanceListProps, 'onPressToken' | 'empty'> & {
  header: ReactElement
  balances: PortfolioBalance[]
}) {
  return (
    <FlatList
      ItemSeparatorComponent={() => <Separator />}
      ListEmptyComponent={empty}
      ListHeaderComponent={header}
      data={balances}
      keyExtractor={key}
      renderItem={({ item }) => (
        <TokenBalanceItem
          key={currencyId(item.currency)}
          portfolioBalance={item}
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
}: Pick<TokenBalanceListProps, 'onPressToken'> & {
  header: ReactElement
  balances: PortfolioBalance[]
}) {
  const chainIdToCurrencyAmounts = useMemo(() => {
    return balancesToSectionListData(balances)
  }, [balances])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PortfolioBalance>) => (
      <TokenBalanceItem portfolioBalance={item} onPressToken={onPressToken} />
    ),
    [onPressToken]
  )

  return (
    <Trace logImpression section={SectionName.TokenBalance}>
      <SectionList
        ItemSeparatorComponent={() => <Separator />}
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
