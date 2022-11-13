import React, { useEffect, useState } from 'react'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { WarmLoadingShimmer } from 'src/components/loading/WarmLoadingShimmer'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { PollingInterval } from 'src/constants/misc'
import { isWarmLoadingStatus } from 'src/data/utils'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { Theme } from 'src/styles/theme'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface PortfolioBalanceProps {
  owner: Address
  variant?: keyof Theme['textVariants']
  color?: keyof Theme['colors']
}

export function PortfolioBalance({ owner, variant, color }: PortfolioBalanceProps) {
  const { data, loading, networkStatus } = usePortfolioBalanceQuery({
    variables: { owner },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
    // This is better than using network status to check, because doing it that way we would have to wait
    // for the network status to go back to "ready", which results in the numbers updating, and _then_ the
    // shimmer disappearing. Using onCompleted it disappears at the same time as the data loads in.
    onCompleted: () => {
      setIsWarmLoading(false)
    },
  })

  const [isWarmLoading, setIsWarmLoading] = useState(false)

  useEffect(() => {
    if (!!data && isWarmLoadingStatus(networkStatus)) {
      setIsWarmLoading(true)
    }
  }, [data, networkStatus])

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
    <WarmLoadingShimmer isWarmLoading={isWarmLoading}>
      <DecimalNumber
        // initially set color to textTertiary when isWarm because the shimmer mask takes a second to load, resulting in a flash of the underlying color
        color={isWarmLoading ? 'textSecondary' : color}
        fontWeight="500"
        number={formatUSDPrice(
          data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value ?? undefined,
          NumberType.FiatTokenQuantity
        )}
        variant={variant ?? 'headlineLarge'}
      />
    </WarmLoadingShimmer>
  )
}
