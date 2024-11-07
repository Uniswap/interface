/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool } from 'components/Icons/Pool'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, parseRestPosition } from 'components/Liquidity/utils'
import { LoadingRows } from 'components/Loader/styled'
import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Trans, useTranslation } from 'uniswap/src/i18n'

const PAGE_SIZE = 8

function EmptyPositionsView({ isConnected }: { isConnected: boolean }) {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

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
      cursor={isConnected ? 'auto' : 'pointer'}
      onPress={
        isConnected
          ? undefined
          : () => {
              accountDrawer.toggle()
            }
      }
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
  const { chains: currentModeChains } = useEnabledChains()
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [closedCTADismissed, setClosedCTADismissed] = useState(false)

  const navigate = useNavigate()
  const account = useAccount()
  const { address, isConnected } = account
  const [currentPage, setCurrentPage] = useState(0)

  const { data, isPlaceholderData, refetch } = useGetPositionsQuery(
    {
      address,
      chainIds: chainFilter ? [chainFilter] : currentModeChains,
      positionStatuses: statusFilter,
      protocolVersions: versionFilter,
    },
    !isConnected,
  )

  usePendingLPTransactionsChangeListener(refetch)

  const onNavigateToPosition = useCallback(
    (position: PositionInfo) => {
      navigate(getPositionUrl(position))
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
        showFilters={account.isConnected}
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
      {data || !account.address ? (
        currentPageItems.length > 0 ? (
          <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
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
      ) : (
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
      {!statusFilter.includes(PositionStatus.CLOSED) && !closedCTADismissed && account.address && (
        <Flex
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded12"
          mb="$spacing24"
          p="$padding12"
          gap="$gap12"
          row
          centered
        >
          <Flex height="100%">
            <InfoCircleFilled color="$neutral2" size="$icon.20" />
          </Flex>
          <Flex grow>
            <Text variant="body3" color="$neutral1">
              <Trans i18nKey="pool.closedCTA.title" />
            </Text>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="pool.closedCTA.description" />
            </Text>
          </Flex>
          <Flex height="100%" onPress={() => setClosedCTADismissed(true)} cursor="pointer">
            <X color="$neutral2" size="$icon.20" />
          </Flex>
        </Flex>
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
