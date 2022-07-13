import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalanceQuery } from 'src/features/balances/__generated__/TotalBalanceQuery.graphql'
import { ChainIdToCurrencyIdToPortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { isTestnet, toSupportedChainId } from 'src/utils/chainId'
import { formatUSDPrice } from 'src/utils/format'
import { getKeys } from 'src/utils/objects'

interface TotalBalanceViewProps {
  balances: ChainIdToCurrencyIdToPortfolioBalance
  showRelativeChange?: boolean
  variant?: keyof Theme['textVariants']
}

export function TotalBalance({
  balances,
  showRelativeChange,
  variant = 'headlineLarge',
}: TotalBalanceViewProps) {
  const owner = useActiveAccountAddressWithThrow()
  const totalBalance = useMemo(
    () =>
      getKeys(balances)
        // always remove stub balances from  total
        .filter((chainId) => !isTestnet(toSupportedChainId(chainId)!))
        .reduce((sum, chainId) => {
          return (
            sum +
            Object.values(balances[chainId]!)
              .map((b) => b.balanceUSD)
              .reduce((chainSum, balanceUSD) => chainSum + balanceUSD, 0)
          )
        }, 0),
    [balances]
  )

  return (
    <Suspense fallback={<Loading type="header" />}>
      <Flex gap="xxs">
        <Text variant={variant}>{`${formatUSDPrice(totalBalance)}`}</Text>
        {showRelativeChange && <BalanceRelativeChange owner={owner} />}
      </Flex>
    </Suspense>
  )
}

function BalanceRelativeChange({
  owner,
}: Pick<TotalBalanceViewProps, 'variant'> & { owner: Address }) {
  const balance = useLazyLoadQuery<TotalBalanceQuery>(
    graphql`
      query TotalBalanceQuery($owner: String!) {
        portfolio(ownerAddress: $owner) {
          relativeChange24H
        }
      }
    `,
    { owner }
  )

  return <RelativeChange change={balance.portfolio?.relativeChange24H ?? 0} variant="body" />
}
