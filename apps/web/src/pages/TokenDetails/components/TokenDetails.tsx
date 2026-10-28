import { FeatureFlags, useFeatureFlag, useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, useIsTouchDevice } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLogRWATokenDetailsViewed } from 'uniswap/src/features/rwa/useLogRWATokenDetailsViewed'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { MobileBottomBar, TDPActionTabs } from '~/components/NavBar/MobileBottomBar'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import { shouldShowAuctionOnlyLayout } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { ActivitySection } from '~/pages/TokenDetails/components/activity/ActivitySection'
import { TokenDetailsAuctionBanner } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionBanner'
import { TokenDetailsAuctionCard } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionCard'
import { TokenDetailsAuctionErrorBoundary } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionErrorBoundary'
import {
  TokenDetailsOtherAuctionsFallback,
  TokenDetailsOtherAuctionsRow,
} from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListEntry'
import { TokenDetailsAuctionSkeleton } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionSkeleton'
import { BalanceSummary } from '~/pages/TokenDetails/components/balances/BalanceSummary'
import { ChartSection } from '~/pages/TokenDetails/components/chart/ChartSection'
import { TokenDetailsClaimCard } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimCard'
import { TokenDetailsClaimProvider } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimProvider'
import { TokenDetailsEarnBanner } from '~/pages/TokenDetails/components/earn/TokenDetailsEarnBanner'
import { TokenDetailsEarnSection } from '~/pages/TokenDetails/components/earn/TokenDetailsEarnSection'
import { TokenDetailsVaultShareBanner } from '~/pages/TokenDetails/components/earn/TokenDetailsVaultShareBanner'
import { useTokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'
import { useTokenDetailsVaultShareData } from '~/pages/TokenDetails/components/earn/useTokenDetailsVaultShareData'
import { TDPBreadcrumb } from '~/pages/TokenDetails/components/header/TDPBreadcrumb'
import { TokenDetailsHeader } from '~/pages/TokenDetails/components/header/TokenDetailsHeader'
import { BridgedAssetSection } from '~/pages/TokenDetails/components/info/BridgedAssetSection'
import { StatsSection } from '~/pages/TokenDetails/components/info/StatsSection'
import { TokenDescription } from '~/pages/TokenDetails/components/info/TokenDescription'
import { TokenProvenance } from '~/pages/TokenDetails/components/info/TokenProvenance'
import { TokenPerformance } from '~/pages/TokenDetails/components/performance/TokenPerformance'
import { RelatedTokensSection } from '~/pages/TokenDetails/components/relatedTokens/RelatedTokensSection'
import { MoreWaysToTrade } from '~/pages/TokenDetails/components/rwa/MoreWaysToTrade'
import { OffHoursLiquidityBanner } from '~/pages/TokenDetails/components/rwa/OffHoursLiquidityBanner'
import { RelatedTokens } from '~/pages/TokenDetails/components/rwa/RelatedTokens'
import { LeftPanel, RightPanel, TokenDetailsLayout } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { TDPSwapComponent } from '~/pages/TokenDetails/components/swap/TDPSwapComponent'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'
import { useTDPTokenWarningDisplay } from '~/pages/TokenDetails/hooks/useTDPTokenWarningDisplay'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { shouldReserveAuctionBannerSpace } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'

/**
 * Balance and bridged-asset blocks where they stack under the chart. Returning null rather than an
 * empty wrapper matters: the left column is a gapped flex, so a childless wrapper still opens a gap.
 */
function StackedTokenInfo({
  showBalance,
  currencyInfo,
  isBridgedAsset,
}: {
  showBalance: boolean
  currencyInfo: Maybe<CurrencyInfo>
  isBridgedAsset: boolean
}): JSX.Element | null {
  if (!showBalance && !isBridgedAsset) {
    return null
  }
  return (
    <Flex gap="$gap24">
      {showBalance && <BalanceSummary />}
      <BridgedAssetSection currencyInfo={currencyInfo} isBridgedAsset={isBridgedAsset} />
    </Flex>
  )
}

/** If provenance crashes, the section falls back to plain About instead of an empty Info heading. */
function TokenDescriptionWithoutLaunchInfo(): JSX.Element {
  return <TokenDescription />
}

/** Stats and the left-panel sections under it. With provenance on, launch info joins About as one Info module right under Stats; off, About keeps its old slot. */
function TokenDetailsLowerSections(): JSX.Element {
  const auctionDisplay = useTokenDetailsAuctionDisplay()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const isTokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const { categories, isLoading: isCategoriesLoading } = useTDPTokenCategories()

  // The boundary is always there with the flag on, so late provenance doesn't remount the section.
  const tokenDescription = isTokenProvenanceEnabled ? (
    <TokenDetailsAuctionErrorBoundary fallback={TokenDescriptionWithoutLaunchInfo}>
      <TokenDescription launchInfo={auctionDisplay.provenance && <TokenProvenance />} />
    </TokenDetailsAuctionErrorBoundary>
  ) : (
    <TokenDescription />
  )

  return (
    <>
      <StatsSection />
      {tokenCategoriesEnabled ? (
        <>
          {isTokenProvenanceEnabled && tokenDescription}
          <MoreWaysToTrade />
          {!isTokenProvenanceEnabled && tokenDescription}
          <RelatedTokensSection categories={categories} isLoading={isCategoriesLoading} />
          <ActivitySection />
        </>
      ) : (
        <>
          {tokenDescription}
          <ActivitySection />
          <MoreWaysToTrade />
          <RelatedTokens />
        </>
      )}
    </>
  )
}

export function TokenDetailsContent({ isCompact }: { isCompact: boolean }) {
  const media = useMedia()

  const { currencyChainId, multiChainMap, address, currency } = useTDPStore((s) => ({
    currencyChainId: s.currencyChainId,
    multiChainMap: s.multiChainMap,
    address: s.address,
    currency: s.currency!,
  }))
  // Filtered to the user's enabled chains (shared with the stats/header predicates) so the
  // analytics `multichain` flag matches what the UI actually presents as multichain.
  const isMultichainAsset = useMultichainTokenEntries(multiChainMap).length > 1
  const pageChainBalance = multiChainMap[currencyChainId]?.balance

  const currencyInfo = useCurrencyInfo(
    currency.isNative ? undefined : buildCurrencyId(currencyChainId, currency.address),
  )
  const isBridgedAsset = Boolean(currencyInfo?.isBridged)
  const showTokenInfo = !!pageChainBalance || isBridgedAsset
  const isDesktop = !media.xl
  const showBalanceInfo = isDesktop && showTokenInfo

  const { isTestnetModeEnabled } = useEnabledChains()
  const showEarn = !isTestnetModeEnabled

  const earnData = useTokenDetailsEarnData({ enabled: showEarn })
  const vaultShareData = useTokenDetailsVaultShareData({ enabled: showEarn })
  const showRightTokenInfo = isDesktop && (showTokenInfo || earnData.userHasEarnPosition)
  // An Earn position must stay manageable at every width — the right rail stacks below the chart
  // at non-desktop widths, so the section container can't be desktop-only when a position exists.
  const showRightPanelSections = showRightTokenInfo || (showEarn && earnData.userHasEarnPosition)
  const auctionDisplay = useTokenDetailsAuctionDisplay()
  const showAuctionCard = shouldShowAuctionOnlyLayout(auctionDisplay)
  const hideSwap = showAuctionCard || auctionDisplay.isInitialLoading
  const showAuctionBanner = shouldReserveAuctionBannerSpace(auctionDisplay)

  const rwaMatch = useTDPRWAMatch()
  useLogRWATokenDetailsViewed({
    rwaMatch,
    tokenAddress: address,
    tokenSymbol: currency.symbol,
    chainId: currency.chainId,
  })

  const { warningCard, warningModal } = useTDPTokenWarningDisplay({ currency, currencyInfo })
  const auctionPanel = (
    <TokenDetailsAuctionErrorBoundary>
      {auctionDisplay.isInitialLoading ? (
        <TokenDetailsAuctionSkeleton />
      ) : (
        <Flex gap="$spacing16">
          <TokenDetailsAuctionCard />
          <TokenDetailsOtherAuctionsRow />
        </Flex>
      )}
    </TokenDetailsAuctionErrorBoundary>
  )
  const otherAuctionsEntry = (
    <TokenDetailsOtherAuctionsFallback hideSwap={hideSwap} showAuctionBanner={showAuctionBanner} />
  )

  return (
    <Trace
      logImpression
      page={InterfacePageName.TokenDetailsPage}
      properties={{
        tokenAddress: address,
        tokenSymbol: currency.symbol,
        tokenName: currency.name,
        chainId: currency.chainId,
        multichain: isMultichainAsset,
      }}
    >
      <TDPBreadcrumb />
      <StickyCollapsibleHeader isCompact={isCompact} px="$none" $xxl={{ px: '$spacing40' }}>
        <TokenDetailsHeader isCompact={isCompact} />
      </StickyCollapsibleHeader>
      {showEarn && <TokenDetailsVaultShareBanner vaultShareData={vaultShareData} />}
      <TokenDetailsAuctionErrorBoundary>
        <TokenDetailsAuctionBanner />
      </TokenDetailsAuctionErrorBoundary>
      <TokenDetailsClaimProvider>
        <TokenDetailsLayout topSpacing={showAuctionBanner ? '24' : undefined}>
          <LeftPanel>
            <ChartSection />
            {/* Preserve the warning when Swap is hidden or replaced by the auction card. */}
            {(!isDesktop || hideSwap) && warningCard}
            {warningModal}
            {!isDesktop && (
              <TokenDetailsAuctionErrorBoundary>
                <TokenDetailsClaimCard />
              </TokenDetailsAuctionErrorBoundary>
            )}
            {hideSwap && !isDesktop && auctionPanel}
            {!isDesktop && otherAuctionsEntry}
            <OffHoursLiquidityBanner />
            {showEarn && <TokenDetailsEarnBanner earnData={earnData} />}

            {!showBalanceInfo && (
              <StackedTokenInfo
                showBalance={!!pageChainBalance}
                currencyInfo={currencyInfo}
                isBridgedAsset={isBridgedAsset}
              />
            )}

            <TokenDetailsLowerSections />
          </LeftPanel>
          <RightPanel>
            {isDesktop && (
              <TokenDetailsAuctionErrorBoundary>
                <TokenDetailsClaimCard />
              </TokenDetailsAuctionErrorBoundary>
            )}
            {isDesktop && otherAuctionsEntry}
            {/* Confirmed Custom + NoPool replaces Swap; smaller widths place the card below the chart. */}
            <TokenDetailsSwapSection
              hideSwap={hideSwap}
              isDesktop={isDesktop}
              auctionPanel={auctionPanel}
              warningCard={warningCard}
            />

            {/* Token info sections only show when the user has balance, a bridged asset, or an earn deposit.
                Balance/bridged info stays desktop-only (the left panel renders it at smaller widths);
                the Earn section renders at any width when the user has a position. */}
            <Flex display={showRightPanelSections ? 'flex' : 'none'} gap="$gap24" mt="$gap24">
              {showBalanceInfo && <BalanceSummary />}
              {showEarn && <TokenDetailsEarnSection earnData={earnData} />}
              {showBalanceInfo && <BridgedAssetSection currencyInfo={currencyInfo} isBridgedAsset={isBridgedAsset} />}
            </Flex>

            <TokenPerformance />
          </RightPanel>

          <TokenDetailsMobileActions hideSwap={hideSwap} />
        </TokenDetailsLayout>
      </TokenDetailsClaimProvider>
    </Trace>
  )
}

function TokenDetailsSwapSection({
  hideSwap,
  isDesktop,
  auctionPanel,
  warningCard,
}: {
  hideSwap: boolean
  isDesktop: boolean
  auctionPanel: JSX.Element
  warningCard: ReactNode
}): JSX.Element | null {
  if (hideSwap) {
    return isDesktop ? auctionPanel : null
  }
  return (
    <Flex display={isDesktop ? 'flex' : 'none'} testID={TestID.TokenDetailsSwap}>
      <TDPSwapComponent warningCard={isDesktop ? warningCard : undefined} />
    </Flex>
  )
}

function TokenDetailsMobileActions({ hideSwap }: { hideSwap: boolean }): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  const { direction: scrollDirection } = useScroll()

  if (hideSwap) {
    return null
  }

  return (
    <MobileBottomBar hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
      <Flex testID={TestID.TokenDetailsMobileBottomBar}>
        <TDPActionTabs />
      </Flex>
    </MobileBottomBar>
  )
}
