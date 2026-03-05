//! tamagui-ignore
// tamagui-ignore
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text, useMedia, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { AuctionAccessIndicators } from '~/components/Toucan/Auction/BidForm/AuctionAccessIndicators'
import { BidForm } from '~/components/Toucan/Auction/BidForm/BidForm'
import { AuctionGraduated } from '~/components/Toucan/Auction/Bids/AuctionGraduated'
import { Bids } from '~/components/Toucan/Auction/Bids/Bids'
import { useBidFormState } from '~/components/Toucan/Auction/hooks/useBidFormState'
import { BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { MobileScreen, MobileScreenConfig } from '~/pages/Explore/ToucanToken'

interface BidFormTabsProps {
  onBidFormInputChange?: () => void
  onMobileScreenChange: (config: MobileScreenConfig) => void
  forcedActiveTab?: BidInfoTab
}

export function BidFormTabs({
  onBidFormInputChange,
  onMobileScreenChange,
  forcedActiveTab,
}: BidFormTabsProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const { defaultTab, hasUserBids, isGraduated, isAuctionEnded, isLoading } = useBidFormState()
  const storeActiveBidFormTab = useAuctionStore((state) => state.activeBidFormTab)

  // Track whether we've completed initial setup (to avoid overriding user interactions)
  const isInitializedRef = useRef(!isLoading)
  // Track whether the user has manually interacted with tabs (to prevent auto-switching)
  const hasUserInteractedRef = useRef(false)
  // Flag to skip store-to-local sync immediately after local-to-store sync (prevents loops)
  const justSyncedToStoreRef = useRef(false)
  // Track when the initial local tab has been synced to the store
  const hasSyncedInitialTabRef = useRef(false)
  // Ref to scroll header into view on mobile when navigating via forcedActiveTab
  const headerRef = useRef<HTMLDivElement>(null)

  // Initialize activeTab to null until loading completes to avoid flash
  const [activeTab, setActiveTab] = useState<BidInfoTab | null>(() =>
    isLoading ? null : (forcedActiveTab ?? defaultTab),
  )

  // Wrapper to track user-initiated tab changes
  const handleTabChange = useCallback((tab: BidInfoTab) => {
    hasUserInteractedRef.current = true
    setActiveTab(tab)
  }, [])

  // Set initial tab once loading completes
  useEffect(() => {
    if (!isLoading && activeTab === null) {
      setActiveTab(forcedActiveTab ?? defaultTab)
      isInitializedRef.current = true
    }
  }, [isLoading, activeTab, forcedActiveTab, defaultTab])

  // Sync activeTab when forcedActiveTab changes (external navigation)
  // Only auto-sync to defaultTab if user hasn't manually navigated
  useEffect(() => {
    // Skip if not yet initialized (initial tab effect handles this)
    if (!isInitializedRef.current) {
      return
    }
    if (forcedActiveTab) {
      // Always respect forced tab (external control)
      setActiveTab(forcedActiveTab)
      hasUserInteractedRef.current = false
    } else if (!hasUserInteractedRef.current) {
      // Only auto-sync to defaultTab if user hasn't manually interacted
      setActiveTab(defaultTab)
    }
  }, [defaultTab, forcedActiveTab])

  // Scroll header into view on mobile when forcedActiveTab is set (external navigation)
  useEffect(() => {
    if (forcedActiveTab && media.lg && headerRef.current) {
      const elementTop = headerRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: elementTop - INTERFACE_NAV_HEIGHT, behavior: 'smooth' })
    }
  }, [forcedActiveTab, media.lg])

  // Sync active tab to store so other components (e.g., chart) can react to tab changes
  const { setActiveBidFormTab } = useAuctionStoreActions()
  useEffect(() => {
    if (activeTab !== null) {
      justSyncedToStoreRef.current = true
      setActiveBidFormTab(activeTab)
      if (!hasSyncedInitialTabRef.current) {
        hasSyncedInitialTabRef.current = true
      }
    }
  }, [activeTab, setActiveBidFormTab])

  // Sync from store when external update detected (e.g., after bid submission)
  useEffect(() => {
    if (!hasSyncedInitialTabRef.current || activeTab === null) {
      return
    }
    // Skip if we just synced TO the store (local origin) to prevent loops
    if (justSyncedToStoreRef.current) {
      justSyncedToStoreRef.current = false
      return
    }
    // Sync from store if it differs from local state
    if (storeActiveBidFormTab !== activeTab) {
      setActiveTab(storeActiveBidFormTab)
      hasUserInteractedRef.current = false
    }
  }, [storeActiveBidFormTab, activeTab])

  // Show loading state while user bids are being fetched
  if (isLoading || activeTab === null) {
    return (
      <Flex centered flex={1} py="$spacing48">
        <SpinningLoader size={iconSizes.icon24} color="$neutral2" />
      </Flex>
    )
  }

  return (
    <Flex $lg={{ px: '$spacing16' }} $sm={{ px: 0 }}>
      <Flex ref={headerRef} row justifyContent="space-between" alignItems="center" mb="$spacing20">
        {/* No user bids + $sm only: Show "Place a Bid" header without back button */}
        {!hasUserBids && !media.lg && (
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.bidForm.placeABid')}
          </Text>
        )}

        {/* User has bids + MY_BIDS tab: Back goes to AUCTION_GRADUATED (if graduated) or CHART ($lg only) */}
        {hasUserBids &&
          activeTab === BidInfoTab.MY_BIDS &&
          (isAuctionEnded && isGraduated ? (
            // Graduated auction: back arrow goes to AUCTION_GRADUATED
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              cursor="pointer"
              onPress={() => handleTabChange(BidInfoTab.AUCTION_GRADUATED)}
            >
              <Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon20} />
              <Text variant="subheading1" color="$neutral1">
                {t('toucan.auction.myBids')}
              </Text>
            </Flex>
          ) : media.lg ? (
            // $lg + auction in progress or failed: back arrow goes to CHART
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              cursor="pointer"
              onPress={() => onMobileScreenChange({ screen: MobileScreen.CHART })}
            >
              <Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon20} />
              <Text variant="subheading1" color="$neutral1">
                {t('toucan.auction.myBids')}
              </Text>
            </Flex>
          ) : (
            // $sm + auction in progress or failed: no back button
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.auction.myBids')}
            </Text>
          ))}

        {/* User has bids + PLACE_A_BID tab: Back goes to MY_BIDS ($sm) or CHART ($lg) */}
        {hasUserBids && activeTab === BidInfoTab.PLACE_A_BID && (
          <Flex
            row
            alignItems="center"
            gap="$spacing8"
            cursor="pointer"
            onPress={() =>
              media.lg ? onMobileScreenChange({ screen: MobileScreen.CHART }) : handleTabChange(BidInfoTab.MY_BIDS)
            }
          >
            <Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon20} />
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.bidForm.placeABid')}
            </Text>
          </Flex>
        )}

        {/* User has bids + AUCTION_GRADUATED tab: Show "My Bids" - back to CHART ($lg) or no back ($sm) */}
        {hasUserBids &&
          activeTab === BidInfoTab.AUCTION_GRADUATED &&
          (media.lg ? (
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              cursor="pointer"
              onPress={() => onMobileScreenChange({ screen: MobileScreen.CHART })}
            >
              <Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon20} />
              <Text variant="subheading1" color="$neutral1">
                {t('toucan.auction.myBids')}
              </Text>
            </Flex>
          ) : (
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.auction.myBids')}
            </Text>
          ))}
        {activeTab === BidInfoTab.PLACE_A_BID && <AuctionAccessIndicators />}
      </Flex>
      {activeTab === BidInfoTab.PLACE_A_BID ? (
        <BidForm onInputChange={onBidFormInputChange} />
      ) : activeTab === BidInfoTab.AUCTION_GRADUATED ? (
        <AuctionGraduated onSetActiveTab={handleTabChange} />
      ) : (
        <Bids showBidForm={() => handleTabChange(BidInfoTab.PLACE_A_BID)} />
      )}
    </Flex>
  )
}
