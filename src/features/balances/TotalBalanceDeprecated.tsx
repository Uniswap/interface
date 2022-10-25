import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalanceDeprecatedQuery } from 'src/features/balances/__generated__/TotalBalanceDeprecatedQuery.graphql'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface TotalBalanceViewProps {
  owner: Address
  showRelativeChange?: boolean
  variant?: keyof Theme['textVariants']
  color?: keyof Theme['colors']
}

/** @deprecated Use TotalBalance.tsx with preloaded queries */
export function TotalBalance({
  owner,
  showRelativeChange,
  variant = 'headlineLarge',
  color = 'textPrimary',
}: TotalBalanceViewProps) {
  return (
    <Suspense fallback={<Loading type="header" />}>
      <TotalBalanceInner
        color={color}
        owner={owner}
        showRelativeChange={showRelativeChange}
        variant={variant}
      />
    </Suspense>
  )
}

function TotalBalanceInner({ owner, showRelativeChange, variant, color }: TotalBalanceViewProps) {
  const balance = useLazyLoadQuery<TotalBalanceDeprecatedQuery>(
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
      <Text color={color} variant={variant}>
        {formatUSDPrice(
          balance?.portfolio?.assetsValueUSD ?? undefined,
          NumberType.FiatTokenQuantity
        )}
      </Text>
      {showRelativeChange && (
        <RelativeChange
          absoluteChange={balance?.portfolio?.absoluteChange24H ?? undefined}
          change={balance?.portfolio?.relativeChange24H ?? undefined}
          variant="subheadSmall"
        />
      )}
    </Flex>
  )
}
