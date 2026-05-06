import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, useIsTouchDevice, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, getChainLabel } from 'uniswap/src/features/chains/utils'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
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
import { TDPBreadcrumb } from '~/pages/TokenDetails/components/header/TDPBreadcrumb'
import { TokenDetailsHeader } from '~/pages/TokenDetails/components/header/TokenDetailsHeader'
import { BridgedAssetSection } from '~/pages/TokenDetails/components/info/BridgedAssetSection'
import { StatsSection } from '~/pages/TokenDetails/components/info/StatsSection'
import { TokenDescription } from '~/pages/TokenDetails/components/info/TokenDescription'
import { TokenPerformance } from '~/pages/TokenDetails/components/performance/TokenPerformance'
import { LeftPanel, RightPanel, TokenDetailsLayout } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { TDPSwapComponent } from '~/pages/TokenDetails/components/swap/TDPSwapComponent'
import { TokenCarousel } from '~/pages/TokenDetails/components/TokenCarousel/TokenCarousel'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function TokenDetailsContent({ isCompact }: { isCompact: boolean }) {
  const media = useMedia()
  const isTouchDevice = useIsTouchDevice()
  const { t } = useTranslation()

  const { tokenQuery, currencyChain, multiChainMap, address, currency } = useTDPStore((s) => ({
    tokenQuery: s.tokenQuery,
    currencyChain: s.currencyChain,
    multiChainMap: s.multiChainMap,
    address: s.address,
    currency: s.currency!,
  }))
  const tokenQueryData = tokenQuery.data?.token
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const isMultichainAsset = isMultichainProjectTokens(tokenQueryData?.project?.tokens)
  const pageChainBalance = multiChainMap[currencyChain]?.balance

  const { direction: scrollDirection } = useScroll()

  const chainId = fromGraphQLChain(currencyChain) ?? UniverseChainId.Mainnet
  const currencyInfo = useCurrencyInfo(
    tokenQueryData?.address ? buildCurrencyId(chainId, tokenQueryData.address) : undefined,
  )
  const isBridgedAsset = Boolean(currencyInfo?.isBridged)
  const showTokenInfo = !!pageChainBalance || isBridgedAsset
  const isDesktop = !media.xl
  const showBalanceInfo = isDesktop && showTokenInfo

  const chainLabel = getChainLabel(chainId)
  const isTDPTokenCarouselEnabled = useFeatureFlag(FeatureFlags.TDPTokenCarousel)

  return (
    <Trace
      logImpression
      page={InterfacePageName.TokenDetailsPage}
      properties={{
        tokenAddress: address,
        tokenSymbol: currency.symbol,
        tokenName: currency.name,
        chainId: currency.chainId,
        ...(multichainTokenUxEnabled ? { multichain: isMultichainAsset } : {}),
      }}
    >
      <TDPBreadcrumb />
      <StickyCollapsibleHeader isCompact={isCompact}>
        <TokenDetailsHeader isCompact={isCompact} />
      </StickyCollapsibleHeader>
      <TokenDetailsLayout>
        <LeftPanel gap="$spacing40" $lg={{ gap: '$gap32' }}>
          <ChartSection />

          {!showBalanceInfo && (
            <Flex gap="$gap24">
              {!!pageChainBalance && <BalanceSummary />}
              <BridgedAssetSection
                tokenQueryData={tokenQueryData}
                currencyInfo={currencyInfo}
                isBridgedAsset={isBridgedAsset}
              />
            </Flex>
          )}

          <StatsSection tokenQueryData={tokenQueryData} />

          <TokenDescription />

          <ActivitySection />
          {isTDPTokenCarouselEnabled && (
            <TokenCarousel
              title={t('explore.popularOn.title', { chain: chainLabel })}
              tooltipText={t('explore.popularOn.tooltip')}
              chainId={chainId}
            />
          )}
        </LeftPanel>
        <RightPanel>
          {/* Swap always visible on desktop (uses display to preserve state) */}
          <Flex display={isDesktop ? 'flex' : 'none'} data-testid={TestID.TokenDetailsSwap}>
            <TDPSwapComponent />
          </Flex>

          {/* Balance and bridged sections only show when user has balance or it's bridged */}
          <Flex display={showBalanceInfo ? 'flex' : 'none'} gap="$gap24" mt="$gap24">
            <BalanceSummary />
            <BridgedAssetSection
              tokenQueryData={tokenQueryData}
              currencyInfo={currencyInfo}
              isBridgedAsset={isBridgedAsset}
            />
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
