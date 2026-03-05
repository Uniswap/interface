import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from 'ui/src'
import { shortenHash } from 'utilities/src/addresses'
import { FeeData } from '~/components/Liquidity/Create/types'
import { LpIncentivesAprDisplay } from '~/components/LpIncentives/LpIncentivesAprDisplay'
import { AnimatedDoubleLogo } from '~/pages/PoolDetails/components/PoolDetailsHeader/AnimatedDoubleLogo'
import { PoolDetailsHeaderActions } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderActions'
import { PoolDetailsHeaderSkeleton } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderSkeleton'
import { PoolDetailsTitle } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsTitle'
import { CopyHelper } from '~/theme/components/CopyHelper'

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  feeTier?: FeeData
  protocolVersion?: GraphQLApi.ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
  poolApr?: Percent
  rewardsApr?: number
  isCompact: boolean
}

function PoolDetailsHeaderContent({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  protocolVersion,
  hookAddress,
  toggleReversed,
  rewardsApr,
  isCompact,
}: Omit<PoolDetailsHeaderProps, 'loading'>): JSX.Element {
  const poolName = `${token0?.symbol} / ${token1?.symbol}`
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const showRewards = isLPIncentivesEnabled && rewardsApr && rewardsApr > 0

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex row flex={1} alignItems="center" gap="$gap12">
        <AnimatedDoubleLogo token0={token0} token1={token1} isCompact={isCompact} />
        <Flex gap={isCompact ? '$gap4' : '$gap8'} $md={{ gap: '$none' }}>
          <Flex row flex={1} alignItems="flex-end" gap="$gap8" $sm={{ width: '100%' }}>
            <PoolDetailsTitle
              token0={token0}
              token1={token1}
              chainId={chainId}
              feeTier={feeTier}
              protocolVersion={protocolVersion}
              toggleReversed={toggleReversed}
              hookAddress={hookAddress}
              isCompact={isCompact}
            />
          </Flex>
          <Flex row alignItems="center" gap="$gap8">
            {showRewards && <LpIncentivesAprDisplay lpIncentiveRewardApr={rewardsApr} hideBackground />}
            {poolAddress && (
              <CopyHelper
                toCopy={poolAddress}
                iconPosition="right"
                iconSize={16}
                iconColor="$neutral2"
                color="$neutral2"
              >
                <Text color="$neutral2">{shortenHash(poolAddress)}</Text>
              </CopyHelper>
            )}
          </Flex>
        </Flex>
      </Flex>
      <PoolDetailsHeaderActions
        chainId={chainId}
        poolAddress={poolAddress}
        poolName={poolName}
        token0={token0}
        token1={token1}
        protocolVersion={protocolVersion}
      />
    </Flex>
  )
}

export function PoolDetailsHeader(props: PoolDetailsHeaderProps): JSX.Element {
  const { loading, isCompact, ...contentProps } = props
  if (loading) {
    return <PoolDetailsHeaderSkeleton isCompact={isCompact} />
  }
  return <PoolDetailsHeaderContent {...contentProps} isCompact={isCompact} />
}
