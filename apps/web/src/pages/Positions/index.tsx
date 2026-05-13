import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import tokenLogo from '~/assets/images/token-logo.png'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import { LiquidityPositionCardLoader } from '~/features/Liquidity/LiquidityPositionCard'
import { LpIncentiveClaimModal } from '~/features/Liquidity/LPIncentives/LpIncentiveClaimModal'
import { LpIncentiveRewardsCard } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardsCard'
import {
  DisconnectedWalletView,
  EmptyPositionsView,
  ErrorPositionsView,
} from '~/features/Liquidity/PositionsEmptyStates'
import { PositionsHeader } from '~/features/Liquidity/PositionsHeader'
import { useAccount } from '~/hooks/useAccount'
import { ClosedPositionsCTA } from '~/pages/Positions/components/ClosedPositionsCTA'
import { PositionsListSection } from '~/pages/Positions/components/PositionsListSection'
import { PositionsSidebar } from '~/pages/Positions/components/PositionsSidebar'
import { usePositionFilters } from '~/pages/Positions/hooks/usePositionFilters'
import { useWalletPositionsWeb } from '~/pages/Positions/hooks/useWalletPositionsWeb'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function Pool() {
  const account = useAccount()
  const { t } = useTranslation()
  const { address, isConnected } = account

  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives) && isConnected

  const { chainFilter, setChainFilter, versionFilter, toggleVersion, statusFilter, toggleStatus } = usePositionFilters()
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
              onVersionChange={toggleVersion}
              onStatusChange={toggleStatus}
            />
          </Flex>
          {hasErrorWithoutData && isConnected ? (
            <ErrorPositionsView onRetry={refetch} />
          ) : !isLoadingPositions ? (
            visiblePositions.length > 0 || hiddenPositions.length > 0 ? (
              <PositionsListSection
                visiblePositions={visiblePositions}
                hiddenPositions={hiddenPositions}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                isPlaceholderData={isPlaceholderData}
                loadMorePositions={loadMorePositions}
                showHiddenPositions={showHiddenPositions}
                setShowHiddenPositions={setShowHiddenPositions}
              />
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
          <ClosedPositionsCTA show={!statusFilter.includes(PositionStatus.CLOSED) && !!account.address} />
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
        <PositionsSidebar chainFilter={chainFilter} isConnected={isConnected} />
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

export default Pool
