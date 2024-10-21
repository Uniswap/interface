/* eslint-disable-next-line no-restricted-imports */
import { Position, PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { useAccount } from 'hooks/useAccount'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

const PAGE_SIZE = 8

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
  const [currentPage, setCurrentPage] = useState(0)

  const { data } = useGetPositionsQuery({
    address,
  })

  const onNavigateToPosition = useCallback(
    (position: Position) => {
      if (position.position.case === 'v2Pair' && position.position.value.liquidityToken) {
        navigate(`/positions/v2/${position.position.value.liquidityToken.address}`)
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

  const currentPageItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return data?.positions.slice(start, start + PAGE_SIZE) ?? []
  }, [currentPage, data?.positions])
  const pageCount = data?.positions ? Math.ceil(data?.positions.length / PAGE_SIZE) : undefined

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
      <Flex gap="$gap16" mb="$spacing16">
        {currentPageItems.map((position, index) => {
          return (
            <LiquidityPositionCard
              key={`LiquidityPositionCard-${index}`}
              liquidityPosition={position}
              {...ClickableTamaguiStyle}
              onPress={() => onNavigateToPosition(position)}
            />
          )
        })}
      </Flex>
      {pageCount && pageCount > 1 && data?.positions && (
        <Flex row gap="$gap12" alignItems="center" mb="$spacing24">
          <ChevronLeft
            size={20}
            {...ClickableTamaguiStyle}
            opacity={currentPage === 0 ? 0.4 : 1}
            onClick={() => {
              setCurrentPage(Math.max(currentPage - 1, 0))
            }}
          />
          {Array.from({ length: pageCount > 5 ? 3 : pageCount }).map((_, index) => {
            const isSelected = currentPage === index
            return (
              <Text
                variant="buttonLabel2"
                color={isSelected ? '$neutral1' : '$neutral2'}
                backgroundColor={isSelected ? '$surface3' : 'transparent'}
                py="$spacing4"
                px="$spacing12"
                borderRadius="$roundedFull"
                key={`Positions-page-${index}`}
                {...ClickableTamaguiStyle}
                onPress={() => setCurrentPage(index)}
              >
                {index + 1}
              </Text>
            )
          })}
          {pageCount > 5 && (
            <Text variant="buttonLabel2" color="$neutral2" py="$spacing4" px="$spacing12">
              ...
            </Text>
          )}
          {pageCount > 5 && (
            <Text
              variant="buttonLabel2"
              color={currentPage === pageCount - 1 ? '$neutral1' : '$neutral2'}
              backgroundColor={currentPage === pageCount - 1 ? '$surface3' : 'transparent'}
              py="$spacing4"
              px="$spacing12"
              borderRadius="$roundedFull"
              {...ClickableTamaguiStyle}
              onPress={() => setCurrentPage(pageCount - 1)}
            >
              {pageCount}
            </Text>
          )}
          <ChevronRight
            size={20}
            {...ClickableTamaguiStyle}
            opacity={currentPage === pageCount - 1 ? 0.4 : 1}
            onClick={() => {
              setCurrentPage(Math.min(currentPage + 1, pageCount - 1))
            }}
          />
        </Flex>
      )}
    </Flex>
  )
}
