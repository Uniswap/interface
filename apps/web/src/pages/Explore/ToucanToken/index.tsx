//! tamagui-ignore
// tamagui-ignore
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import {
  selectHasSeenToucanIntroModal,
  selectHasSeenToucanIntroModalForWallet,
} from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasSeenToucanIntroModal, setToucanIntroModalSeenByWallet } from 'uniswap/src/features/behaviorHistory/slice'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants/trace/page'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import { ActivitySection } from '~/features/Toucan/Auction/ActivityTimeline/ActivitySection'
import { AuctionDetailsModal } from '~/features/Toucan/Auction/ActivityTimeline/AuctionDetailsModal'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'
import { AuctionHeader } from '~/features/Toucan/Auction/AuctionHeader'
import { AuctionInfo, AuctionStatsGrid } from '~/features/Toucan/Auction/AuctionStats/AuctionStats'
import { AuctionIntroBanner } from '~/features/Toucan/Auction/Banners/AuctionIntro/AuctionIntroBanner'
import { AuctionStatsBanner } from '~/features/Toucan/Auction/Banners/AuctionStatsBanner/AuctionStatsBanner'
import { TokenLaunchedBanner } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBanner'
import { AuctionChartContainer } from '~/features/Toucan/Auction/BidDistributionChart/AuctionChartContainer'
import { BidForm } from '~/features/Toucan/Auction/BidForm/BidForm'
import { AuctionGraduated } from '~/features/Toucan/Auction/Bids/AuctionGraduated'
import { Bids } from '~/features/Toucan/Auction/Bids/Bids'
import { WithdrawModal } from '~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { AuctionStoreProvider } from '~/features/Toucan/Auction/store/AuctionStoreContextProvider'
import { AuctionProgressState, BidInfoTab } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'
import { ToucanContainer } from '~/features/Toucan/Shared/ToucanContainer'
import { ToucanIntroModal } from '~/features/Toucan/ToucanIntroModal'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { LeftPanel, RightPanel, TokenDetailsLayout } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { InterfaceState } from '~/state/webReducer'

const TOUCAN_INTRO_MODAL_SESSION_KEY = 'toucan-intro-modal-seen-session'

function ToucanTokenContent({ isModalOpen, onCloseModal }: { isModalOpen: boolean; onCloseModal: () => void }) {
  const { t } = useTranslation()
  const { chainName, auctionAddress } = useParams<{ chainName: string; auctionAddress: string }>()
  const { auctionState, auctionDetails, tokenColor, isGraduated, currentBlockNumber } = useAuctionStore((state) => ({
    auctionState: state.progress.state,
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
    isGraduated: state.progress.isGraduated,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const { canPlaceBid, showMobileWithdrawButton, hasUserBids } = useBidFormState()

  // Withdraw button state for mobile fixed button
  const {
    label: withdrawLabel,
    isDisabled: isWithdrawDisabled,
    disabledTooltip: withdrawDisabledTooltip,
  } = useWithdrawButtonState({
    isGraduated,
    claimBlock: auctionDetails?.claimBlock,
    currentBlockNumber,
    chainId: auctionDetails?.chainId,
  })
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const isCompact = useScrollCompact({ thresholdCompact: 100 })
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const handleDetailsModal = useCallback(() => setIsDetailsModalOpen(true), [])
  const handleCloseDetailsModal = useCallback(() => setIsDetailsModalOpen(false), [])
  const isAuctionEnded = auctionState === AuctionProgressState.ENDED
  const showAuctionGraduated = isAuctionEnded && isGraduated && hasUserBids
  const shouldShowTokenLaunchedBanner = isAuctionEnded && auctionDetails !== null

  const [chartActiveTab, setChartActiveTab] = useState<BidDistributionChartTab>(BidDistributionChartTab.ClearingPrice)
  const [showBidFormModal, setShowBidFormModal] = useState(false)

  // Sync activeBidFormTab to store so chart knows whether to render bid line
  const { setActiveBidFormTab } = useAuctionStoreActions()
  useEffect(() => {
    setActiveBidFormTab(showAuctionGraduated ? BidInfoTab.AUCTION_GRADUATED : BidInfoTab.PLACE_A_BID)
  }, [showAuctionGraduated, setActiveBidFormTab])

  return (
    <Trace
      logImpression={Boolean(auctionDetails?.token)}
      page={InterfacePageName.AuctionDetailsPage}
      properties={{
        tokenAddress: auctionAddress,
        chainName,
        tokenSymbol: auctionDetails?.token?.currency.symbol,
        tokenName: auctionDetails?.token?.currency.name,
      }}
    >
      <ToucanIntroModal isOpen={isModalOpen} onClose={onCloseModal} />
      <AuctionDetailsModal isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} />
      <ToucanContainer>
        <AuctionIntroBanner onLearnMorePress={handleDetailsModal} />
        {shouldShowTokenLaunchedBanner && (
          <TokenLaunchedBanner
            tokenName={auctionDetails.token?.currency.name ?? ''}
            tokenColor={tokenColor}
            totalSupply={auctionDetails.tokenTotalSupply}
            auctionTokenDecimals={auctionDetails.token?.currency.decimals}
          />
        )}
      </ToucanContainer>
      <StickyCollapsibleHeader isCompact={isCompact} px="$none" $lg={{ px: '$none' }}>
        <ToucanContainer>
          <AuctionHeader isCompact={isCompact} />
        </ToucanContainer>
      </StickyCollapsibleHeader>
      <ToucanContainer mb="$spacing48">
        <AuctionStatsBanner />
        <TokenDetailsLayout justifyContent="flex-start" px="$none" $lg={{ px: '$none' }} gap={46}>
          <LeftPanel
            maxWidth={744}
            gap="$spacing40"
            display="flex"
            $lg={{
              gap: '$gap32',
              maxWidth: '100%',
            }}
          >
            <AuctionChartContainer
              activeTab={chartActiveTab}
              onTabChange={setChartActiveTab}
              onLearnMorePress={handleDetailsModal}
              onShowBidFormModal={() => setShowBidFormModal(true)}
            />
            {/* On mobile/tablet ($xl), show graduated state and bids below the chart */}
            {(showAuctionGraduated || hasUserBids) && (
              <Flex display="none" $xl={{ display: 'flex', flexDirection: 'column', gap: '$spacing24' }}>
                {showAuctionGraduated && <AuctionGraduated />}
                <Bids />
              </Flex>
            )}
            <AuctionStatsGrid onViewAllStats={handleDetailsModal} />
            <ActivitySection />
            <AuctionInfo />
          </LeftPanel>

          <RightPanel
            width={390}
            display="flex"
            gap="$spacing24"
            alignSelf="flex-start"
            $xl={{
              display: 'none',
            }}
          >
            {showAuctionGraduated ? <AuctionGraduated /> : <BidForm />}
            {hasUserBids && <Bids />}
          </RightPanel>
        </TokenDetailsLayout>
      </ToucanContainer>
      {/* Fixed bottom button - $sm only - show Place Bid OR Withdraw */}
      {(canPlaceBid || showMobileWithdrawButton) && (
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
            pb: '$spacing24',
            zIndex: '$fixed',
          }}
        >
          {canPlaceBid ? (
            <ToucanActionButton label={t('toucan.bidForm.placeABid')} onPress={() => setShowBidFormModal(true)} />
          ) : (
            <ToucanActionButton
              elementName={ElementName.AuctionWithdrawTokensButton}
              label={withdrawLabel}
              onPress={() => setIsWithdrawModalOpen(true)}
              isDisabled={isWithdrawDisabled}
              disabledTooltip={isWithdrawDisabled ? withdrawDisabledTooltip : undefined}
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const walletAddress = useActiveAddress(Platform.EVM)
  const dispatch = useAppDispatch()

  // Redux selectors for persisted state
  const hasSeenDisconnected = useAppSelector(selectHasSeenToucanIntroModal)
  const hasWalletSeen = useAppSelector((state: InterfaceState) =>
    walletAddress ? selectHasSeenToucanIntroModalForWallet(state, walletAddress) : false,
  )

  // Three-layer check for showing intro modal
  useEffect(() => {
    // Layer 1: Session check - blocks everything in same session
    try {
      const seenThisSession = sessionStorage.getItem(TOUCAN_INTRO_MODAL_SESSION_KEY)
      if (seenThisSession) {
        return
      }
    } catch {
      // sessionStorage not available, continue with other checks
    }

    // Layer 2 & 3: Persisted checks
    if (walletAddress) {
      // Connected: check per-wallet flag
      if (hasWalletSeen) {
        return
      }
    } else {
      // Disconnected: check global flag
      if (hasSeenDisconnected) {
        return
      }
    }

    setIsModalOpen(true)
  }, [walletAddress, hasSeenDisconnected, hasWalletSeen])

  const handleCloseModal = () => {
    setIsModalOpen(false)

    // Always set session flag
    try {
      sessionStorage.setItem(TOUCAN_INTRO_MODAL_SESSION_KEY, 'true')
    } catch {
      // sessionStorage not available, silently fail
    }

    // Set appropriate persisted flag
    if (walletAddress) {
      dispatch(setToucanIntroModalSeenByWallet({ walletAddress }))
    } else {
      dispatch(setHasSeenToucanIntroModal(true))
    }
  }

  return (
    <AuctionStoreProvider>
      <ToucanTokenContent isModalOpen={isModalOpen} onCloseModal={handleCloseModal} />
    </AuctionStoreProvider>
  )
}

export default ToucanToken
