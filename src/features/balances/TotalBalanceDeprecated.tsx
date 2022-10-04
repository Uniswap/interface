import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useLazyLoadQuery } from 'react-relay-offline'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalanceDeprecatedQuery } from 'src/features/balances/__generated__/TotalBalanceDeprecatedQuery.graphql'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice } from 'src/utils/format'

interface TotalBalanceViewProps {
  owner: Address
  showRelativeChange?: boolean
  variant?: keyof Theme['textVariants']
}

/** @deprecated Use TotalBalance.tsx with preloaded queries */
export function TotalBalance({
  owner,
  showRelativeChange,
  variant = 'headlineLarge',
}: TotalBalanceViewProps) {
  return (
    <Suspense fallback={<Loading type="header" />}>
      <TotalBalanceInner owner={owner} showRelativeChange={showRelativeChange} variant={variant} />
    </Suspense>
  )
}

function TotalBalanceInner({ owner, showRelativeChange, variant }: TotalBalanceViewProps) {
  const { data: balance } = useLazyLoadQuery<TotalBalanceDeprecatedQuery>(
    graphql`
      query TotalBalanceDeprecatedQuery($owner: String!) {
        portfolio(ownerAddress: $owner) {
          assetsValueUSD
          absoluteChange24H
          relativeChange24H
        }
      }
    `,
    { owner }
  )

  return (
    <Flex gap="xxs">
      <Text variant={variant}>{`${formatUSDPrice(
        balance?.portfolio?.assetsValueUSD ?? undefined
      )}`}</Text>
      {showRelativeChange && (
        <RelativeChange
          absoluteChange={balance?.portfolio?.absoluteChange24H ?? undefined}
          change={balance?.portfolio?.relativeChange24H ?? undefined}
          variant="bodySmall"
        />
      )}
    </Flex>
  )
}
