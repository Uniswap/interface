import { SharedEventName } from '@uniswap/analytics-events'
import { isSVMChain } from '@universe/chains'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Button, Flex, Text, useMedia } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, NamedExoticComponent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { PoolNotFoundModal } from '~/components/NotFoundModal/PoolNotFoundModal'
import { TokenNotFoundModal } from '~/components/NotFoundModal/TokenNotFoundModal'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { getTokenExploreURL } from '~/data/util'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useToucanAuctionSupportedChains } from '~/features/Toucan/supportedChains'
import { ADD_LIQUIDITY_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { AuctionQuickFilters } from '~/pages/Explore/AuctionQuickFilters'
import { AuctionStatusFilter as AuctionStatusFilterComponent } from '~/pages/Explore/AuctionStatusFilter'
import {
  EXPLORE_STICKY_SCROLL_OFFSET_PX,
  EXPLORE_TOKEN_SECTION_ID,
} from '~/pages/Explore/categories/useExploreCategory'
import { EarnVaultsSection } from '~/pages/Explore/EarnVaultsSection'
import {
  ExploreAssetShelfSection,
  ExploreCategoryTablesOrPage,
  ExploreTrendingShelfSection,
} from '~/pages/Explore/ExploreAssetsIntegration'
import { ExploreStatsSection } from '~/pages/Explore/ExploreStatsSection'
import { ExploreTableFilters } from '~/pages/Explore/ExploreTableFilters'
import { AUCTION_FILTER_PARAM, auctionQuickFilterFromParam } from '~/pages/Explore/hooks/useAuctionQuickFilterParam'
import { useExploreHeartbeatCoordinator } from '~/pages/Explore/hooks/useExploreHeartbeatCoordinator'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { useExploreParams } from '~/pages/Explore/redirects'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ToucanTable } from '~/pages/Explore/tables/Auctions/TopAuctionsTable'
import { TopVerifiedAuctionsSection } from '~/pages/Explore/tables/Auctions/TopVerifiedAuctionsSection'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { RecentTransactionsTable } from '~/pages/Explore/tables/RecentTransactions/RecentTransactions'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { useExploreNotFoundModal } from '~/pages/Explore/useExploreNotFoundModal'
import { ExploreTab } from '~/types/explore'
import { getChainUrlParam, useChainIdFromUrlParam } from '~/utils/params/chainParams'

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: NamedExoticComponent<object>
  loggingElementName: ElementName
}

const SOLANA_TAB_NAV_MARGIN_TOP = 36
const DEFAULT_TAB_NAV_MARGIN_TOP = 80

// Stable identity so `<Page />` (a bare component reference) doesn't remount the pools tab on
// every render — `surface` is required on `ExploreTopPoolTable`, so it can't be left off silently.
const ExplorePoolsTabTable = memo(function ExplorePoolsTabTable() {
  return <ExploreTopPoolTable surface="explore" />
})

function usePages(): Array<Page> {
  const { t } = useTranslation()

  return [
    {
      title: t('common.token.plural'),
      key: ExploreTab.Tokens,
      component: TopTokensTable,
      loggingElementName: ElementName.ExploreTokensTab,
    },
    {
      title: t('common.auctions'),
      key: ExploreTab.Toucan,
      component: ToucanTable,
      loggingElementName: ElementName.ExploreAuctionsTab,
    },
    {
      title: t('common.pools'),
      key: ExploreTab.Pools,
      component: ExplorePoolsTabTable,
      loggingElementName: ElementName.ExplorePoolsTab,
    },
    {
      title: t('common.transactions'),
      key: ExploreTab.Transactions,
      component: RecentTransactionsTable,
      loggingElementName: ElementName.ExploreTransactionsTab,
    },
  ]
}

const HEADER_TAB_VARIANTS = {
  large: { true: 'text-[24px] leading-[32px]', false: '' },
  active: { true: 'text-neutral1', false: '' },
  disabled: { true: 'text-neutral3 cursor-default', false: '' },
} as const

// Parity-pinned conversion: packages/tailwind/src/parity/styled-factory/web/frames.ts buildHeaderTab.
// The legacy component rendered an <h3> (Text variant heading3), styled display:inline by the Text base.
// text-decoration is spelled as BOTH arbitrary properties on purpose: cn.ts folds the curated
// underline utilities and `[text-decoration:…]` into one classGroup, so only the `-line` spelling
// keeps the two declarations independent (Tamagui emitted both). The font family rides
// var(--stext-font-book) (the verbatim legacy Basel stack) rather than the fixture's quoted literal:
// quotes in a class name become CSS-escaped quotes in the built selector, which breaks
// check-client-build's at-rule parser for every rule after it.
const HeaderTab = styled('h3', {
  platform: 'web',
  base: '[display:inline] box-border m-0 [word-wrap:break-word] whitespace-pre-wrap cursor-pointer [text-decoration-line:none] [text-decoration:none] duration-[0.2s] select-none text-neutral2 text-[24px] leading-[28.8px] [font-weight:485] [font-family:var(--stext-font-book)] active:opacity-[0.6] media-md:text-[20px] media-sm:text-[16px]',
  variants: HEADER_TAB_VARIANTS,
  // The ClickableTamaguiStyle base hover (opacity 0.8) + the variant overrides (opacity 1) —
  // later rules win via the house tailwind-merge.
  hover: [{ class: 'opacity-[0.8]' }, { active: true, class: 'opacity-[1]' }, { disabled: true, class: 'opacity-[1]' }],
  // ClickableTamaguiStyle's constant `style` default.
  inlineStyle: () => ({ transition: '100ms' }),
  // `disabled` is a behavioural DOM attribute name: the validator requires forwarding it on a DOM base.
  forwardProps: ['disabled'],
})

/** Vertical gap between explore hero sections on mWeb only (carousel ↔ tabs, tabs ↔ category table). */
const EXPLORE_SECTION_MWEB_GAP = '$spacing20'

const Explore = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const { t } = useTranslation()
  const media = useMedia()
  const tabNavRef = useRef<HTMLDivElement>(null)
  const Pages = usePages()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab, Pages])

  // to allow backward navigation between tabs
  const { tab: tabName } = useExploreParams()
  const tab = tabName ?? ExploreTab.Tokens

  // Deep links like /explore/auctions?filter=verified seed the filter store at creation.
  // Keyed off the same route param the active tab resolves from, not the initialTab prop.
  const [initialQuickFilter] = useState(() =>
    tabName === ExploreTab.Toucan ? auctionQuickFilterFromParam(params.get(AUCTION_FILTER_PARAM)) : undefined,
  )

  const auctionSupportedChains = useToucanAuctionSupportedChains()

  // Featured RWA carousel renders unless the caller's region blocks RWA.
  const isExploreCarouselEnabled = !useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA, { pendingValue: true })
  const showTrendingShelf = useIsTokenCategoriesEnabled()
  const showAssetShelf = !showTrendingShelf && isExploreCarouselEnabled
  const showHeroShelf = showTrendingShelf || showAssetShelf

  // scroll to tab navbar on initial page mount only
  // skip when a hero shelf is shown — the shelf is the hero content and shouldn't be scrolled past
  useEffect(() => {
    if (tabNavRef.current && initialTab && !(showHeroShelf && initialTab === ExploreTab.Tokens)) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - EXPLORE_STICKY_SCROLL_OFFSET_PX, behavior: 'smooth' })
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [])

  const { isTokenNotFoundOpen, isPoolNotFoundOpen, closeNotFoundModal } = useExploreNotFoundModal()
  const isNotFoundModalOpen = isTokenNotFoundOpen || isPoolNotFoundOpen

  const [currentTab, setCurrentTab] = useState(initialKey)
  const { component: Page, key: currentKey } = Pages[currentTab] || {}

  useExploreHeartbeatCoordinator({ tab: currentKey, enabled: true })

  const urlChainId = useChainIdFromUrlParam()
  const chainInfo = useMemo(() => {
    return urlChainId ? getChainInfo(urlChainId) : undefined
  }, [urlChainId])

  const isSolanaChain = chainInfo && isSVMChain(chainInfo.id)
  const { isTestnetModeEnabled } = useEnabledChains()
  const showEarnSection = !isTestnetModeEnabled
  const showExploreCategoryTables = currentKey === ExploreTab.Tokens
  const tabNavMarginTop =
    showHeroShelf && !showEarnSection
      ? '$none'
      : isSolanaChain
        ? SOLANA_TAB_NAV_MARGIN_TOP
        : showEarnSection
          ? '$spacing40'
          : DEFAULT_TAB_NAV_MARGIN_TOP

  useEffect(() => {
    // We only support the Tokens tab on Solana; redirect if the current tab is not the Tokens tab on Solana.
    if (isSolanaChain && currentKey !== ExploreTab.Tokens) {
      const url = getTokenExploreURL({
        tab: ExploreTab.Tokens,
        chainUrlParam: getChainUrlParam(chainInfo.id),
      })

      navigate(url)
    }
  }, [isSolanaChain, currentKey, chainInfo, navigate])

  useEffect(() => {
    const tabIndex = Pages.findIndex((page) => page.key === tab)
    if (tabIndex !== -1) {
      setCurrentTab(tabIndex)
    }
  }, [tab, Pages])

  const filteredChainIds = useFilteredChainIds()
  const tabSupportedNetworks = useMemo(() => {
    // No SVM support for transactions or pools
    if (currentKey === ExploreTab.Pools || currentKey === ExploreTab.Transactions) {
      return filteredChainIds.filter((chainId) => !isSVMChain(chainId))
    }
    return filteredChainIds
  }, [filteredChainIds, currentKey])

  return (
    <Trace
      logImpression
      page={InterfacePageName.ExplorePage}
      properties={{
        chainName: chainInfo?.backendChain.chain,
        tab: tabName,
      }}
    >
      <ExploreContextProvider chainId={chainInfo?.id}>
        <ExploreTablesFilterStoreContextProvider initialQuickFilter={initialQuickFilter}>
          <Flex width="100%" minWidth={320} pt="$spacing24" pb="$spacing48" px="$spacing40" $md={{ p: '$spacing16' }}>
            <ExploreStatsSection shouldHideStats={isSolanaChain} />
            {showTrendingShelf && <ExploreTrendingShelfSection />}
            {showAssetShelf && <ExploreAssetShelfSection />}
            {showEarnSection && (
              <Flex mt={showHeroShelf ? '$none' : '$spacing32'}>
                <EarnVaultsSection />
              </Flex>
            )}
            <Flex
              ref={tabNavRef}
              id={EXPLORE_TOKEN_SECTION_ID}
              row
              maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
              mt={tabNavMarginTop}
              mx="auto"
              mb="$spacing4"
              $md={{
                mb: EXPLORE_SECTION_MWEB_GAP,
              }}
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              $platform-web={{
                transition: 'margin-top 300ms ease',
              }}
              $lg={{
                row: false,
                flexDirection: 'column',
                mx: 'unset',
                alignItems: 'flex-start',
                gap: '$spacing16',
              }}
              // Pools page needs to break to multiple rows at larger breakpoint due to the extra filter options
              {...(currentKey === ExploreTab.Pools && {
                $lg: {},
                $xl: {
                  row: false,
                  flexDirection: 'column',
                  mx: 'unset',
                  alignItems: 'flex-start',
                  gap: '$spacing16',
                },
              })}
            >
              <Flex
                row
                gap="$spacing24"
                flexWrap="wrap"
                justifyContent="flex-start"
                $md={{ gap: '$spacing16' }}
                data-testid="explore-navbar"
              >
                {Pages.map(({ title, loggingElementName, key }, index) => {
                  // don't render tab; don't disrupt indices
                  if (isSolanaChain && key !== ExploreTab.Tokens) {
                    return null
                  }

                  const url = getTokenExploreURL({
                    tab: key,
                    chainUrlParam: chainInfo ? getChainUrlParam(chainInfo.id) : '',
                  })
                  return (
                    <Trace
                      key={key}
                      logPress
                      eventOnTrigger={SharedEventName.NAVBAR_CLICKED}
                      element={loggingElementName}
                    >
                      <HeaderTab
                        // Replace the not-found entry so browser back cannot land on it and reopen the modal.
                        onClick={() => navigate(url, { replace: isNotFoundModalOpen })}
                        active={currentTab === index}
                      >
                        {title}
                      </HeaderTab>
                    </Trace>
                  )
                })}
              </Flex>
              {!showExploreCategoryTables && (
                <Flex row gap="$spacing8" justifyContent="flex-start" $md={{ width: '100%' }}>
                  {currentKey === ExploreTab.Pools && (
                    <Flex row>
                      <Trace logPress element={ElementName.ExplorePoolsNewPosition}>
                        <Button
                          size="small"
                          icon={<Plus />}
                          onPress={() =>
                            navigate(ADD_LIQUIDITY_PATH, {
                              state: { entryPoint: '/explore/pools' },
                            })
                          }
                        >
                          {media.sm ? t('common.new') : t('pool.newPosition.title')}
                        </Button>
                      </Trace>
                    </Flex>
                  )}
                  <ExploreTableFilters currentKey={currentKey} tabSupportedNetworks={tabSupportedNetworks} />
                </Flex>
              )}
            </Flex>
            {currentKey === ExploreTab.Toucan && <TopVerifiedAuctionsSection />}
            {currentKey === ExploreTab.Toucan && (
              <Flex
                row
                maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
                mx="auto"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
                paddingTop="$spacing24"
                $lg={{
                  row: false,
                  flexDirection: 'column',
                  mx: 'unset',
                  alignItems: 'flex-start',
                  gap: '$spacing16',
                }}
              >
                <Text variant="subheading1" color="$neutral1">
                  {t('toucan.auctions')}
                </Text>
                {/* Actions can exceed small viewports — scroll the whole row in place instead of stacking or widening the page. */}
                <Flex
                  row
                  gap="$spacing8"
                  justifyContent="flex-start"
                  alignItems="center"
                  className="scrollbar-hidden"
                  $md={{ width: '100%', '$platform-web': { overflowX: 'auto' } }}
                >
                  <Button
                    size="small"
                    icon={<Plus />}
                    fill={false}
                    onPress={() => navigate('/liquidity/launch-auction')}
                  >
                    {t('toucan.createAuction.launchAuction')}
                  </Button>
                  <TableNetworkFilter networks={auctionSupportedChains} />
                  <AuctionStatusFilterComponent />
                  <SearchBar tab={currentKey} />
                </Flex>
              </Flex>
            )}
            {currentKey === ExploreTab.Toucan && (
              <Flex
                maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
                mx="auto"
                width="100%"
                paddingTop="$spacing16"
                $lg={{ mx: 'unset' }}
              >
                <AuctionQuickFilters />
              </Flex>
            )}
            <ExploreCategoryTablesOrPage showExploreCategoryTables={showExploreCategoryTables} page={<Page />} />
          </Flex>
        </ExploreTablesFilterStoreContextProvider>
      </ExploreContextProvider>
      <TokenNotFoundModal isOpen={isTokenNotFoundOpen} closeModal={closeNotFoundModal} />
      <PoolNotFoundModal isOpen={isPoolNotFoundOpen} closeModal={closeNotFoundModal} />
    </Trace>
  )
}

export default Explore
