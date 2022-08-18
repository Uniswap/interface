import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalanceQuery } from 'src/features/balances/__generated__/TotalBalanceQuery.graphql'
import { usePortfolioBalancesList } from 'src/features/dataApi/balances'
import { Theme } from 'src/styles/theme'
import { isTestnet, toSupportedChainId } from 'src/utils/chainId'
import { formatUSDPrice } from 'src/utils/format'

interface TotalBalanceViewProps {
  owner: Address
  showRelativeChange?: boolean
  variant?: keyof Theme['textVariants']
}

export function TotalBalance({
  owner,
  showRelativeChange,
  variant = 'headlineLarge',
}: TotalBalanceViewProps) {
  return (
    <Suspense fallback={<Loading type="header" />}>
      <Flex gap="xxs">
        <TotalUSDBalance owner={owner} variant={variant} />
        {showRelativeChange && owner && <BalanceRelativeChange owner={owner} />}
      </Flex>
    </Suspense>
  )
}

function TotalUSDBalance({
  owner,
  variant,
}: {
  owner: Address
  variant?: keyof Theme['textVariants']
}) {
  const balances = usePortfolioBalancesList(owner, true)
  const totalUSDBalance = useMemo(
    () =>
      balances
        .filter(({ currency }) => !isTestnet(toSupportedChainId(currency.chainId)!))
        .reduce((sum, balance) => sum + balance.balanceUSD, 0),
    [balances]
  )

  return <Text fontWeight="400" variant={variant}>{`${formatUSDPrice(totalUSDBalance)}`}</Text>
}

function BalanceRelativeChange({
  owner,
}: Pick<TotalBalanceViewProps, 'variant'> & { owner: Address }) {
  const balance = useLazyLoadQuery<TotalBalanceQuery>(
    graphql`
      query TotalBalanceQuery($owner: String!) {
        portfolio(ownerAddress: $owner) {
          absoluteChange24H
          relativeChange24H
        }
      }
    `,
    { owner }
  )

  return (
    <RelativeChange
      absoluteChange={balance?.portfolio?.absoluteChange24H ?? undefined}
      change={balance.portfolio?.relativeChange24H ?? undefined}
      variant="bodySmall"
    />
  )
}
