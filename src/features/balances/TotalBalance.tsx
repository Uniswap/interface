import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { useFragment } from 'react-relay'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { TotalBalance_portfolio$key } from 'src/features/balances/__generated__/TotalBalance_portfolio.graphql'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice } from 'src/utils/format'

interface TotalBalanceViewProps {
  portfolio: TotalBalance_portfolio$key | null
  variant?: keyof Theme['textVariants']
}

export function TotalBalance({ portfolio, variant = 'headlineLarge' }: TotalBalanceViewProps) {
  const data = useFragment(
    graphql`
      fragment TotalBalance_portfolio on Portfolio {
        tokensTotalDenominatedValue {
          value
        }
      }
    `,
    portfolio
  )

  return (
    <Suspense fallback={<Loading type="header" />}>
      <Flex gap="xxs">
        <Text variant={variant}>{`${formatUSDPrice(
          data?.tokensTotalDenominatedValue?.value ?? undefined
        )}`}</Text>
      </Flex>
    </Suspense>
  )
}
