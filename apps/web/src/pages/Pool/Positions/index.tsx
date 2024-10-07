/* eslint-disable-next-line no-restricted-imports */
import { Position, PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { useAccount } from 'hooks/useAccount'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

export default function Positions() {
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(null)
  const [versionFilter, setVersionFilter] = useState<ProtocolVersion[]>([
    ProtocolVersion.V4,
    ProtocolVersion.V3,
    ProtocolVersion.V2,
  ])
  const [statusFilter, setStatusFilter] = useState<PositionStatus[]>([
    PositionStatus.IN_RANGE,
    PositionStatus.OUT_OF_RANGE,
    PositionStatus.CLOSED,
  ])

  const navigate = useNavigate()
  const account = useAccount()
  const { address } = account

  const { data } = useGetPositionsQuery({
    address,
  })

  const onNavigateToPosition = useCallback(
    (position: Position) => {
      if (position.position.case === 'v2Pair' && position.position.value.token0 && position.position.value.token1) {
        navigate(`/positions/v2/${position.position.value.token0.address}/${position.position.value.token1.address}`)
      } else if (position.position.case === 'v3Position') {
        navigate(`/positions/v3/${position.position.value.tokenId}`)
      } else if (position.position.case === 'v4Position') {
        navigate(`/positions/v4/${position.position.value.poolPosition?.tokenId}`)
      } else {
        logger.error('Invalid position', {
          tags: { file: 'Positions/index.tsx', function: 'onPress' },
        })
      }
    },
    [navigate],
  )

  // TODO(WEB-4920): implement pagination w/ max 8 positions per page.

  return (
    <Flex width="100%" gap="$spacing24">
      <PositionsHeader
        selectedChain={chainFilter}
        selectedVersions={versionFilter}
        selectedStatus={statusFilter}
        onChainChange={(selectedChain) => {
          setChainFilter(selectedChain ?? null)
        }}
        onVersionChange={(toggledVersion) => {
          if (versionFilter?.includes(toggledVersion)) {
            setVersionFilter(versionFilter?.filter((v) => v !== toggledVersion))
          } else {
            setVersionFilter([...(versionFilter ?? []), toggledVersion])
          }
        }}
        onStatusChange={(toggledStatus) => {
          if (statusFilter?.includes(toggledStatus)) {
            setStatusFilter(statusFilter?.filter((s) => s !== toggledStatus))
          } else {
            setStatusFilter([...(statusFilter ?? []), toggledStatus])
          }
        }}
      />
      <Flex gap="$gap16" mb="$spacing20">
        {data?.positions.map((position, index) => {
          return (
            <LiquidityPositionCard
              key={index}
              liquidityPosition={position}
              {...ClickableTamaguiStyle}
              onPress={() => onNavigateToPosition(position)}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
