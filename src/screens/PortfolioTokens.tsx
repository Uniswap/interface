import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SharedElement } from 'react-navigation-shared-element'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function PortfolioTokensScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioTokens>) {
  // avoid relayouts which causes an jitter with shared elements
  const insets = useSafeAreaInsets()

  return (
    <Box
      bg="mainBackground"
      flex={1}
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <PortfolioTokens expanded count={15} owner={owner} />
    </Box>
  )
}

export function PortfolioTokens({
  expanded,
  count,
  owner,
}: {
  count?: number
  expanded?: boolean
  owner?: string
}) {
  const { t } = useTranslation()
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const currentChains = useActiveChainIds()

  const { balances: balanceData, loading } = useAllBalancesByChainId(activeAddress, currentChains)

  // TODO: make state
  const viewType: ViewType = ViewType.Flat
  const balances = useMemo(
    () =>
      // TODO: add support for network view
      // viewType === ViewType.Network
      //   ? balanceData
      //   :
      flattenObjectOfObjects(balanceData ?? {}).slice(0, count),
    [balanceData, count]
  )

  const onPressToken = (currency: Currency) =>
    navigation.navigate(Screens.TokenDetails, { currency })

  return (
    <SharedElement id="portfolio-tokens-header">
      <Section.Container>
        {balances.length === 0 ? (
          <Section.EmptyState
            buttonLabel={t('Explore')}
            description={t(
              'Buy tokens on any Uniswap supported chains to start building your all-in-one portfolio and wallet.'
            )}
            title={t('Explore Tokens')}
            onPress={() => {
              // TODO: figure out how to navigate to explore
            }}
          />
        ) : (
          <TokenBalanceList
            balances={balances as PortfolioBalance[]}
            header={
              <Section.Header
                buttonLabel={t('View all')}
                expanded={expanded ?? false}
                subtitle={<TotalBalance balances={balanceData} variant="h3" />}
                title={t('Tokens')}
                onMaximize={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
                onMinimize={() => navigation.canGoBack() && navigation.goBack()}
              />
            }
            loading={loading}
            view={viewType}
            onPressToken={onPressToken}
          />
        )}
      </Section.Container>
    </SharedElement>
  )
}
