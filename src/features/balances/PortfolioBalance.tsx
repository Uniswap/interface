import { NetworkStatus } from '@apollo/client'
import React from 'react'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { PollingInterval } from 'src/constants/misc'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { formatUSDPrice, NumberType } from 'src/utils/format'

export function PortfolioBalance() {
  const owner = useActiveAccountAddressWithThrow()
  const { data, loading, error, networkStatus } = usePortfolioBalanceQuery({
    variables: { owner },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
  })

  if ((loading && networkStatus !== NetworkStatus.poll) || error) {
    return (
      <Loading>
        <Flex alignSelf="flex-start" backgroundColor="background0" borderRadius="md">
          <HiddenFromScreenReaders>
            <DecimalNumber number="0000.00" opacity={0} variant="headlineLarge" />
          </HiddenFromScreenReaders>
        </Flex>
      </Loading>
    )
  }

  return (
    <Flex gap="xxs">
      <DecimalNumber
        number={formatUSDPrice(
          data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value ?? undefined,
          NumberType.FiatTokenQuantity
        )}
        variant="headlineLarge"
      />
    </Flex>
  )
}
