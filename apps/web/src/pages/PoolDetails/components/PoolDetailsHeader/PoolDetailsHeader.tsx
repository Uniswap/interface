import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi, parseRestProtocolVersion } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from 'ui/src'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { shortenHash } from 'utilities/src/addresses'
import { useServedProtocolFee } from '~/features/fees/useServedProtocolFees'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { AnimatedDoubleLogo } from '~/pages/PoolDetails/components/PoolDetailsHeader/AnimatedDoubleLogo'
import { PoolDetailsHeaderActions } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderActions'
import { PoolDetailsHeaderSkeleton } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderSkeleton'
import { PoolDetailsTitle } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsTitle'

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  poolId?: string
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
  poolId,
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

  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)
  // GraphQL pool data carries no fee fields — the protocol fee comes from data-api GetProtocolFees.
  const protocolFeePips = useServedProtocolFee({
    chainId: chainId as UniverseChainId | undefined,
    protocolVersion: protocolVersion ? parseRestProtocolVersion(protocolVersion) : undefined,
    poolIdOrHash: poolId,
    enabled: isFeeDisplayEnabled,
  })

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%" gap="$gap8">
      <Flex row flex={1} minWidth={0} alignItems="center" gap="$gap12">
        <AnimatedDoubleLogo token0={token0} token1={token1} isCompact={isCompact} />
        <Flex minWidth={0} shrink gap={isCompact ? '$gap4' : '$gap8'} $md={{ gap: '$none' }}>
          <Flex row flex={1} minWidth={0} alignItems="flex-end" gap="$gap8" $sm={{ width: '100%' }}>
            <PoolDetailsTitle
              token0={token0}
              token1={token1}
              chainId={chainId}
              feeTier={feeTier}
              protocolVersion={protocolVersion}
              protocolFeePips={protocolFeePips}
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
