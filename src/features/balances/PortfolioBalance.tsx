import React from 'react'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { PollingInterval } from 'src/constants/misc'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface PortfolioBalanceProps {
  owner?: Address
  variant?: keyof Theme['textVariants']
  color?: keyof Theme['colors']
}

export function PortfolioBalance({ owner, variant, color }: PortfolioBalanceProps) {
  const activeAdresss = useActiveAccountAddressWithThrow()
  const { data, loading } = usePortfolioBalanceQuery({
    variables: { owner: owner ?? activeAdresss },
    pollInterval: PollingInterval.Fast,
  })

  if (loading && !data) {
    return (
      <Loading>
        <Flex alignSelf="flex-start" backgroundColor="background0" borderRadius="md">
          <HiddenFromScreenReaders>
            <DecimalNumber number="0000.00" opacity={0} variant={variant ?? 'headlineLarge'} />
          </HiddenFromScreenReaders>
        </Flex>
      </Loading>
    )
  }

  return (
    <Flex gap="xxs">
      <DecimalNumber
        color={color}
        number={formatUSDPrice(
          data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value ?? undefined,
          NumberType.FiatTokenQuantity
        )}
        variant={variant ?? 'headlineLarge'}
      />
    </Flex>
  )
}
