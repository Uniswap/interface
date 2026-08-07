import { Flex, useIsTouchDevice, useMedia } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useLogRWATokenDetailsViewed } from 'uniswap/src/features/rwa/useLogRWATokenDetailsViewed'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { MobileBottomBar, TDPActionTabs } from '~/components/NavBar/MobileBottomBar'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { ActivitySection } from '~/pages/TokenDetails/components/activity/ActivitySection'
import { BalanceSummary } from '~/pages/TokenDetails/components/balances/BalanceSummary'
import { ChartSection } from '~/pages/TokenDetails/components/chart/ChartSection'
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
import { TokenPerformance } from '~/pages/TokenDetails/components/performance/TokenPerformance'
import { MoreWaysToTrade } from '~/pages/TokenDetails/components/rwa/MoreWaysToTrade'
import { OffHoursLiquidityBanner } from '~/pages/TokenDetails/components/rwa/OffHoursLiquidityBanner'
import { RelatedTokens } from '~/pages/TokenDetails/components/rwa/RelatedTokens'
import { LeftPanel, RightPanel, TokenDetailsLayout } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { TDPSwapComponent } from '~/pages/TokenDetails/components/swap/TDPSwapComponent'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'

export function TokenDetailsContent({ isCompact }: { isCompact: boolean }) {
  const media = useMedia()
  const isTouchDevice = useIsTouchDevice()

  const { tokenQuery, currencyChain, multiChainMap, marketDataLoading, address, currency } = useTDPStore((s) => ({
    tokenQuery: s.tokenQuery,
    currencyChain: s.currencyChain,
    multiChainMap: s.multiChainMap,
    marketDataLoading: s.marketDataLoading,
    address: s.address,
    currency: s.currency!,
  }))
  const tokenQueryData = tokenQuery.data?.token
  // Filtered to the user's enabled chains (shared with the stats/header predicates) so the
  // analytics `multichain` flag matches what the UI actually presents as multichain.
  const isMultichainAsset = useMultichainTokenEntries(multiChainMap).length > 1
  const pageChainBalance = multiChainMap[currencyChain]?.balance

  const { direction: scrollDirection } = useScroll()

  const chainId = fromGraphQLChain(currencyChain) ?? UniverseChainId.Mainnet
  const currencyInfo = useCurrencyInfo(currency.isNative ? undefined : buildCurrencyId(chainId, currency.address))
  const isBridgedAsset = Boolean(currencyInfo?.isBridged)
  const showTokenInfo = !!pageChainBalance || isBridgedAsset
  const isDesktop = !media.xl
  const showBalanceInfo = isDesktop && showTokenInfo

  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const showEarn = isEarnEnabled && !isTestnetModeEnabled

  const earnData = useTokenDetailsEarnData({ enabled: showEarn })
  const vaultShareData = useTokenDetailsVaultShareData({ enabled: showEarn })
  const showRightTokenInfo = isDesktop && (showTokenInfo || earnData.userHasEarnPosition)
  // An Earn position must stay manageable at every width — the right rail stacks below the chart
  // at non-desktop widths, so the section container can't be desktop-only when a position exists.
  const showRightPanelSections = showRightTokenInfo || (showEarn && earnData.userHasEarnPosition)

  const rwaMatch = useRWATokenDetailsMatch()
  useLogRWATokenDetailsViewed({
    rwaMatch,
    tokenAddress: address,
    tokenSymbol: currency.symbol,
    chainId: currency.chainId,
  })

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
      <TokenDetailsLayout>
        <LeftPanel gap="$spacing40" $lg={{ gap: '$gap32' }}>
          <ChartSection />
          <OffHoursLiquidityBanner />
          {showEarn && <TokenDetailsEarnBanner earnData={earnData} />}

          {!showBalanceInfo && (
            <Flex gap="$gap24">
              {!!pageChainBalance && <BalanceSummary />}
              <BridgedAssetSection currencyInfo={currencyInfo} isBridgedAsset={isBridgedAsset} />
            </Flex>
          )}

          <StatsSection tokenQueryData={tokenQueryData} isLoading={marketDataLoading} />

          <MoreWaysToTrade />

          <TokenDescription />

          <ActivitySection />
          <RelatedTokens />
        </LeftPanel>
        <RightPanel>
          {/* Swap always visible on desktop (uses display to preserve state) */}
          <Flex display={isDesktop ? 'flex' : 'none'} data-testid={TestID.TokenDetailsSwap}>
            <TDPSwapComponent />
          </Flex>

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

        <MobileBottomBar hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
          <Flex data-testid={TestID.TokenDetailsMobileBottomBar}>
            <TDPActionTabs />
          </Flex>
        </MobileBottomBar>
      </TokenDetailsLayout>
    </Trace>
  )
}
