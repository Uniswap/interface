import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GetPoolHistoryVolumeRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import {
  HistoryDuration as LiquidityHistoryDuration,
  PoolProtocol,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { toLiquidityChainId } from 'uniswap/src/features/positions/utils'
import {
  HoverCard,
  HoverCardArmOnHover,
  type HoverCardPlacement,
  useHoverCardMaxContentWidth,
  useHoverCardState,
} from '~/components/HoverCard/HoverCard'
import { type PoolHoverCardPool, PoolHoverCardContent } from '~/components/HoverCard/PoolHoverCard/PoolHoverCardContent'
import { toHourlyVolumes } from '~/components/HoverCard/PoolHoverCard/toHourlyVolumes'
import { useHoverCardCopyAndClose } from '~/components/HoverCard/useHoverCardCopyAndClose'

const POOL_PROTOCOL: Partial<Record<ProtocolVersion, PoolProtocol>> = {
  [ProtocolVersion.V2]: PoolProtocol.V2,
  [ProtocolVersion.V3]: PoolProtocol.V3,
  [ProtocolVersion.V4]: PoolProtocol.V4,
}

interface PoolHoverCardProps {
  pool: PoolHoverCardPool
  children: ReactNode
  placement?: HoverCardPlacement
  offset?: number
  offsetFromScrollContainerEdge?: boolean
  containerWidth?: number
  childOwnsPressFeedback?: boolean
}

export function PoolHoverCard(props: PoolHoverCardProps): JSX.Element {
  return (
    <HoverCardArmOnHover
      childOwnsPressFeedback={props.childOwnsPressFeedback}
      renderMounted={() => <MountedPoolHoverCard {...props} />}
    >
      {props.children}
    </HoverCardArmOnHover>
  )
}

function MountedPoolHoverCard({
  pool,
  children,
  placement = 'bottom-start',
  offset,
  offsetFromScrollContainerEdge,
  containerWidth,
  childOwnsPressFeedback,
}: PoolHoverCardProps): JSX.Element {
  const { poolId, chainId, protocolVersion } = pool
  const { isOpen, hasOpenIntent, close, onOpenChange } = useHoverCardState()
  const { isCopied, copyAndClose } = useHoverCardCopyAndClose({ onClose: close })

  const poolProtocol = POOL_PROTOCOL[protocolVersion]
  const liquidityChainId = toLiquidityChainId(chainId)
  const canFetch = hasOpenIntent && poolProtocol !== undefined && liquidityChainId !== undefined
  const { data, isLoading: loading } = useQuery(
    liquidityQueries.getPoolHistoryVolume({
      params: canFetch
        ? new GetPoolHistoryVolumeRequest({
            pool: { chainId: liquidityChainId, addressOrId: poolId, version: poolProtocol },
            duration: LiquidityHistoryDuration.DAY,
          })
        : undefined,
      enabled: canFetch,
    }),
  )
  const hourlyVolumes = useMemo(() => toHourlyVolumes(data?.buckets ?? []), [data])

  const handleCopy = useCallback((): void => copyAndClose(poolId), [copyAndClose, poolId])
  const maxContentWidth = useHoverCardMaxContentWidth({ containerWidth, widthOffset: offset })

  return (
    <HoverCard
      isOpen={isOpen}
      placement={placement}
      offset={offset}
      offsetFromScrollContainerEdge={offsetFromScrollContainerEdge}
      childOwnsPressFeedback={childOwnsPressFeedback}
      content={
        <PoolHoverCardContent
          {...pool}
          hourlyVolumes={hourlyVolumes}
          loading={loading}
          isCopied={isCopied}
          maxWidth={maxContentWidth}
          onCopy={handleCopy}
        />
      }
      onOpenChange={onOpenChange}
    >
      {children}
    </HoverCard>
  )
}
