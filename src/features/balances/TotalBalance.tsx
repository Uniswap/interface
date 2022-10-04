import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useFragment } from 'react-relay'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { TotalBalance_portfolio$key } from 'src/features/balances/__generated__/TotalBalance_portfolio.graphql'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice } from 'src/utils/format'

interface TotalBalanceViewProps {
  portfolio: TotalBalance_portfolio$key | null
  showRelativeChange?: boolean
  variant?: keyof Theme['textVariants']
}

export function TotalBalance({
  portfolio,
  showRelativeChange,
  variant = 'headlineLarge',
}: TotalBalanceViewProps) {
  const data = useFragment(
    graphql`
      fragment TotalBalance_portfolio on Portfolio {
        assetsValueUSD
        absoluteChange24H
        relativeChange24H
      }
    `,
    portfolio
  )

  return (
    <Suspense fallback={<Loading type="header" />}>
      <Flex gap="xxs">
        <Text variant={variant}>{`${formatUSDPrice(data?.assetsValueUSD ?? undefined)}`}</Text>
        {showRelativeChange && (
          <RelativeChange
            absoluteChange={data?.absoluteChange24H ?? undefined}
            change={data?.relativeChange24H ?? undefined}
            variant="bodySmall"
          />
        )}
      </Flex>
    </Suspense>
  )
}
