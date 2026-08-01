import { SharedEventName } from '@uniswap/analytics-events'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { NamedExoticComponent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button, Flex, styled, Text, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { ElementName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getTokenExploreURL } from '~/appGraphql/data/util'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { PoolNotFoundModal } from '~/components/NotFoundModal/PoolNotFoundModal'
import { TokenNotFoundModal } from '~/components/NotFoundModal/TokenNotFoundModal'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { EarnVaultsSection } from '~/features/earn/EarnVaultsSection'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { TOUCAN_AUCTION_SUPPORTED_CHAINS } from '~/features/Toucan/supportedChains'
import { AuctionQuickFilters } from '~/pages/Explore/AuctionQuickFilters'
import { AuctionStatusFilter as AuctionStatusFilterComponent } from '~/pages/Explore/AuctionStatusFilter'
import {
  EXPLORE_STICKY_SCROLL_OFFSET_PX,
  EXPLORE_TOKEN_SECTION_ID,
} from '~/pages/Explore/categories/useExploreCategory'
import { ExploreAssetShelfSection, ExploreCategoryTablesOrPage } from '~/pages/Explore/ExploreAssetsIntegration'
import { ExploreStatsSection } from '~/pages/Explore/ExploreStatsSection'
import { useExploreHeartbeatCoordinator } from '~/pages/Explore/hooks/useExploreHeartbeatCoordinator'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { ProtocolFilter } from '~/pages/Explore/ProtocolFilter'
import { useExploreParams } from '~/pages/Explore/redirects'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ToucanTable } from '~/pages/Explore/tables/Auctions/TopAuctionsTable'
import { TopVerifiedAuctionsSection } from '~/pages/Explore/tables/Auctions/TopVerifiedAuctionsSection'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { RecentTransactionsTable } from '~/pages/Explore/tables/RecentTransactions/RecentTransactions'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { setOpenModal } from '~/state/application/reducer'
import { useManualChainOutageStore } from '~/state/outage/store'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
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
      component: ExploreTopPoolTable,
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

const HeaderTab = styled(Text, {
  ...ClickableTamaguiStyle,
  variant: 'heading3',
  userSelect: 'none',
  color: '$neutral2',
  $md: {
    fontSize: 20,
  },
  $sm: {
    fontSize: 16,
  },
  variants: {
    large: {
      true: {
        fontSize: 24,
        lineHeight: 32,
      },
    },
    active: {
      true: {
        color: '$neutral1',
        hoverStyle: {
          opacity: 1,
        },
      },
    },
    disabled: {
      true: {
        color: '$neutral3',
        cursor: 'default',
        hoverStyle: {
          opacity: 1,
        },
      },
    },
  },
})

/** Vertical gap between explore hero sections on mWeb only (carousel ↔ tabs, tabs ↔ category table). */
const EXPLORE_SECTION_MWEB_GAP = '$spacing20'

const Explore = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const { t } = useTranslation()
  const media = useMedia()
  const isAddLiquidityRevampEnabled = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const tabNavRef = useRef<HTMLDivElement>(null)
  const Pages = usePages()
  const [params] = useSearchParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab, Pages])

  const isExploreTableEnabled = useFeatureFlag(FeatureFlags.RWAUXExplore)
  // Featured RWA carousel renders unless the caller's region blocks RWA.
  const isExploreCarouselEnabled = !useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)

  // scroll to tab navbar on initial page mount only
  // skip when the asset shelf is shown — the shelf is the hero content and shouldn't be scrolled past
  useEffect(() => {
    if (tabNavRef.current && initialTab && !(isExploreCarouselEnabled && initialTab === ExploreTab.Tokens)) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - EXPLORE_STICKY_SCROLL_OFFSET_PX, behavior: 'smooth' })
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [])

  useEffect(() => {
    const notFound = params.get('result') === ModalName.NotFound
    const type = params.get('type')

    if (notFound) {
      switch (type) {
        case ExploreTab.Tokens:
          dispatch(setOpenModal({ name: ModalName.TokenNotFound }))
          break
        case ExploreTab.Pools:
          dispatch(setOpenModal({ name: ModalName.PoolNotFound }))
          break
      }

      // navigate without params
      navigate(location.pathname, { replace: true })
    }
  }, [params, dispatch, navigate, location])

  const [currentTab, setCurrentTab] = useState(initialKey)
  const { component: Page, key: currentKey } = Pages[currentTab] || {}

  useExploreHeartbeatCoordinator({ tab: currentKey, enabled: true })

  // to allow backward navigation between tabs
  const { tab: tabName } = useExploreParams()
  const tab = tabName ?? ExploreTab.Tokens

  const urlChainId = useChainIdFromUrlParam()
  const chainInfo = useMemo(() => {
    return urlChainId ? getChainInfo(urlChainId) : undefined
  }, [urlChainId])

  const isSolanaChain = chainInfo && isSVMChain(chainInfo.id)
  const { isTestnetModeEnabled } = useEnabledChains()
  const isEarnEnabled = useIsEarnEnabled()
  const showEarnSection = isEarnEnabled && !isTestnetModeEnabled
  const showAssetShelf = isExploreCarouselEnabled
  const showExploreCategoryTables = isExploreTableEnabled && currentKey === ExploreTab.Tokens
  const tabNavMarginTop =
    showAssetShelf && !showEarnSection
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

    useManualChainOutageStore.getState().reset()
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
        <ExploreTablesFilterStoreContextProvider>
          <Flex width="100%" minWidth={320} pt="$spacing24" pb="$spacing48" px="$spacing40" $md={{ p: '$spacing16' }}>
            <ExploreStatsSection shouldHideStats={isSolanaChain} />
            {showAssetShelf && <ExploreAssetShelfSection />}
            {showEarnSection && (
              <Flex mt={showAssetShelf ? '$none' : '$spacing32'}>
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
                      logPress
                      eventOnTrigger={SharedEventName.NAVBAR_CLICKED}
                      element={loggingElementName}
                      key={index}
                    >
                      <HeaderTab onPress={() => navigate(url)} active={currentTab === index} key={key}>
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
                      <Button
                        size="small"
                        icon={<Plus />}
                        onPress={() =>
                          navigate(isAddLiquidityRevampEnabled ? '/positions/add' : '/positions/create', {
                            state: { entryPoint: '/explore/pools' },
                          })
                        }
                      >
                        {media.sm ? t('common.new') : t('pool.newPosition.title')}
                      </Button>
                    </Flex>
                  )}
                  {currentKey !== ExploreTab.Toucan && <TableNetworkFilter networks={tabSupportedNetworks} />}
                  {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
                  {currentKey === ExploreTab.Pools && <ProtocolFilter />}
                  {currentKey !== ExploreTab.Toucan && <SearchBar tab={currentKey} />}
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
                <Flex row gap="$spacing8" justifyContent="flex-start" $md={{ width: '100%' }}>
                  <Button
                    size="small"
                    icon={<Plus />}
                    fill={false}
                    onPress={() => navigate('/liquidity/launch-auction')}
                  >
                    {t('toucan.createAuction.launchAuction')}
                  </Button>
                  <TableNetworkFilter networks={TOUCAN_AUCTION_SUPPORTED_CHAINS} />
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
      <TokenNotFoundModal />
      <PoolNotFoundModal />
    </Trace>
  )
}

export default Explore
