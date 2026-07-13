import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfacePageName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import tokenLogo from '~/assets/images/token-logo.png'
import { DisconnectedWalletView } from '~/features/Liquidity/components/emptyStates/DisconnectedWalletView'
import { EmptyPositionsView } from '~/features/Liquidity/components/emptyStates/EmptyPositionsView'
import { ErrorPositionsView } from '~/features/Liquidity/components/emptyStates/ErrorPositionsView'
import { PoolsUnavailableOnSolanaView } from '~/features/Liquidity/components/emptyStates/PoolsUnavailableOnSolanaView'
import { LiquidityLearnMoreTiles } from '~/features/Liquidity/components/LearnMoreTiles'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { LiquidityPositionCardLoader } from '~/features/Liquidity/LiquidityPositionCard'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'
import { useLpIncentivesUserHasRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentivesUserHasRewards'
import { LpIncentiveClaimModal } from '~/features/Liquidity/LPIncentives/LpIncentiveClaimModal'
import { LpIncentiveRewardsCard } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardsCard'
import { PositionsHeader } from '~/features/Liquidity/PositionsHeader'
import { PositionsHeroHeader } from '~/features/Liquidity/PositionsHeroHeader'
import { PositionsListSection } from '~/features/Liquidity/PositionsListSection'
import { PositionsSummaryChips } from '~/features/Liquidity/PositionsSummaryChips'
import { PositionsTable, PositionsTableLoader } from '~/features/Liquidity/PositionsTable'
import { useAccount } from '~/hooks/useAccount'
import { ClosedPositionsCTA } from '~/pages/Positions/components/ClosedPositionsCTA'
import { EmptyPositionsDiscoveryView } from '~/pages/Positions/components/EmptyPositionsDiscoveryView'
import { PositionsSidebar } from '~/pages/Positions/components/PositionsSidebar'
import { usePositionFilters } from '~/pages/Positions/hooks/usePositionFilters'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { useCreatePositionHref } from '~/utils/createPositionRoute'
import { buildImportV2PositionsHref } from '~/utils/importV2PositionsRoute'

function getPositionsViewState({
  isConnected,
  isLoadingPositions,
  hasErrorWithoutData,
  connectedWithoutEVM,
  hasPositions,
  isV2EndpointsPositionsEnabled,
}: {
  isConnected: boolean
  isLoadingPositions: boolean
  hasErrorWithoutData: boolean
  connectedWithoutEVM: boolean
  hasPositions: boolean
  isV2EndpointsPositionsEnabled: boolean
}): { isEmptyPositionsState: boolean; showDiscoveryEmptyState: boolean } {
  const hasNoPositionsToShow = !isLoadingPositions && !connectedWithoutEVM && !hasPositions
  const isEmptyPositionsState = isConnected && !hasErrorWithoutData && hasNoPositionsToShow
  const showDiscoveryEmptyState =
    isV2EndpointsPositionsEnabled && hasNoPositionsToShow && !(isConnected && hasErrorWithoutData)
  return {
    isEmptyPositionsState,
    showDiscoveryEmptyState,
  }
}

export function Pool() {
  const account = useAccount()
  const { t } = useTranslation()
  const { address, isConnected } = account

  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives) && isConnected
  const isV2EndpointsPositionsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsPositions)
  const newPositionHref = useCreatePositionHref()
  const connectedWithoutEVM = useIsMissingPlatformWallet(Platform.EVM)

  const { chainFilter, setChainFilter, versionFilter, toggleVersion, statusFilter, setStatusFilter, toggleStatus } =
    usePositionFilters()
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

  const userHasLpRewards = useLpIncentivesUserHasRewards(address, hasCollectedRewards)
  const showLpIncentives = isLPIncentivesEnabled && userHasLpRewards

  const { formattedUsdValue: formattedRewardsUsdValue } = useLpIncentiveRewardsUsdValue(tokenRewards)

  const trace = useTrace()
  const handleCollectRewards = useCallback(() => {
    sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsButtonClicked, { ...trace })
    openModal()
  }, [openModal, trace])

  const handleChainChange = useCallback(
    (selectedChain: UniverseChainId | null) => {
      setChainFilter(selectedChain)
    },
    [setChainFilter],
  )

  const handleClaimSuccess = useCallback(() => {
    sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsSuccess, {
      token_rewards: tokenRewards,
    })
    onTransactionSuccess()
  }, [tokenRewards, onTransactionSuccess])

  const {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    refetch,
    loadMorePositions,
  } = useWalletPositionsWeb({
    address,
    chainFilter,
    versionFilter,
    statusFilter,
  })

  const hasPositions = visiblePositions.length > 0 || hiddenPositions.length > 0
  const { isEmptyPositionsState, showDiscoveryEmptyState } = getPositionsViewState({
    isConnected,
    isLoadingPositions,
    hasErrorWithoutData,
    connectedWithoutEVM,
    hasPositions,
    isV2EndpointsPositionsEnabled,
  })
  const showSummaryChips = isV2EndpointsPositionsEnabled && isConnected && !isEmptyPositionsState

  return (
    <Trace logImpression page={InterfacePageName.Positions} section={SectionName.PositionsList}>
      {isV2EndpointsPositionsEnabled && <PositionsHeroHeader />}
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
        <Flex
          grow
          shrink
          gap="$spacing24"
          maxWidth={isV2EndpointsPositionsEnabled ? '100%' : 740}
          $xl={{ maxWidth: '100%' }}
        >
          {showSummaryChips ? (
            <PositionsSummaryChips
              walletAddress={account.address}
              onCollectRewards={handleCollectRewards}
              setTokenRewards={setTokenRewards}
              initialHasCollectedRewards={hasCollectedRewards}
            />
          ) : showLpIncentives ? (
            <LpIncentiveRewardsCard
              walletAddress={account.address}
              onCollectRewards={handleCollectRewards}
              setTokenRewards={setTokenRewards}
              initialHasCollectedRewards={hasCollectedRewards}
            />
          ) : null}
          {!showDiscoveryEmptyState && (
            <Flex
              row
              justifyContent="space-between"
              alignItems="center"
              mt={showLpIncentives || showSummaryChips ? '$spacing28' : 0}
            >
              <PositionsHeader
                showFilters={account.isConnected && !isV2EndpointsPositionsEnabled}
                selectedChain={chainFilter}
                selectedVersions={versionFilter}
                selectedStatus={statusFilter}
                onChainChange={handleChainChange}
                onVersionChange={toggleVersion}
                onStatusChange={toggleStatus}
              />
            </Flex>
          )}
          {connectedWithoutEVM ? (
            <>
              <PoolsUnavailableOnSolanaView withBorder />
              <LiquidityLearnMoreTiles />
            </>
          ) : hasErrorWithoutData && isConnected ? (
            <ErrorPositionsView onRetry={refetch} />
          ) : !isLoadingPositions ? (
            hasPositions ? (
              isV2EndpointsPositionsEnabled ? (
                <PositionsTable
                  visiblePositions={visiblePositions}
                  hiddenPositions={hiddenPositions}
                  hasNextPage={hasNextPage}
                  isFetching={isFetching}
                  isPlaceholderData={isPlaceholderData}
                  loadMorePositions={loadMorePositions}
                  showHiddenPositions={showHiddenPositions}
                  setShowHiddenPositions={setShowHiddenPositions}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  versionFilter={versionFilter}
                  toggleVersion={toggleVersion}
                  chainFilter={chainFilter}
                  setChainFilter={setChainFilter}
                />
              ) : (
                <PositionsListSection
                  visiblePositions={visiblePositions}
                  hiddenPositions={hiddenPositions}
                  hasNextPage={hasNextPage}
                  isFetching={isFetching}
                  isPlaceholderData={isPlaceholderData}
                  loadMorePositions={loadMorePositions}
                  showHiddenPositions={showHiddenPositions}
                  setShowHiddenPositions={setShowHiddenPositions}
                  hiddenSectionPadding={{ py: '$spacing12', px: 0 }}
                />
              )
            ) : isV2EndpointsPositionsEnabled ? (
              <EmptyPositionsDiscoveryView />
            ) : isConnected ? (
              <EmptyPositionsView newPositionHref={newPositionHref} withBorder />
            ) : (
              <DisconnectedWalletView />
            )
          ) : isV2EndpointsPositionsEnabled ? (
            <PositionsTableLoader
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              versionFilter={versionFilter}
              toggleVersion={toggleVersion}
              chainFilter={chainFilter}
              setChainFilter={setChainFilter}
            />
          ) : (
            <Flex gap="$gap16">
              {Array.from({ length: 5 }, (_, index) => (
                <LiquidityPositionCardLoader key={index} />
              ))}
            </Flex>
          )}
          <ClosedPositionsCTA
            show={!isEmptyPositionsState && !statusFilter.includes(PositionStatus.CLOSED) && !!account.address}
          />
          {isConnected && !isEmptyPositionsState && (
            <Flex row centered $sm={{ flexDirection: 'column', alignItems: 'flex-start' }} mb="$spacing24" gap="$gap4">
              <Text variant="body3" color="$neutral2">
                {t('pool.import.link.description')}
              </Text>
              <Anchor href={buildImportV2PositionsHref()} textDecorationLine="none">
                <Text variant="body3" color="$neutral1" {...ClickableTamaguiStyle}>
                  {t('pool.import.positions.v2')}
                </Text>
              </Anchor>
            </Flex>
          )}
        </Flex>
        {!isV2EndpointsPositionsEnabled && <PositionsSidebar chainFilter={chainFilter} isConnected={isConnected} />}
      </Flex>
      {(showLpIncentives || showSummaryChips) && (
        <LpIncentiveClaimModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleClaimSuccess}
          tokenRewards={tokenRewards}
          isPendingTransaction={isPendingTransaction}
          iconUrl={tokenLogo}
          formattedRewardsUsdValue={formattedRewardsUsdValue}
        />
      )}
    </Trace>
  )
}

export default Pool
