import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import tokenLogo from 'assets/images/token-logo.png'
import V4_HOOK from 'assets/images/v4Hooks.png'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
import { LpIncentiveClaimModal } from 'components/Liquidity/LpIncentiveClaimModal'
// import LpIncentiveRewardsCard from 'components/Liquidity/LpIncentiveRewardsCard'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, parseRestPosition } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { useLpIncentives } from 'hooks/useLpIncentives'
import { SUPPORTED_V2POOL_CHAIN_IDS } from 'hooks/useNetworkSupportsV2'
import { useV2Pairs } from 'hooks/useV2Pairs'
import { atom, useAtom } from 'jotai'
import JSBI from 'jsbi'
import {
  NETWORKS_POSITIONS_UNSUPPORTED,
  NETWORKS_V2_AND_FEWV2,
  NETWORKS_V2_ONLY,
  NETWORKS_WITHOUT_FEWTOKEN,
} from 'pages/LegacyPool/redirects'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { TopPools } from 'pages/Pool/Positions/TopPools'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContracts } from 'wagmi'
// import { ExternalArrowLink } from 'pages/Pool/Positions/shared'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { FixedSizeList } from 'react-window'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import {
  useRequestPositionsForSavedFewPairs,
  useRequestPositionsForSavedPairs,
  useSavedPairsForUnsupportedNetworks,
} from 'state/user/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Flex, Text, useMedia } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Pools } from 'ui/src/components/icons/Pools'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { ringswapUrls } from 'uniswap/src/constants/urls'
import { useGetPositionsInfiniteQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { getInternalLinkHref } from 'utils/routing'

const PAGE_SIZE = 25

function DisconnectedWalletView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()
  const { chains } = useEnabledChains()

  // Effective chain for deciding FewToken support:
  // - Fallback to the sole enabled chain when only one chain is active
  const effectiveChain: UniverseChainId | null =
    chains.length === 1 ? (chains[0] as UniverseChainId | undefined) ?? null : null

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
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Wallet size="$icon.24" color="$neutral1" />
        </Flex>
        <Text variant="subheading1">{t('positions.welcome.connect.wallet')}</Text>
        <Text variant="body2" color="$neutral2">
          {t('positions.welcome.connect.description')}
        </Text>
        <Flex row gap="$gap8">
          <Button
            variant="default"
            size="small"
            emphasis="secondary"
            onPress={() => {
              if (effectiveChain && NETWORKS_WITHOUT_FEWTOKEN.includes(effectiveChain)) {
                navigate('/positions/create/v2')
              } else {
                navigate('/positions/create/FewV2')
              }
            }}
          >
            {t('position.new')}
          </Button>
          <Button variant="default" size="small" width={160} onPress={accountDrawer.open}>
            {t('common.connectWallet.button')}
          </Button>
        </Flex>
      </Flex>
      <Flex gap="$gap20" mb="$spacing24">
        <Flex row gap="$gap12">
          {/* <LearnMoreTile
            width="100%"
            img={PROVIDE_LIQUIDITY}
            text={t('liquidity.provideOnProtocols')}
            link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
          /> */}
          <LearnMoreTile width="100%" img={V4_HOOK} text={t('liquidity.hooks')} link={ringswapUrls.ringswaphooksUrl} />
        </Flex>
      </Flex>
    </Flex>
  )
}

function EmptyPositionsView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const account = useAccount()
  const { chains } = useEnabledChains()

  // Effective chain for deciding FewToken support:
  // - Prefer the connected chain if available
  // - Fallback to the sole enabled chain when only one chain is active
  const effectiveChain: UniverseChainId | null =
    account.chainId ?? (chains.length === 1 ? (chains[0] as UniverseChainId | undefined) ?? null : null)

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
        <Flex row gap="$gap8">
          <Button variant="default" size="small" emphasis="secondary" onPress={() => navigate('/explore/pools')}>
            {t('pools.explore')}
          </Button>
          <Button
            variant="default"
            size="small"
            width={160}
            onPress={() => {
              if (effectiveChain && NETWORKS_WITHOUT_FEWTOKEN.includes(effectiveChain)) {
                navigate('/positions/create/v2')
              } else {
                navigate('/positions/create/FewV2')
              }
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
const versionFilterAtom = atom<ProtocolVersion[]>([
  ProtocolVersion.V4,
  ProtocolVersion.V3,
  ProtocolVersion.V2,
  ProtocolVersion.Fewv2,
])
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
  const media = useMedia()
  const positionItemHeight = useMemo(() => {
    return media.sm ? 360 : media.md ? 290 : 200 // Approximate height of a position card
  }, [media])

  const listHeight = useMemo(() => {
    return positions.length * positionItemHeight
  }, [positionItemHeight, positions.length])

  const onItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }) => {
      // Load more if we're near the end
      if (visibleStopIndex >= positions.length - 5 && hasNextPage && !isFetching) {
        onLoadMore()
      }
    },
    [positions.length, hasNextPage, isFetching, onLoadMore],
  )

  return (
    <Flex grow>
      <FixedSizeList
        height={listHeight}
        width="100%"
        itemCount={positions.length}
        itemSize={positionItemHeight}
        itemData={positions}
        onItemsRendered={onItemsRendered}
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
                <LiquidityPositionCard showVisibilityOption liquidityPosition={position} />
              </Link>
            </Flex>
          )
        }}
      </FixedSizeList>
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
    // openModal,
    closeModal,
    // setTokenRewards,
    onTransactionSuccess,
    // hasCollectedRewards,
  } = useLpIncentives()

  // Filter protocol versions based on selected chains
  // If any selected chain doesn't support fewtoken, remove Fewv2 from protocol versions
  const filteredProtocolVersions = useMemo(() => {
    const selectedChainIds = chainFilter ? [chainFilter] : currentModeChains
    const hasFewV2UnsupportedChain = selectedChainIds.some((chainId) =>
      NETWORKS_WITHOUT_FEWTOKEN.includes(chainId as UniverseChainId),
    )
    const hasNoPositionsChain = selectedChainIds.some((chainId) =>
      NETWORKS_POSITIONS_UNSUPPORTED.includes(chainId as UniverseChainId),
    )

    if (hasNoPositionsChain) {
      return versionFilter.filter((version) => version !== ProtocolVersion.Fewv2 && version !== ProtocolVersion.V2)
    }
    if (hasFewV2UnsupportedChain) {
      return versionFilter.filter((version) => version !== ProtocolVersion.Fewv2)
    }

    return versionFilter
  }, [chainFilter, currentModeChains, versionFilter])

  // PoolsService/ListPositions does not support networks without fewtoken (e.g. X Layer).
  // When the user explicitly filters to such a network, skip the API query and rely on the
  // direct pair-based fallback (`unsupportedNetworkPositions`) instead.
  // Chains in NETWORKS_POSITIONS_UNSUPPORTED have no V2/FewV2 positions at all.
  const isUnsupportedNetworkSelected =
    !!chainFilter &&
    (NETWORKS_WITHOUT_FEWTOKEN.includes(chainFilter) || NETWORKS_POSITIONS_UNSUPPORTED.includes(chainFilter))

  const { data, isPlaceholderData, refetch, isLoading, fetchNextPage, hasNextPage, isFetching } =
    useGetPositionsInfiniteQuery(
      {
        address,
        chainIds: chainFilter ? [chainFilter] : currentModeChains,
        positionStatuses: statusFilter,
        protocolVersions: filteredProtocolVersions,
        pageSize: PAGE_SIZE,
        pageToken: '',
        includeHidden: true,
      },
      !isConnected || isUnsupportedNetworkSelected,
    )

  const loadedPositions = useMemo(() => {
    return data?.pages.flatMap((positionsResponse) => positionsResponse.positions) || []
  }, [data])

  const savedPositions = useRequestPositionsForSavedPairs()
  const savedFewPositions = useRequestPositionsForSavedFewPairs()
  const unsupportedNetworkPairs = useSavedPairsForUnsupportedNetworks()

  // Fetch pair data for unsupported networks
  const unsupportedNetworkPairData = useV2Pairs(unsupportedNetworkPairs.map((p) => [p.token0, p.token1]))

  // Get liquidity tokens for all pairs that exist
  const unsupportedNetworkLiquidityTokens = useMemo(() => {
    return unsupportedNetworkPairData
      .map(([pairState, pair]) => {
        if (pairState !== 2 || !pair) {
          // PairState.EXISTS = 2
          return null
        }
        return pair.liquidityToken
      })
      .filter((token): token is Token => token !== null)
  }, [unsupportedNetworkPairData])

  // Batch fetch balances and total supplies
  const { data: balanceAndSupplyData } = useReadContracts({
    contracts: useMemo(() => {
      return unsupportedNetworkLiquidityTokens.flatMap((token) => [
        {
          address: assume0xAddress(token.address),
          chainId: token.chainId,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account.address],
        },
        {
          address: assume0xAddress(token.address),
          chainId: token.chainId,
          abi: erc20Abi,
          functionName: 'totalSupply',
        },
      ])
    }, [unsupportedNetworkLiquidityTokens, account.address]),
    query: { enabled: !!account.address && unsupportedNetworkLiquidityTokens.length > 0 },
  })

  // Construct PositionInfo for unsupported network pairs
  const unsupportedNetworkPositions = useMemo(() => {
    if (!balanceAndSupplyData || unsupportedNetworkLiquidityTokens.length === 0) {
      return []
    }

    // Create a map of liquidity token address to index in the data array
    const tokenToDataIndex = new Map<string, number>()
    unsupportedNetworkLiquidityTokens.forEach((token, tokenIndex) => {
      tokenToDataIndex.set(token.address, tokenIndex * 2)
    })

    return unsupportedNetworkPairs.map((pairInfo, index) => {
      const [pairState, pair] = unsupportedNetworkPairData[index] || [null, null]
      if (pairState !== 2 || !pair) {
        return null
      }

      const dataIndex = tokenToDataIndex.get(pair.liquidityToken.address)
      if (dataIndex === undefined) {
        return null
      }

      const balanceResult = balanceAndSupplyData[dataIndex]
      const totalSupplyResult = balanceAndSupplyData[dataIndex + 1]

      if (!balanceResult?.result || !totalSupplyResult?.result) {
        return null
      }

      const userPoolBalance = CurrencyAmount.fromRawAmount(pair.liquidityToken, balanceResult.result.toString())
      const totalPoolTokens = CurrencyAmount.fromRawAmount(pair.liquidityToken, totalSupplyResult.result.toString())

      // Only show positions where user has a balance
      if (JSBI.equal(userPoolBalance.quotient, JSBI.BigInt(0))) {
        return null
      }

      const [token0Deposited, token1Deposited] =
        !!pair &&
        !!totalPoolTokens &&
        !!userPoolBalance &&
        JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
          ? [
              pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
              pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
            ]
          : [undefined, undefined]

      return {
        status: PositionStatus.IN_RANGE,
        version: ProtocolVersion.V2,
        pair,
        liquidityToken: pair.liquidityToken,
        chainId: pairInfo.chainId,
        poolId: pair.liquidityToken.address,
        currency0Amount: token0Deposited || CurrencyAmount.fromRawAmount(pair.token0, '0'),
        currency1Amount: token1Deposited || CurrencyAmount.fromRawAmount(pair.token1, '0'),
        totalSupply: totalPoolTokens,
        liquidityAmount: userPoolBalance,
        isHidden: false,
      } as PositionInfo
    })
  }, [unsupportedNetworkPairs, unsupportedNetworkPairData, unsupportedNetworkLiquidityTokens, balanceAndSupplyData])

  const isLoadingPositions =
    !!account.address &&
    !(
      !!chainFilter &&
      (NETWORKS_WITHOUT_FEWTOKEN.includes(chainFilter) || NETWORKS_POSITIONS_UNSUPPORTED.includes(chainFilter))
    ) &&
    (isLoading || !data)
  const combinedPositions = useMemo(() => {
    // Parse positions from API responses
    const parsedApiPositions = [
      ...loadedPositions,
      ...(savedPositions
        .filter((position) => {
          const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
          const matchesStatus =
            position.data?.position?.status && statusFilter.includes(position.data?.position?.status)
          const matchesVersion =
            position.data?.position?.protocolVersion && versionFilter.includes(position.data?.position?.protocolVersion)
          return matchesChain && matchesStatus && matchesVersion
        })
        .map((p) => p.data?.position) ?? []),
      ...(savedFewPositions
        .filter((position) => {
          const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
          const matchesStatus =
            position.data?.position?.status && statusFilter.includes(position.data?.position?.status)
          const matchesVersion =
            position.data?.position?.protocolVersion && versionFilter.includes(position.data?.position?.protocolVersion)
          return matchesChain && matchesStatus && matchesVersion
        })
        .map((p) => p.data?.position) ?? []),
    ]
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => !!position)
      .filter((position) => {
        // For v3/v4, ensure we only show positions owned by the connected address.
        if (position.version === ProtocolVersion.V3 || position.version === ProtocolVersion.V4) {
          return position.owner?.toLowerCase() === address?.toLowerCase()
        }
        // For v2/FewV2, hide positions where user liquidity is zero (prevents phantom entries when switching accounts).
        if (
          (position.version === ProtocolVersion.V2 || position.version === ProtocolVersion.Fewv2) &&
          position.liquidityAmount
        ) {
          return !JSBI.equal(position.liquidityAmount.quotient, JSBI.BigInt(0))
        }
        return true
      })

    // Filter unsupported network positions by chain/status/version filters
    const filteredUnsupportedPositions = unsupportedNetworkPositions.filter((p): p is PositionInfo => {
      if (!p) {
        return false
      }
      const matchesChain = !chainFilter || p.chainId === chainFilter
      const matchesStatus = statusFilter.includes(p.status)
      const matchesVersion = versionFilter.includes(p.version)
      return matchesChain && matchesStatus && matchesVersion
    })

    // Combine and deduplicate
    return [...parsedApiPositions, ...filteredUnsupportedPositions].reduce<PositionInfo[]>((unique, position) => {
      const positionId = `${position.poolId}-${position.tokenId ?? ''}-${position.chainId}`
      const exists = unique.some((p) => `${p.poolId}-${p.tokenId ?? ''}-${p.chainId}` === positionId)
      if (!exists) {
        unique.push(position)
      }
      return unique
    }, [])
  }, [
    address,
    loadedPositions,
    savedPositions,
    savedFewPositions,
    unsupportedNetworkPositions,
    chainFilter,
    statusFilter,
    versionFilter,
  ])

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
    <Trace logImpression page={InterfacePageNameLocal.Positions}>
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
          {/* {isLPIncentivesEnabled && (
            <LpIncentiveRewardsCard
              walletAddress={account.address}
              onCollectRewards={() => {
                sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsButtonClicked)
                openModal()
              }}
              setTokenRewards={setTokenRewards}
              initialHasCollectedRewards={hasCollectedRewards}
            />
          )} */}
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
                  if (prevStatusFilter?.includes(toggledStatus)) {
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
            <Flex
              flexDirection="column"
              alignItems="flex-start"
              mb="$spacing24"
              gap="$gap12"
              $sm={{ alignItems: 'flex-start' }}
            >
              {(() => {
                const enabledSet = new Set(currentModeChains)
                const v2Labels = NETWORKS_V2_ONLY.filter(
                  (id) => !NETWORKS_POSITIONS_UNSUPPORTED.includes(id) && getChainInfo(id) && enabledSet.has(id),
                ).map((id) => getChainLabel(id))
                const fewv2Labels = SUPPORTED_V2POOL_CHAIN_IDS.filter(
                  (id) =>
                    !NETWORKS_V2_ONLY.includes(id as UniverseChainId) &&
                    !NETWORKS_POSITIONS_UNSUPPORTED.includes(id as UniverseChainId) &&
                    getChainInfo(id as UniverseChainId) &&
                    enabledSet.has(id as UniverseChainId),
                ).map((id) => getChainLabel(id as UniverseChainId))
                const bothLabels = NETWORKS_V2_AND_FEWV2.filter((id) => getChainInfo(id) && enabledSet.has(id)).map(
                  (id) => getChainLabel(id),
                )
                return (
                  <Flex flexDirection="column" gap="$gap8">
                    <Text variant="body3" color="$neutral2">
                      {t('pool.import.reminder.intro')}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {t('pool.import.reminder.v2', { v2Networks: v2Labels.join(', ') })}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {t('pool.import.reminder.fewv2', { fewv2Networks: fewv2Labels.join(', ') })}
                    </Text>
                    {bothLabels.length > 0 && (
                      <Text variant="body3" color="$neutral2">
                        {t('pool.import.reminder.both', { networks: bothLabels.join(', ') })}
                      </Text>
                    )}
                    <Text variant="body3" color="$neutral2">
                      {t('pool.import.reminder.cta')}
                    </Text>
                  </Flex>
                )
              })()}
              <Flex row centered $sm={{ flexDirection: 'column', alignItems: 'flex-start' }} gap="$gap4">
                <Text variant="body3" color="$neutral2">
                  {t('pool.import.link.description')}
                </Text>
                <Anchor href={getInternalLinkHref('/pools/v2/find')} textDecorationLine="none">
                  <Text variant="body3" color="$neutral1" {...ClickableTamaguiStyle}>
                    {t('pool.import.positions.v2')}
                  </Text>
                </Anchor>
              </Flex>
              <Flex row centered $sm={{ flexDirection: 'column', alignItems: 'flex-start' }} gap="$gap4">
                <Text variant="body3" color="$neutral2">
                  {t('pool.import.link.description.fewv2')}
                </Text>
                <Anchor href={getInternalLinkHref('/pools/fewV2/find')} textDecorationLine="none">
                  <Text variant="body3" color="$neutral1" {...ClickableTamaguiStyle}>
                    {t('pool.import.positions.fewv2')}
                  </Text>
                </Anchor>
              </Flex>
            </Flex>
          )}
        </Flex>
        <Flex gap="$gap32">
          <TopPools chainId={chainFilter} />
          {isConnected && (
            <Flex gap="$gap20" mb="$spacing24">
              <Text variant="subheading1">{t('liquidity.learnMoreLabel')}</Text>
              <Flex gap="$gap12">
                {/* <LearnMoreTile
                  img={PROVIDE_LIQUIDITY}
                  text={t('liquidity.provideOnProtocols')}
                  link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
                /> */}
                <LearnMoreTile img={V4_HOOK} text={t('liquidity.hooks')} link={ringswapUrls.ringswaphooksUrl} />
              </Flex>
              {/* <ExternalArrowLink href={uniswapUrls.helpArticleUrls.positionsLearnMore}>
                {t('common.button.learn')}
              </ExternalArrowLink> */}
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
      {showHiddenPositions && (
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
      )}
    </ExpandoRow>
  )
}
