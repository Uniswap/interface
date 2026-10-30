import { isEVMChain, Platform } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { spacing } from '@universe/mycelium/tokens'
//! tamagui-ignore
// tamagui-ignore
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import {
  selectHasSeenToucanIntroModal,
  selectHasSeenToucanIntroModalForWallet,
} from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasSeenToucanIntroModal, setToucanIntroModalSeenByWallet } from 'uniswap/src/features/behaviorHistory/slice'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants/trace/page'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { isEVMAddress, isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import { ActivitySection } from '~/features/Toucan/Auction/ActivityTimeline/ActivitySection'
import { AuctionDetailsModal } from '~/features/Toucan/Auction/ActivityTimeline/AuctionDetailsModal'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'
import { AuctionHeader } from '~/features/Toucan/Auction/AuctionHeader'
import { AuctionInfo } from '~/features/Toucan/Auction/AuctionStats/AuctionInfo'
import { AuctionStatsGrid } from '~/features/Toucan/Auction/AuctionStats/AuctionStats'
import { AuctionIntroBanner } from '~/features/Toucan/Auction/Banners/AuctionIntro/AuctionIntroBanner'
import { AuctionStatsBanner } from '~/features/Toucan/Auction/Banners/AuctionStatsBanner/AuctionStatsBanner'
import { BiddingClosedStrip } from '~/features/Toucan/Auction/Banners/BiddingClosedStrip'
import { QuickLaunchStatsRow } from '~/features/Toucan/Auction/Banners/QuickLaunchStatsRow'
import { TokenLaunchedBanner } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBanner'
import { TradeTokenBanner } from '~/features/Toucan/Auction/Banners/TradeTokenBanner'
import { AuctionChartContainer } from '~/features/Toucan/Auction/BidDistributionChart/AuctionChartContainer'
import { BidForm } from '~/features/Toucan/Auction/BidForm/BidForm'
import { Bids } from '~/features/Toucan/Auction/Bids/Bids'
import { WithdrawModal } from '~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import { usePostAuctionPanelState } from '~/features/Toucan/Auction/hooks/usePostAuctionPanelState'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { PostAuctionPanel } from '~/features/Toucan/Auction/PostAuctionPanel'
import { AuctionStoreProvider } from '~/features/Toucan/Auction/store/AuctionStoreContextProvider'
import {
  AuctionDetails,
  AuctionDetailsLoadState,
  AuctionProgressState,
  BidInfoTab,
} from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import {
  getTokenLaunchTradeAvailabilityBlock,
  isTokenLaunchTradeAvailable,
  shouldShowTokenLaunchedBanner as getShouldShowTokenLaunchedBanner,
} from '~/features/Toucan/Auction/utils/tokenLaunchedBannerUtils'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { isTradingRestrictedUntilTge } from '~/features/Toucan/Config/config'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'
import { ToucanContainer } from '~/features/Toucan/Shared/ToucanContainer'
import { ToucanIntroModal } from '~/features/Toucan/ToucanIntroModal'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { useStateRehydrated } from '~/hooks/useStateRehydrated'
import { useDynamicMetatags } from '~/pages/metatags'
import { NotFound } from '~/pages/NotFound'
import { LeftPanel, RightPanel, TokenDetailsLayout } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { formatAuctionMetatagTitleName } from '~/shared-cloud/metatags'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { InterfaceState } from '~/state/webReducer'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

const TOUCAN_INTRO_MODAL_SESSION_KEY = 'toucan-intro-modal-seen-session'

function seenToucanIntroThisSession(): boolean {
  try {
    return Boolean(sessionStorage.getItem(TOUCAN_INTRO_MODAL_SESSION_KEY))
  } catch {
    // sessionStorage unavailable; the persisted flags still answer for this visitor.
    return false
  }
}

/**
 * The explainer is shown once, so it only opens when every source that could record a prior view
 * agrees there was none. Both persisted flags read false until redux-persist rehydrates, so a
 * pre-rehydration answer re-shows the modal to someone who already dismissed it. The wallet is
 * likewise undefined for the first frames of a reconnect, which is why dismissing also sets the
 * disconnected flag (see `handleCloseModal`) — a wallet that has never seen it still gets its own
 * first view once the address resolves.
 */
export function shouldShowToucanIntroModal({
  rehydrated,
  seenThisSession,
  walletAddress,
  hasSeenDisconnected,
  hasWalletSeen,
}: {
  rehydrated: boolean
  seenThisSession: boolean
  walletAddress: string | undefined
  hasSeenDisconnected: boolean
  hasWalletSeen: boolean
}): boolean {
  if (!rehydrated || seenThisSession) {
    return false
  }
  return walletAddress ? !hasWalletSeen : !hasSeenDisconnected
}

function usePageMetatags(auctionDetails: AuctionDetails | null) {
  const { chainName, auctionAddress } = useParams<{ chainName: string; auctionAddress: string }>()

  const tokenSymbol = auctionDetails?.token?.currency.symbol ?? auctionDetails?.tokenSymbol
  const tokenName = auctionDetails?.token?.currency.name ?? auctionDetails?.tokenName ?? tokenSymbol
  const pageTitle = formatAuctionMetatagTitleName(tokenSymbol, tokenName)
  const pageDescription = tokenName ? `Bid on ${tokenName} in a Uniswap token auction.` : undefined
  const metatagProperties = useMemo(
    () => ({
      title: pageTitle,
      image:
        chainName && auctionAddress
          ? window.location.origin + '/api/image/auctions/' + chainName + '/' + auctionAddress
          : undefined,
      url: window.location.href,
      description: pageDescription,
    }),
    [auctionAddress, chainName, pageDescription, pageTitle],
  )
  const metatags = useDynamicMetatags(metatagProperties)

  return { pageTitle, metatags }
}

function useTokenLaunchedBannerState({
  auctionDetails,
  auctionState,
  currentBlockNumber,
  isGraduated,
  isTokenProvenanceEnabled,
}: {
  auctionDetails: AuctionDetails | null
  auctionState: AuctionProgressState
  currentBlockNumber: number | undefined
  isGraduated: boolean
  isTokenProvenanceEnabled: boolean
}) {
  const isAuctionEnded = auctionState === AuctionProgressState.ENDED
  const displayState = useAuctionDisplayState()
  // The scheduled migration block and whether migration has actually run are both served by
  // data-api now (lbp_migration_block / lbp_migration_tx_hash), so no on-chain lookup is needed.
  const migrationBlock = auctionDetails?.lbpMigrationBlock
  const hasMigrated = Boolean(auctionDetails?.lbpMigrationTxHash)
  const shouldShowTokenLaunchedBanner =
    auctionDetails !== null &&
    getShouldShowTokenLaunchedBanner({
      isAuctionEnded,
      isTokenProvenanceEnabled,
      isGraduated,
      displayState,
      tradingRestrictedUntilTge: isTradingRestrictedUntilTge({
        chainId: auctionDetails.chainId,
        tokenAddress: auctionDetails.tokenAddress,
      }),
    })
  const isTradeAvailable =
    auctionDetails !== null &&
    isTokenLaunchTradeAvailable({
      claimBlock: auctionDetails.claimBlock,
      currentBlockNumber,
      hasLbpStrategyAddress: Boolean(auctionDetails.lbpStrategyAddress),
      isGraduated,
      hasMigrated,
    })
  const tradeAvailabilityBlock =
    auctionDetails !== null && !isTradeAvailable
      ? getTokenLaunchTradeAvailabilityBlock({
          claimBlock: auctionDetails.claimBlock,
          hasLbpStrategyAddress: Boolean(auctionDetails.lbpStrategyAddress),
          migrationBlock,
        })
      : undefined

  return {
    isAuctionEnded,
    // Same phase as BiddingClosedStrip so the tightened spacing and the strip agree at the end block.
    isProvenanceAuctionEnded: displayState?.phase === AuctionDisplayPhase.Ended,
    shouldShowTokenLaunchedBanner,
    isTradeAvailable,
    tradeAvailabilityBlock,
  }
}

function ToucanTokenContent({ isModalOpen, onCloseModal }: { isModalOpen: boolean; onCloseModal: () => void }) {
  const { t } = useTranslation()
  const isTokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const { chainName, auctionAddress } = useParams<{ chainName: string; auctionAddress: string }>()
  const {
    auctionState,
    auctionDetails,
    auctionDetailsLoadState,
    tokenColor,
    outcome,
    isGraduated,
    currentBlockNumber,
    auctionTokenAddress,
  } = useAuctionStore((state) => ({
    auctionState: state.progress.state,
    auctionDetails: state.auctionDetails,
    auctionDetailsLoadState: state.auctionDetailsLoadState,
    tokenColor: state.tokenColor,
    outcome: state.progress.outcome,
    isGraduated: state.progress.isGraduated,
    currentBlockNumber: state.currentBlockNumber,
    auctionTokenAddress: state.auctionDetails?.tokenAddress,
  }))
  const { canPlaceBid, showMobileWithdrawButton, hasUserBids, showAuctionGraduated } = useBidFormState()
  // Mirror the post-auction panel so the mobile fixed button never double-renders alongside a
  // creator/migrate card or the graduated success card.
  const { hasPanelContent } = usePostAuctionPanelState()

  // Withdraw button state for mobile fixed button
  const {
    label: withdrawLabel,
    isDisabled: isWithdrawDisabled,
    disabledTooltip: withdrawDisabledTooltip,
  } = useWithdrawButtonState({
    outcome,
    claimBlock: auctionDetails?.claimBlock,
    currentBlockNumber,
    chainId: auctionDetails?.chainId,
  })
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const isCompact = useScrollCompact({ thresholdCompact: 100 })
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const handleDetailsModal = useCallback(() => setIsDetailsModalOpen(true), [])
  const handleCloseDetailsModal = useCallback(() => setIsDetailsModalOpen(false), [])
  const {
    isAuctionEnded,
    isProvenanceAuctionEnded,
    shouldShowTokenLaunchedBanner,
    isTradeAvailable,
    tradeAvailabilityBlock,
  } = useTokenLaunchedBannerState({
    auctionDetails,
    auctionState,
    currentBlockNumber,
    isGraduated,
    isTokenProvenanceEnabled,
  })

  const [chartActiveTab, setChartActiveTab] = useState<BidDistributionChartTab>(BidDistributionChartTab.ClearingPrice)
  const [showBidFormModal, setShowBidFormModal] = useState(false)
  // Fixed mobile trigger has no action once concluded with nothing to withdraw; it stays visible but disabled.
  const handleConcludedPress = useCallback(() => {}, [])

  // Once ended, the inline disabled bid frame is never shown; when there's no other content for this
  // viewer (no withdraw, no creator/migrate CTA, no graduated card) the mobile fixed button becomes a
  // disabled "Auction Concluded" trigger and nothing renders inline.
  const showConcludedTrigger = isAuctionEnded && !showMobileWithdrawButton && !hasPanelContent

  // QuickLaunch: quick launches swap the standard stats banner for the simpler stat row.
  const isQuickLaunch = useIsQuickLaunchAuction()

  const { pageTitle, metatags } = usePageMetatags(auctionDetails)

  // Sync activeBidFormTab to store so chart knows whether to render bid line
  const { setActiveBidFormTab } = useAuctionStoreActions()
  useEffect(() => {
    setActiveBidFormTab(showAuctionGraduated ? BidInfoTab.AUCTION_GRADUATED : BidInfoTab.PLACE_A_BID)
  }, [showAuctionGraduated, setActiveBidFormTab])

  // The API returned no auction for this address - show a 404 page instead of a blank auction page
  if (auctionDetailsLoadState === AuctionDetailsLoadState.NotFound) {
    return <NotFound />
  }

  return (
    <Trace
      logImpression={Boolean(auctionDetails?.token)}
      page={InterfacePageName.AuctionDetailsPage}
      properties={{
        tokenAddress: auctionTokenAddress,
        auctionAddress,
        chainName,
        tokenSymbol: auctionDetails?.token?.currency.symbol,
        tokenName: auctionDetails?.token?.currency.name,
      }}
    >
      <Helmet>
        <title>{pageTitle}</title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      <ToucanIntroModal isOpen={isModalOpen} onClose={onCloseModal} />
      <AuctionDetailsModal isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} />
      <ToucanContainer>
        {!isTokenProvenanceEnabled && <AuctionIntroBanner onLearnMorePress={handleDetailsModal} />}
        {shouldShowTokenLaunchedBanner && auctionDetails && (
          <TokenLaunchedBanner
            tokenName={auctionDetails.token?.currency.name ?? ''}
            tokenColor={tokenColor}
            tokenTotalSupply={auctionDetails.tokenTotalSupply}
            auctionTokenDecimals={getAuctionTokenDecimals(auctionDetails.token)}
            isTradeAvailableFromStatus={isTradeAvailable}
            tradeAvailabilityBlock={tradeAvailabilityBlock}
          />
        )}
      </ToucanContainer>
      <StickyCollapsibleHeader isCompact={isCompact} px="$none" $lg={{ px: '$none' }}>
        <ToucanContainer>
          <AuctionHeader isCompact={isCompact} />
        </ToucanContainer>
      </StickyCollapsibleHeader>
      <ToucanContainer
        mb="$spacing48"
        // Keep the collapsing header from moving the scroll position back across its expand threshold.
        style={isTokenProvenanceEnabled ? { overflowAnchor: 'none' } : undefined}
      >
        {isTokenProvenanceEnabled && <AuctionIntroBanner onLearnMorePress={handleDetailsModal} />}
        {isQuickLaunch ? <QuickLaunchStatsRow /> : <AuctionStatsBanner />}
        <BiddingClosedStrip />
        <TokenDetailsLayout toucan topSpacing={isProvenanceAuctionEnded ? '16' : undefined}>
          <LeftPanel clamped>
            {/* On mobile/tablet ($xl), surface the post-auction panel above the chart once the auction ends */}
            {isAuctionEnded && <PostAuctionPanel inline />}
            <AuctionChartContainer
              activeTab={chartActiveTab}
              onTabChange={setChartActiveTab}
              onLearnMorePress={handleDetailsModal}
              onShowBidFormModal={() => setShowBidFormModal(true)}
            />
            {/* On mobile/tablet ($xl), show bids below the chart */}
            {hasUserBids && (
              <Flex display="none" $xl={{ display: 'flex', flexDirection: 'column', gap: '$spacing24' }}>
                <Bids />
              </Flex>
            )}
            <AuctionStatsGrid onViewAllStats={handleDetailsModal} />
            <ActivitySection />
            <AuctionInfo />
          </LeftPanel>

          <RightPanel toucan>
            {isAuctionEnded ? (
              <PostAuctionPanel inline={false} />
            ) : (
              <Flex gap="$spacing12">
                <BidForm />
                <TradeTokenBanner />
              </Flex>
            )}
            {hasUserBids && <Bids />}
          </RightPanel>
        </TokenDetailsLayout>
      </ToucanContainer>
      {/* Fixed bottom button - $sm only - show Place Bid, Withdraw, or (once concluded) a disabled
          "Auction Concluded" trigger. The concluded bid form never renders as a full inline box on
          mobile: it collapses behind this disabled trigger unless a creator/graduated card is shown. */}
      {(canPlaceBid || showMobileWithdrawButton || showConcludedTrigger) && (
        <Flex
          display="none"
          $sm={{
            '$platform-web': {
              position: 'fixed',
            },
            flex: 1,
            display: 'flex',
            bottom: 0,
            left: 0,
            right: 0,
            p: '$spacing16',
            pb: `calc(${spacing.spacing24}px + ${MWEB_BOTTOM_INSET})`,
            zIndex: '$fixed',
          }}
        >
          {canPlaceBid ? (
            <ToucanActionButton label={t('toucan.bidForm.placeABid')} onPress={() => setShowBidFormModal(true)} />
          ) : showMobileWithdrawButton ? (
            <ToucanActionButton
              elementName={ElementName.AuctionWithdrawTokensButton}
              label={withdrawLabel}
              onPress={() => setIsWithdrawModalOpen(true)}
              isDisabled={isWithdrawDisabled}
              disabledTooltip={isWithdrawDisabled ? withdrawDisabledTooltip : undefined}
            />
          ) : (
            <ToucanActionButton
              label={t('toucan.auction.bidForm.auctionConcluded')}
              onPress={handleConcludedPress}
              isDisabled
            />
          )}
        </Flex>
      )}
      {/* BidForm modal - mobile */}
      <Modal
        name={ModalName.BidForm}
        isModalOpen={showBidFormModal}
        onClose={() => setShowBidFormModal(false)}
        maxWidth={420}
        padding="$spacing16"
      >
        <BidForm onBidSubmitted={() => setShowBidFormModal(false)} />
      </Modal>
      {/* Withdraw modal - $sm only */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </Trace>
  )
}

export function ToucanToken() {
  const { chainName, auctionAddress } = useParams<{ chainName: string; auctionAddress: string }>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const walletAddress = useActiveAddress(Platform.EVM)
  const dispatch = useAppDispatch()

  // Redux selectors for persisted state
  const rehydrated = useStateRehydrated()
  const hasSeenDisconnected = useAppSelector(selectHasSeenToucanIntroModal)
  const hasWalletSeen = useAppSelector((state: InterfaceState) =>
    walletAddress ? selectHasSeenToucanIntroModalForWallet(state, walletAddress) : false,
  )

  useEffect(() => {
    const seenThisSession = seenToucanIntroThisSession()
    if (
      shouldShowToucanIntroModal({ rehydrated, seenThisSession, walletAddress, hasSeenDisconnected, hasWalletSeen })
    ) {
      setIsModalOpen(true)
    }
  }, [rehydrated, walletAddress, hasSeenDisconnected, hasWalletSeen])

  const handleCloseModal = () => {
    setIsModalOpen(false)

    // Always set session flag
    try {
      sessionStorage.setItem(TOUCAN_INTRO_MODAL_SESSION_KEY, 'true')
    } catch {
      // sessionStorage not available, silently fail
    }

    // The wallet is still undefined for the first frames of a reconnect, when the effect above reads
    // the global flag, so dismissing always sets it. The per-wallet flag still gives a newly
    // connected wallet its own first view.
    dispatch(setHasSeenToucanIntroModal(true))
    if (walletAddress) {
      dispatch(setToucanIntroModalSeenByWallet({ walletAddress }))
    }
  }

  // Validate route params before mounting the auction store so malformed or truncated
  // addresses never reach the GetAuction API - render a 404 page instead.
  // Validate the lowercased address: the API is case-insensitive (GetAuction lowercases it),
  // so hex format is enforced without rejecting mixed-case addresses with a bad checksum.
  const chainId = getChainIdFromChainUrlParam(chainName)
  // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid -- format validation, not comparison
  const lowercasedAuctionAddress = auctionAddress?.toLowerCase()
  // isEVMAddressWithChecksum is not sufficient on its own: it wraps ethers' getAddress, which matches
  // /^(0x)?[0-9a-fA-F]{40}$/ and *prepends* a missing `0x` rather than rejecting it. A bare 40-hex
  // param would therefore pass while the un-prefixed value flowed on to GetAuction. isEVMAddress pins
  // the `0x` prefix and the 42-char length; isEVMAddressWithChecksum enforces the hex charset.
  if (
    !isEVMAddress(lowercasedAuctionAddress) ||
    !isEVMAddressWithChecksum(lowercasedAuctionAddress) ||
    !chainId ||
    !isEVMChain(chainId)
  ) {
    return <NotFound />
  }

  return (
    <AuctionStoreProvider>
      <ToucanTokenContent isModalOpen={isModalOpen} onCloseModal={handleCloseModal} />
    </AuctionStoreProvider>
  )
}

export default ToucanToken
