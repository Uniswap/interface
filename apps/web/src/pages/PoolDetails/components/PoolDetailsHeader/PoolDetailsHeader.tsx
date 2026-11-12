import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { getPoolName } from 'uniswap/src/features/pools/names'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { shortenHash } from 'utilities/src/addresses'
import { getPoolHeaderColumnGapProps } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { HeaderNetworkPill } from '~/components/StickyCollapsibleHeader/HeaderNetworkPill'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { AnimatedDoubleLogo } from '~/pages/PoolDetails/components/PoolDetailsHeader/AnimatedDoubleLogo'
import { PoolDetailsHeaderActions } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderActions'
import { PoolDetailsHeaderCategoryChips } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderCategoryChips'
import { PoolDetailsHeaderSkeleton } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeaderSkeleton'
import { PoolDetailsTitle } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsTitle'

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  /** Display order */
  baseToken?: ParsedToken
  quoteToken?: ParsedToken
  /** Pool order */
  token0?: ParsedToken
  token1?: ParsedToken
  isToken0Quote?: boolean
  feeTier?: FeeData
  /** Integer pips, served alongside the fee tier by the page's `GetPool` row. */
  protocolFeePips?: number
  /** The pool's live LP fee (integer pips); what a dynamic tier's badge shows. */
  currentLpFeePips?: number
  protocolVersion?: ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
  /** `PoolSummary.category_ids`; undefined until the pool loads. */
  categoryIds?: string[]
  isCompact: boolean
}

function PoolDetailsHeaderContent({
  chainId,
  poolAddress,
  baseToken,
  quoteToken,
  token0,
  token1,
  isToken0Quote,
  feeTier,
  protocolFeePips,
  currentLpFeePips,
  protocolVersion,
  hookAddress,
  categoryIds,
  toggleReversed,
  isCompact,
}: Omit<PoolDetailsHeaderProps, 'loading'>): JSX.Element {
  const media = useMedia()
  const poolName = getPoolName({ symbol0: baseToken?.symbol, symbol1: quoteToken?.symbol, spaced: true }) ?? ''
  const poolChainId = chainId as UniverseChainId | undefined

  const badges = (
    // The hook badge is the only variable-width child, so it is the one that has to give: tamagui wrappers
    // default to flexShrink 0, which would push the row past its container instead.
    <Flex row gap="$spacing2" alignItems="center" minWidth={0} shrink>
      <LiquidityPositionInfoBadges
        version={protocolVersion}
        v4hook={hookAddress}
        chainId={poolChainId}
        feeTier={feeTier}
        currentLpFeePips={currentLpFeePips}
        protocolFeePips={protocolFeePips}
        size={media.md ? 'compact' : 'default'}
      />
    </Flex>
  )

  return (
    <Flex width="100%" gap="$gap12">
      <Flex row alignItems="center" justifyContent="space-between" width="100%" gap="$gap8">
        <Flex row flex={1} minWidth={0} alignItems="center" gap="$gap12">
          {/* Desktop shows the network on row 2, so the logo badge is redundant; mobile hides that row and keeps the badge. */}
          <AnimatedDoubleLogo
            token0={baseToken}
            token1={quoteToken}
            isCompact={isCompact}
            stacked
            includeNetwork={media.md}
          />
          <Flex minWidth={0} shrink {...getPoolHeaderColumnGapProps(isCompact)}>
            <Flex row flex={1} minWidth={0} alignItems="flex-end" gap="$gap8" $md={{ width: '100%' }}>
              <PoolDetailsTitle
                baseToken={baseToken}
                quoteToken={quoteToken}
                chainId={poolChainId}
                toggleReversed={toggleReversed}
                poolAddress={poolAddress}
                isCompact={isCompact}
              />
            </Flex>
            {/* Second row mirrors the TDP: network name, then badges, then a divider before the copyable address. */}
            {/* Row gap is the sole spacer around the dividers, so each divider sits 12px from its neighbors. */}
            {/* Wraps rather than overflows: just above the 640px switch this row holds five children and a
              registry-named hook badge can outgrow the remaining width. */}
            <Flex row alignItems="center" gap="$gap12" flexWrap="wrap" minWidth={0}>
              {!media.md && poolChainId && (
                <>
                  <HeaderNetworkPill chainId={poolChainId} />
                  <Flex width={1} alignSelf="stretch" backgroundColor="$surface3" />
                </>
              )}
              {badges}
              {!media.md && poolAddress && (
                <>
                  <Flex width={1} alignSelf="stretch" backgroundColor="$surface3" />
                  <CopyHelper
                    toCopy={poolAddress}
                    iconPosition="right"
                    iconSize={16}
                    iconColor="$neutral2"
                    color="$neutral2"
                  >
                    <Text color="$neutral2">{shortenHash(poolAddress)}</Text>
                  </CopyHelper>
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        <PoolDetailsHeaderActions
          chainId={poolChainId}
          poolAddress={poolAddress}
          poolName={poolName}
          baseToken={baseToken}
          quoteToken={quoteToken}
          token0={token0}
          token1={token1}
          isToken0Quote={isToken0Quote}
          protocolVersion={protocolVersion}
        />
      </Flex>
      {/* Third row mirrors the TDP collections chips; the compact (scrolled) header drops it. */}
      {!isCompact && (
        <PoolDetailsHeaderCategoryChips
          categoryIds={categoryIds}
          poolLoading={false}
          chainId={poolChainId}
          poolAddress={poolAddress}
          poolName={poolName}
        />
      )}
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
