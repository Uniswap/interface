import { SharedEventName } from '@uniswap/analytics-events'
import { NamedExoticComponent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button, Flex, styled, Text, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { ElementName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getTokenExploreURL } from '~/appGraphql/data/util'
import { VolumeTimeFrameSelector } from '~/components/Explore/VolumeTimeFrameSelector'
import PoolNotFoundModal from '~/components/NotFoundModal/PoolNotFoundModal'
import TokenNotFoundModal from '~/components/NotFoundModal/TokenNotFoundModal'
import { ToucanTable } from '~/components/Toucan/TopAuctionsTable'
import { TopVerifiedAuctionsSection } from '~/components/Toucan/TopVerifiedAuctionsSection'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { AuctionStatusFilter as AuctionStatusFilterComponent } from '~/pages/Explore/AuctionStatusFilter'
import { AuctionVerificationFilter as AuctionVerificationFilterComponent } from '~/pages/Explore/AuctionVerificationFilter'
import { ExploreTab } from '~/pages/Explore/constants'
import { ExploreStatsSection } from '~/pages/Explore/ExploreStatsSection'
import { ExploreTablesFilterStoreContextProvider } from '~/pages/Explore/exploreTablesFilterStore'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { ProtocolFilter } from '~/pages/Explore/ProtocolFilter'
import { useExploreParams } from '~/pages/Explore/redirects'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { RecentTransactionsTable } from '~/pages/Explore/tables/RecentTransactions/RecentTransactions'
import { TopTokensTable } from '~/pages/Explore/tables/Tokens/TopTokensTable'
import { setOpenModal } from '~/state/application/reducer'
import { ExploreContextProvider } from '~/state/explore'
import { useManualChainOutageStore } from '~/state/outage/store'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { getChainUrlParam, useChainIdFromUrlParam } from '~/utils/chainParams'

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: NamedExoticComponent<object>
  loggingElementName: ElementName
}

function usePages(): Array<Page> {
  const { t } = useTranslation()

  return [
    {
      title: t('common.tokens'),
      key: ExploreTab.Tokens,
      component: TopTokensTable,
      loggingElementName: ElementName.ExploreTokensTab,
    },
    {
      title: t('toucan.auctions'),
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

const Explore = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const { t } = useTranslation()
  const media = useMedia()
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

  // scroll to tab navbar on initial page mount only
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only runs once on mount
  useEffect(() => {
    if (tabNavRef.current && initialTab) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - 90, behavior: 'smooth' })
    }
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

  // to allow backward navigation between tabs
  const { tab: tabName } = useExploreParams()
  const tab = tabName ?? ExploreTab.Tokens

  const urlChainId = useChainIdFromUrlParam()
  const chainInfo = useMemo(() => {
    return urlChainId ? getChainInfo(urlChainId) : undefined
  }, [urlChainId])

  const isSolanaChain = chainInfo && isSVMChain(chainInfo.id)

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
            <Flex
              ref={tabNavRef}
              row
              maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
              mt={isSolanaChain ? 36 : 80}
              mx="auto"
              mb="$spacing4"
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
              <Flex row gap="$spacing8" justifyContent="flex-start" $md={{ width: '100%' }}>
                {currentKey === ExploreTab.Pools && (
                  <Flex row>
                    <Button size="small" icon={<Plus />} onPress={() => navigate('/positions/create')}>
                      {media.sm ? t('common.add.label') : t('common.addLiquidity')}
                    </Button>
                  </Flex>
                )}
                {currentKey !== ExploreTab.Toucan && <TableNetworkFilter />}
                {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
                {currentKey === ExploreTab.Pools && <ProtocolFilter />}
                {currentKey !== ExploreTab.Toucan && <SearchBar tab={currentKey} />}
              </Flex>
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
                  <TableNetworkFilter />
                  <AuctionVerificationFilterComponent />
                  <AuctionStatusFilterComponent />
                  <SearchBar tab={currentKey} />
                </Flex>
              </Flex>
            )}
            <Page />
          </Flex>
        </ExploreTablesFilterStoreContextProvider>
      </ExploreContextProvider>
      <TokenNotFoundModal />
      <PoolNotFoundModal />
    </Trace>
  )
}

export default Explore
