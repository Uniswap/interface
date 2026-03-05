//! tamagui-ignore
// tamagui-ignore
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Flex, useMedia } from 'ui/src'
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
import { BidDistributionChartTab } from '~/components/Toucan/Auction/AuctionChartShared'
import { AuctionHeader } from '~/components/Toucan/Auction/AuctionHeader'
import { AuctionStats } from '~/components/Toucan/Auction/AuctionStats/AuctionStats'
import { AuctionIntroBanner } from '~/components/Toucan/Auction/Banners/AuctionIntro/AuctionIntroBanner'
import { AuctionStatsBanner } from '~/components/Toucan/Auction/Banners/AuctionStatsBanner/AuctionStatsBanner'
import { TokenLaunchedBanner } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBanner'
import { BidActivities } from '~/components/Toucan/Auction/BidActivities/BidActivities'
import { AuctionChartContainer } from '~/components/Toucan/Auction/BidDistributionChart/AuctionChartContainer'
import { BidForm } from '~/components/Toucan/Auction/BidForm/BidForm'
import { BidFormTabs } from '~/components/Toucan/Auction/Bids/BidFormTabs'
import { WithdrawModal } from '~/components/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useBidFormState } from '~/components/Toucan/Auction/hooks/useBidFormState'
import { useWithdrawButtonState } from '~/components/Toucan/Auction/hooks/useWithdrawButtonState'
import { AuctionStoreProvider } from '~/components/Toucan/Auction/store/AuctionStoreContextProvider'
import { AuctionProgressState, BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'
import { ToucanContainer } from '~/components/Toucan/Shared/ToucanContainer'
import { ToucanIntroModal } from '~/components/Toucan/ToucanIntroModal'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { InterfaceState } from '~/state/webReducer'

const TOUCAN_INTRO_MODAL_SESSION_KEY = 'toucan-intro-modal-seen-session'

export enum MobileScreen {
  CHART = 'chart',
  BID_FORM = 'bidForm',
}

export interface MobileScreenConfig {
  screen: MobileScreen
  bidFormTab?: BidInfoTab
  showBidFormModal?: boolean
}

function ToucanTokenContent({
  isModalOpen,
  onOpenModal,
  onCloseModal,
}: {
  isModalOpen: boolean
  onOpenModal: () => void
  onCloseModal: () => void
}) {
  const { t } = useTranslation()
  const { chainName, auctionAddress } = useParams<{ chainName: string; auctionAddress: string }>()
  const { auctionState, auctionDetails, tokenColor, isGraduated, currentBlockNumber } = useAuctionStore((state) => ({
    auctionState: state.progress.state,
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
    isGraduated: state.progress.isGraduated,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const media = useMedia()
  const { canPlaceBid, showAuctionGraduated, showMobileWithdrawButton } = useBidFormState()

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
  const isAuctionEnded = auctionState === AuctionProgressState.ENDED
  const shouldShowTokenLaunchedBanner = isAuctionEnded && auctionDetails !== null

  const [chartActiveTab, setChartActiveTab] = useState<BidDistributionChartTab>(BidDistributionChartTab.ClearingPrice)
  const [mobileScreenConfig, setMobileScreenConfig] = useState<MobileScreenConfig>({ screen: MobileScreen.CHART })

  // This is tab that will be auto-switched to when user is setting their bid
  const AUTO_SWITCH_TARGET_TAB = BidDistributionChartTab.Distribution

  const handleBidFormInputChange = useCallback(() => {
    const isAuctionInProgress = auctionState === AuctionProgressState.IN_PROGRESS
    if (isAuctionInProgress && chartActiveTab === BidDistributionChartTab.ClearingPrice) {
      setChartActiveTab(AUTO_SWITCH_TARGET_TAB)
    }
  }, [auctionState, chartActiveTab, AUTO_SWITCH_TARGET_TAB])

  // Default mobile screen to AuctionGraduated view when auction has graduated and user has bids
  useEffect(() => {
    if (showAuctionGraduated && media.lg) {
      setMobileScreenConfig({
        screen: MobileScreen.BID_FORM,
        bidFormTab: BidInfoTab.AUCTION_GRADUATED,
      })
    }
  }, [showAuctionGraduated, media.lg])

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
      <AuctionIntroBanner onLearnMorePress={onOpenModal} />
      <ToucanContainer mb="$spacing48">
        {shouldShowTokenLaunchedBanner && (
          <TokenLaunchedBanner
            tokenName={auctionDetails.token?.currency.name ?? ''}
            tokenColor={tokenColor}
            totalSupply={auctionDetails.tokenTotalSupply}
            auctionTokenDecimals={auctionDetails.token?.currency.decimals}
          />
        )}
        <AuctionHeader />
        <AuctionStatsBanner />
        <Flex
          row
          width="100%"
          mt="$spacing24"
          gap="$spacing32"
          borderWidth="$spacing1"
          borderRadius="$rounded20"
          borderColor="$surface3"
          padding="$spacing24"
          height="auto"
          $xxl={{
            px: '$spacing32',
          }}
          $xl={{
            px: '$spacing2',
            gap: '$spacing16',
          }}
          $sm={{
            padding: '$spacing12',
          }}
        >
          <Flex
            maxWidth={780}
            width="62%"
            gap="$spacing2"
            display="flex"
            $xl={{
              pl: '$spacing16',
              width: '56%',
            }}
            $lg={{
              px: '$spacing16',
              maxWidth: '100%',
              width: '100%',
              display: mobileScreenConfig.screen === MobileScreen.CHART ? 'flex' : 'none',
            }}
            $sm={{
              p: '$spacing4',
            }}
          >
            <AuctionChartContainer
              activeTab={chartActiveTab}
              onTabChange={setChartActiveTab}
              onMobileScreenChange={setMobileScreenConfig}
            />
          </Flex>
          <Flex
            maxWidth={400}
            width="36%"
            display="flex"
            $xl={{
              width: '40%',
            }}
            $lg={{
              display: mobileScreenConfig.screen === MobileScreen.BID_FORM ? 'flex' : 'none',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <BidFormTabs
              key={mobileScreenConfig.bidFormTab}
              onBidFormInputChange={handleBidFormInputChange}
              onMobileScreenChange={setMobileScreenConfig}
              forcedActiveTab={mobileScreenConfig.bidFormTab}
            />
          </Flex>
        </Flex>
        <Flex
          row
          width="100%"
          gap="$spacing48"
          my="$spacing48"
          mx="$spacing4"
          $xl={{ gap: '$spacing32' }}
          $lg={{ flexDirection: 'column', gap: '$spacing32', mx: 0 }}
        >
          <BidActivities />
          <AuctionStats />
        </Flex>
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
            <ToucanActionButton
              label={t('toucan.bidForm.placeABid')}
              onPress={() => setMobileScreenConfig((prev) => ({ ...prev, showBidFormModal: true }))}
            />
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
      {/* BidForm modal - $sm only */}
      <Modal
        name={ModalName.BidForm}
        isModalOpen={mobileScreenConfig.showBidFormModal ?? false}
        onClose={() => setMobileScreenConfig((prev) => ({ ...prev, showBidFormModal: false }))}
        maxWidth={420}
        padding="$spacing16"
      >
        <BidForm onInputChange={handleBidFormInputChange} setMobileScreenConfig={setMobileScreenConfig} />
      </Modal>
      {/* Withdraw modal - $sm only */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </Trace>
  )
}

export default function ToucanToken() {
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

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

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
      <ToucanTokenContent isModalOpen={isModalOpen} onOpenModal={handleOpenModal} onCloseModal={handleCloseModal} />
    </AuctionStoreProvider>
  )
}
