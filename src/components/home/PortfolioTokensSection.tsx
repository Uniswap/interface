import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function PortfolioTokensSection({ count, owner }: { count?: number; owner?: string }) {
  const { t } = useTranslation()
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const currentChains = useActiveChainIds()

  const { balances: balanceData, loading } = useAllBalancesByChainId(activeAddress, currentChains)

  // TODO: make state
  const viewType: ViewType = ViewType.Flat
  const { balances, totalCount } = useMemo(() => {
    // TODO: add support for network view
    // viewType === ViewType.Network
    //   ? balanceData
    //   :

    const allBalances = flattenObjectOfObjects(balanceData ?? {})
    return {
      balances: allBalances.slice(0, count),
      totalCount: allBalances.length,
    }
  }, [balanceData, count])

  const onPressToken = (currency: Currency) =>
    navigation.navigate(Screens.TokenDetails, { currencyId: currencyId(currency) })

  return (
    <BaseCard.Container>
      <TokenBalanceList
        balances={balances as PortfolioBalance[]}
        empty={
          <BaseCard.EmptyState
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
          <BaseCard.Header
            title={t('Tokens ({{totalCount}})', { totalCount })}
            onPress={() => navigation.navigate(Screens.PortfolioTokens, { owner })}
          />
        }
        loading={loading}
        view={viewType}
        onPressToken={onPressToken}
      />
    </BaseCard.Container>
  )
}
