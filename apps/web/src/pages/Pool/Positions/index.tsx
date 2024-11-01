/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Pool } from 'components/Icons/Pool'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { parseRestPosition } from 'components/Liquidity/utils'
import { LoadingRows } from 'components/Loader/styled'
import { getChain } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

const PAGE_SIZE = 8

function EmptyPositionsView({ isConnected }: { isConnected: boolean }) {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Flex
      row
      alignItems="center"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth={1}
      borderStyle="solid"
      gap="$gap8"
      p="$padding16"
    >
      <Flex p="$padding8" borderRadius="$rounded12" backgroundColor="$accent2">
        <Pool width={iconSizes.icon24} height={iconSizes.icon24} color={colors.accent1.val} />
      </Flex>
      <Flex grow>
        <Text variant="subheading2">{isConnected ? t('pool.openPosition') : t('positions.welcome')}</Text>
        <Text variant="body2" color="$neutral2">
          {isConnected ? t('pool.openPosition.cta') : t('positions.welcome.connect')}
        </Text>
      </Flex>
      {isConnected && (
        <Button theme="secondary" size="medium" onPress={() => navigate('/explore/pools')}>
          <Text>{t('pools.explore')}</Text>
        </Button>
      )}
    </Flex>
  )
}

const chainFilterAtom = atomWithStorage<UniverseChainId | null>('positions-chain-filter', null)
const versionFilterAtom = atomWithStorage<ProtocolVersion[]>('positions-version-filter', [
  ProtocolVersion.V4,
  ProtocolVersion.V3,
  ProtocolVersion.V2,
])
const statusFilterAtom = atomWithStorage<PositionStatus[]>('positions-status-filter', [
  PositionStatus.IN_RANGE,
  PositionStatus.OUT_OF_RANGE,
])

export default function Positions() {
  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)

  const navigate = useNavigate()
  const account = useAccount()
  const { address, isConnected } = account
  const [currentPage, setCurrentPage] = useState(0)

  const { data, isLoading: positionsLoading } = useGetPositionsQuery(
    {
      address,
      chainIds: chainFilter ? [chainFilter] : undefined,
      positionStatuses: statusFilter,
      protocolVersions: versionFilter,
    },
    !isConnected,
  )

  const onNavigateToPosition = useCallback(
    (position: PositionInfo) => {
      const chainInfo = getChain({ chainId: position.currency0Amount.currency.chainId })
      if (position.version === ProtocolVersion.V2) {
        navigate(`/positions/v2/${chainInfo.urlParam}/${position.liquidityToken.address}`)
      } else if (position.version === ProtocolVersion.V3) {
        navigate(`/positions/v3/${chainInfo.urlParam}/${position.tokenId}`)
      } else if (position.version === ProtocolVersion.V4) {
        navigate(`/positions/v4/${chainInfo.urlParam}/${position.tokenId}`)
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
    return (data?.positions.slice(start, start + PAGE_SIZE) ?? []).map((position) => parseRestPosition(position))
  }, [currentPage, data?.positions])
  const pageCount = data?.positions ? Math.ceil(data?.positions.length / PAGE_SIZE) : undefined

  return (
    <Flex width="100%" gap="$spacing24">
      <PositionsHeader
        showFilters={currentPageItems.length > 0}
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
      {!positionsLoading ? (
        currentPageItems.length > 0 ? (
          <Flex gap="$gap16" mb="$spacing16">
            {currentPageItems.map((position, index) => {
              return (
                position && (
                  <LiquidityPositionCard
                    key={`LiquidityPositionCard-${index}`}
                    liquidityPosition={position}
                    {...ClickableTamaguiStyle}
                    onPress={() => onNavigateToPosition(position)}
                  />
                )
              )
            })}
          </Flex>
        ) : (
          <EmptyPositionsView isConnected={isConnected} />
        )
      ) : null}
      {!data && positionsLoading && (
        <LoadingRows>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </LoadingRows>
      )}
      {!!pageCount && pageCount > 1 && data?.positions && (
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
