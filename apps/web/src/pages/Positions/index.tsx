/* eslint-disable max-lines */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import PROVIDE_LIQUIDITY from 'assets/images/provideLiquidity.png'
import tokenLogo from 'assets/images/token-logo.png'
import V4_HOOK from 'assets/images/v4Hooks.png'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
import { LpIncentiveClaimModal } from 'components/Liquidity/LPIncentives/LpIncentiveClaimModal'
import LpIncentiveRewardsCard from 'components/Liquidity/LPIncentives/LpIncentiveRewardsCard'
import { PositionsHeader } from 'components/Liquidity/PositionsHeader'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils/getPositionUrl'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { useAccount } from 'hooks/useAccount'
import { useLpIncentives } from 'hooks/useLpIncentives'
import { atom, useAtom } from 'jotai'
import { TopPools } from 'pages/Positions/TopPools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { FixedSizeList } from 'react-window'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { useRequestPositionsForSavedPairs } from 'state/user/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Flex, Text, useMedia } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Pools } from 'ui/src/components/icons/Pools'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useGetPositionsInfiniteQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'

// The BE limits the number of positions by chain and protocol version.
// PAGE_SIZE=25 means the limit is at most 25 positions * x chains * y protocol versions.
// TODO: LP-4: Improve performance by loading pageSize limit positions at a time.
const PAGE_SIZE = 25

function DisconnectedWalletView() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()
  const connectedWithoutEVM = useIsMissingPlatformWallet(Platform.EVM)

  const handleConnectWallet = () => {
    if (connectedWithoutEVM) {
      setMenu({ variant: MenuStateVariant.CONNECT_PLATFORM, platform: Platform.EVM })
    }
    accountDrawer.open()
  }

  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Wallet size="$icon.24" color="$neutral1" />
        </Flex>
        <Flex gap="$gap4" centered>
          <Text variant="subheading1">
            {connectedWithoutEVM ? t('pool.notAvailableOnSolana') : t('positions.welcome.connect.wallet')}
          </Text>
          <Text variant="body2" color="$neutral2">
            {connectedWithoutEVM ? t('pool.connectEthereumToView') : t('positions.welcome.connect.description')}
          </Text>
        </Flex>
        <Flex row gap="$gap8" $md={{ width: '100%' }} width={connectedWithoutEVM ? '100%' : '45%'}>
          {!connectedWithoutEVM && (
            <Button
              variant="default"
              size="small"
              emphasis="secondary"
              tag="a"
              href="/positions/create/v4"
              $platform-web={{
                textDecoration: 'none',
              }}
            >
              {t('position.new')}
            </Button>
          )}
          <Button variant="default" size="small" borderRadius="$rounded12" onPress={handleConnectWallet}>
            {connectedWithoutEVM ? t('common.connectAWallet.button.evm') : t('common.connectWallet.button')}
          </Button>
        </Flex>
      </Flex>
      <Flex gap="$gap20" mb="$spacing24">
        <Flex row gap="$gap12" $sm={{ flexDirection: 'column' }}>
          <LearnMoreTile
            width="100%"
            img={PROVIDE_LIQUIDITY}
            text={t('liquidity.provideOnProtocols')}
            link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
          />
          <LearnMoreTile
            width="100%"
            img={V4_HOOK}
            text={t('liquidity.hooks')}
            link={uniswapUrls.helpArticleUrls.v4HooksInfo}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

function EmptyPositionsView() {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Pools size="$icon.24" color="$neutral1" />
        </Flex>
        <Text variant="subheading1">{t('positions.noPositions.title')}</Text>
        <Text variant="body2" color="$neutral2" maxWidth={420}>
          {t('positions.noPositions.description')}
        </Text>
        <Flex row gap="$gap8" $md={{ width: '100%' }} width="45%">
          <Button
            variant="default"
            size="small"
            emphasis="secondary"
            tag="a"
            href="/explore/pools"
            $platform-web={{
              textDecoration: 'none',
            }}
          >
            {t('pools.explore')}
          </Button>
          <Button
            variant="default"
            size="small"
            tag="a"
            href="/positions/create/v4"
            $platform-web={{
              textDecoration: 'none',
            }}
          >
            {t('position.new')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

function LearnMoreTile({
  img,
  text,
  link,
  width = 344,
}: {
  img: string
  text: string
  link?: string
  width?: number | string
}) {
  return (
    <Anchor
      href={link}
      textDecorationLine="none"
      target="_blank"
      rel="noopener noreferrer"
      width={width}
      {...ClickableTamaguiStyle}
      hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
    >
      <Flex
        row
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        alignItems="center"
        gap="$gap16"
        overflow="hidden"
      >
        <img src={img} style={{ objectFit: 'cover', width: '72px', height: '72px' }} />
        <Text variant="subheading2">{text}</Text>
      </Flex>
    </Anchor>
  )
}

const chainFilterAtom = atom<UniverseChainId | null>(null)
const versionFilterAtom = atom<ProtocolVersion[]>([ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2])
const statusFilterAtom = atom<PositionStatus[]>([PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE])

function VirtualizedPositionsList({
  positions,
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  positions: PositionInfo[]
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const positionItemHeight = useMemo(() => {
    return media.sm ? 360 : media.md ? 290 : 200
  }, [media])

  const listHeight = useMemo(() => {
    return positions.length * positionItemHeight
  }, [positionItemHeight, positions.length])

  const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasNextPage, isFetching })

  return (
    <Flex grow>
      <FixedSizeList
        height={listHeight}
        width="100%"
        itemCount={positions.length}
        itemSize={positionItemHeight}
        itemData={positions}
        itemKey={(index) => `${positions[index].poolId}-${positions[index].tokenId}-${positions[index].chainId}`}
      >
        {({ index, style, data }) => {
          const position = data[index]
          return (
            <Flex style={style}>
              <Link
                key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
                style={{ textDecoration: 'none' }}
                to={getPositionUrl(position)}
              >
                <LiquidityPositionCard
                  showVisibilityOption
                  liquidityPosition={position}
                  showMigrateButton
                  isLast={index === positions.length - 1}
                />
              </Link>
            </Flex>
          )
        }}
      </FixedSizeList>

      {/* Sentinel element to trigger loading more when it comes into view */}
      {hasNextPage && (
        <Flex ref={sentinelRef} height={20} justifyContent="center" alignItems="center">
          {isFetching && (
            <Text variant="body3" color="$neutral2">
              {t('liquidityPool.positions.loadingMore')}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default function Pool() {
  const account = useAccount()
  const { t } = useTranslation()
  const { address, isConnected } = account

  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives) && isConnected

  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const { chains: currentModeChains } = useEnabledChains()
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [closedCTADismissed, setClosedCTADismissed] = useState(false)

  const isPositionVisible = usePositionVisibilityCheck()
  const [showHiddenPositions, setShowHiddenPositions] = useState(false)

  const {
    isPendingTransaction,
    isModalOpen,
    tokenRewards,
    openModal,
    closeModal,
    setTokenRewards,
    onTransactionSuccess,
    hasCollectedRewards,
  } = useLpIncentives()

  const { data, isPlaceholderData, refetch, isLoading, fetchNextPage, hasNextPage, isFetching } =
    useGetPositionsInfiniteQuery(
      {
        address,
        chainIds: chainFilter ? [chainFilter] : currentModeChains,
        positionStatuses: statusFilter,
        protocolVersions: versionFilter,
        pageSize: PAGE_SIZE,
        pageToken: '',
        includeHidden: true,
      },
      !isConnected,
    )

  const loadedPositions = useMemo(() => {
    return data?.pages.flatMap((positionsResponse) => positionsResponse.positions) || []
  }, [data])

  const savedPositions = useRequestPositionsForSavedPairs()

  const isLoadingPositions = !!account.address && (isLoading || !data)
  const combinedPositions = useMemo(() => {
    return [
      ...loadedPositions,
      ...savedPositions
        .filter((position) => {
          const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
          const matchesStatus = position.data?.position?.status && statusFilter.includes(position.data.position.status)
          const matchesVersion =
            position.data?.position?.protocolVersion && versionFilter.includes(position.data.position.protocolVersion)
          return matchesChain && matchesStatus && matchesVersion
        })
        .map((p) => p.data?.position),
    ]
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => !!position)
      .reduce<PositionInfo[]>((unique, position) => {
        const positionId = `${position.poolId}-${position.tokenId}-${position.chainId}`
        const exists = unique.some((p) => `${p.poolId}-${p.tokenId}-${p.chainId}` === positionId)
        if (!exists) {
          unique.push(position)
        }
        return unique
      }, [])
  }, [loadedPositions, savedPositions, chainFilter, statusFilter, versionFilter])

  const { visiblePositions, hiddenPositions } = useMemo(() => {
    const visiblePositions: PositionInfo[] = []
    const hiddenPositions: PositionInfo[] = []

    combinedPositions.forEach((position) => {
      const isVisible = isPositionVisible({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isFlaggedSpam: position.isHidden,
      })

      if (isVisible) {
        visiblePositions.push(position)
      } else {
        hiddenPositions.push(position)
      }
    })

    return { visiblePositions, hiddenPositions }
  }, [combinedPositions, isPositionVisible])

  usePendingLPTransactionsChangeListener(refetch)

  const loadMorePositions = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  return (
    <Trace logImpression page={InterfacePageName.Positions}>
      <Flex
        row
        justifyContent="space-between"
        $xl={{ flexDirection: 'column', gap: '$gap16' }}
        width="100%"
        gap={20}
        py="$spacing24"
        px="$spacing40"
        $lg={{ px: '$spacing20' }}
      >
        <Flex grow shrink gap="$spacing24" maxWidth={740} $xl={{ maxWidth: '100%' }}>
          {isLPIncentivesEnabled && (
            <LpIncentiveRewardsCard
              walletAddress={account.address}
              onCollectRewards={() => {
                sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsButtonClicked)
                openModal()
              }}
              setTokenRewards={setTokenRewards}
              initialHasCollectedRewards={hasCollectedRewards}
            />
          )}
          <Flex row justifyContent="space-between" alignItems="center" mt={isLPIncentivesEnabled ? '$spacing28' : 0}>
            <PositionsHeader
              showFilters={account.isConnected}
              selectedChain={chainFilter}
              selectedVersions={versionFilter}
              selectedStatus={statusFilter}
              onChainChange={(selectedChain) => {
                setChainFilter(selectedChain ?? null)
              }}
              onVersionChange={(toggledVersion) => {
                setVersionFilter((prevVersionFilter) => {
                  if (prevVersionFilter.includes(toggledVersion)) {
                    return prevVersionFilter.filter((v) => v !== toggledVersion)
                  } else {
                    return [...prevVersionFilter, toggledVersion]
                  }
                })
              }}
              onStatusChange={(toggledStatus) => {
                setStatusFilter((prevStatusFilter) => {
                  if (prevStatusFilter.includes(toggledStatus)) {
                    return prevStatusFilter.filter((s) => s !== toggledStatus)
                  } else {
                    return [...prevStatusFilter, toggledStatus]
                  }
                })
              }}
            />
          </Flex>
          {!isLoadingPositions ? (
            combinedPositions.length > 0 ? (
              <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
                <VirtualizedPositionsList
                  positions={visiblePositions}
                  onLoadMore={loadMorePositions}
                  hasNextPage={hasNextPage}
                  isFetching={isFetching}
                />
                <HiddenPositions
                  showHiddenPositions={showHiddenPositions}
                  setShowHiddenPositions={setShowHiddenPositions}
                  hiddenPositions={hiddenPositions}
                />
              </Flex>
            ) : isConnected ? (
              <EmptyPositionsView />
            ) : (
              <DisconnectedWalletView />
            )
          ) : (
            <Flex gap="$gap16">
              {Array.from({ length: 5 }, (_, index) => (
                <LiquidityPositionCardLoader key={index} />
              ))}
            </Flex>
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
              <Flex grow flexBasis={0}>
                <Text variant="body3" color="$neutral1">
                  {t('pool.closedCTA.title')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {t('pool.closedCTA.description')}
                </Text>
              </Flex>
              <CloseIconWithHover onClose={() => setClosedCTADismissed(true)} size="$icon.20" />
            </Flex>
          )}
          {isConnected && (
            <Flex row centered $sm={{ flexDirection: 'column', alignItems: 'flex-start' }} mb="$spacing24" gap="$gap4">
              <Text variant="body3" color="$neutral2">
                {t('pool.import.link.description')}
              </Text>
              <Anchor href="/pools/v2/find" textDecorationLine="none">
                <Text variant="body3" color="$neutral1" {...ClickableTamaguiStyle}>
                  {t('pool.import.positions.v2')}
                </Text>
              </Anchor>
            </Flex>
          )}
        </Flex>
        <Flex gap="$gap32">
          <TopPools chainId={chainFilter} />
          {isConnected && (
            <Flex gap="$gap20" mb="$spacing24">
              <Text variant="subheading1">{t('liquidity.learnMoreLabel')}</Text>
              <Flex gap="$gap12">
                <LearnMoreTile
                  img={PROVIDE_LIQUIDITY}
                  text={t('liquidity.provideOnProtocols')}
                  link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
                />
                <LearnMoreTile
                  img={V4_HOOK}
                  text={t('liquidity.hooks')}
                  link={uniswapUrls.helpArticleUrls.v4HooksInfo}
                />
              </Flex>
              <ExternalArrowLink href={uniswapUrls.helpArticleUrls.positionsLearnMore}>
                {t('common.button.learn')}
              </ExternalArrowLink>
            </Flex>
          )}
        </Flex>
      </Flex>
      {isLPIncentivesEnabled && (
        <LpIncentiveClaimModal
          isOpen={isModalOpen}
          onClose={() => closeModal()}
          onSuccess={() => {
            sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsSuccess, {
              token_rewards: tokenRewards,
            })
            onTransactionSuccess()
          }}
          tokenRewards={tokenRewards}
          isPendingTransaction={isPendingTransaction}
          iconUrl={tokenLogo}
        />
      )}
    </Trace>
  )
}

interface HiddenPositionsProps {
  showHiddenPositions: boolean
  setShowHiddenPositions: (showHiddenPositions: boolean) => void
  hiddenPositions: PositionInfo[]
}

function HiddenPositions({ showHiddenPositions, setShowHiddenPositions, hiddenPositions }: HiddenPositionsProps) {
  const { t } = useTranslation()
  return (
    <ExpandoRow
      isExpanded={showHiddenPositions}
      toggle={() => setShowHiddenPositions(!showHiddenPositions)}
      numItems={hiddenPositions.length}
      title={t('common.hidden')}
      enableOverflow
    >
      <Flex gap="$gap16">
        {hiddenPositions.map((position) => (
          <Link
            key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
            style={{ textDecoration: 'none' }}
            to={getPositionUrl(position)}
          >
            <LiquidityPositionCard showVisibilityOption liquidityPosition={position} isVisible={false} />
          </Link>
        ))}
      </Flex>
    </ExpandoRow>
  )
}
