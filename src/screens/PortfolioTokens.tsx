import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SharedElement } from 'react-navigation-shared-element'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Section } from 'src/components/layout/Section'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function PortfolioTokensScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioTokens>) {
  return (
    <Screen withSharedElementTransition>
      <AppBackground />
      <Flex grow m="sm">
        <PortfolioTokens expanded count={15} owner={owner} />
      </Flex>
    </Screen>
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
    navigation.navigate(Screens.TokenDetails, { currencyId: currencyId(currency) })

  return (
    <SharedElement id="portfolio-tokens-background">
      <Section.Container>
        <TokenBalanceList
          balances={balances as PortfolioBalance[]}
          empty={
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
          }
          header={
            <SharedElement id="portfolio-tokens-header">
              <Section.Header
                buttonLabel={t('View all')}
                expanded={expanded ?? false}
                subtitle={<TotalBalance balances={balanceData} variant="h3" />}
                title={t('Tokens')}
                onMaximize={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
                onMinimize={() => navigation.canGoBack() && navigation.goBack()}
              />
            </SharedElement>
          }
          loading={loading}
          view={viewType}
          onPressToken={onPressToken}
        />
      </Section.Container>
    </SharedElement>
  )
}
