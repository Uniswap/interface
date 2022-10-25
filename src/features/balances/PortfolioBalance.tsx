import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { PortfolioBalanceQuery } from 'src/features/balances/__generated__/PortfolioBalanceQuery.graphql'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface PortfolioBalanceProps {
  queryRef: NullUndefined<PreloadedQuery<PortfolioBalanceQuery>>
}

export const portfolioBalanceQuery = graphql`
  query PortfolioBalanceQuery($owner: String!) {
    portfolios(ownerAddresses: [$owner]) {
      tokensTotalDenominatedValue @required(action: LOG) {
        value @required(action: LOG)
      }
    }
  }
`

export function PortfolioBalance({ queryRef }: PortfolioBalanceProps) {
  if (!queryRef) {
    return (
      <Box width="70%">
        <Loading />
      </Box>
    )
  }

  return (
    <Suspense
      fallback={
        <Box width="70%">
          <Loading />
        </Box>
      }>
      <PortfolioBalanceInner queryRef={queryRef} />
    </Suspense>
  )
}

function PortfolioBalanceInner({ queryRef }: { queryRef: PreloadedQuery<PortfolioBalanceQuery> }) {
  const data = usePreloadedQuery(portfolioBalanceQuery, queryRef)

  return (
    <Flex gap="xxs">
      <DecimalNumber
        number={formatUSDPrice(
          data?.portfolios?.[0]?.tokensTotalDenominatedValue.value ?? undefined,
          NumberType.FiatTokenQuantity
        )}
        variant="headlineLarge"
      />
    </Flex>
  )
}
