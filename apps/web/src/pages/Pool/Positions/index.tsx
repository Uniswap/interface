/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { useAccount } from 'hooks/useAccount'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { UniverseChainId } from 'uniswap/src/types/chains'

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

  const account = useAccount()
  const { address } = account

  const { data } = useGetPositionsQuery({
    chainIds: chainFilter ? [chainFilter] : undefined,
    protocolVersions: versionFilter,
    positionStatuses: statusFilter,
    address,
  })

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
      <Flex gap="$gap16">
        {data?.positions.map((position, index) => {
          return (
            <LiquidityPositionCard
              key={index}
              liquidityPosition={position}
              {...ClickableTamaguiStyle}
              onPress={() => {
                // TODO(WEB-4920): navigate to the PosDP for this position
              }}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
