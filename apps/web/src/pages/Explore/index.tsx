import { getTokenExploreURL } from 'appGraphql/data/util'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { SharedEventName } from '@uniswap/analytics-events'
import PoolNotFoundModal from 'components/NotFoundModal/PoolNotFoundModal'
import TokenNotFoundModal from 'components/NotFoundModal/TokenNotFoundModal'
import { ExploreTopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { TopTokensTable } from 'components/Tokens/TokenTable'
import TableNetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import VolumeTimeFrameSelector from 'components/Tokens/TokenTable/VolumeTimeFrameSelector'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useResetAtom } from 'jotai/utils'
import { ExploreTab } from 'pages/Explore/constants'
import ExploreStatsSection from 'pages/Explore/ExploreStatsSection'
import ProtocolFilter from 'pages/Explore/ProtocolFilter'
import { useExploreParams } from 'pages/Explore/redirects'
import RecentTransactions from 'pages/Explore/tables/RecentTransactions'
import { NamedExoticComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { setOpenModal } from 'state/application/reducer'
import { ExploreContextProvider } from 'state/explore'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Button, Flex, Text, styled as tamaguiStyled, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ElementName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getChainUrlParam, useChainIdFromUrlParam } from 'utils/chainParams'

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
      title: t('common.pools'),
      key: ExploreTab.Pools,
      component: ExploreTopPoolTable,
      loggingElementName: ElementName.ExplorePoolsTab,
    },
    {
      title: t('common.transactions'),
      key: ExploreTab.Transactions,
      component: RecentTransactions,
      loggingElementName: ElementName.ExploreTransactionsTab,
    },
  ]
}

const HeaderTab = tamaguiStyled(Text, {
  ...ClickableTamaguiStyle,
  variant: 'heading3',
  userSelect: 'none',
  color: '$neutral2',
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
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
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

  // to allow backward navigation between tabs
  const { tab: tabName } = useExploreParams()
  const tab = tabName ?? ExploreTab.Tokens

  const urlChainId = useChainIdFromUrlParam()
  const chainInfo = useMemo(() => {
    return urlChainId ? getChainInfo(urlChainId) : undefined
  }, [urlChainId])
  useEffect(() => {
    const tabIndex = Pages.findIndex((page) => page.key === tab)
    if (tabIndex !== -1) {
      setCurrentTab(tabIndex)
    }
    resetManualOutage()
  }, [resetManualOutage, tab, Pages])

  const { component: Page, key: currentKey } = Pages[currentTab]

  // Automatically trigger a navigation when the app chain changes
  useOnGlobalChainSwitch(
    useCallback(
      (chain: UniverseChainId) => {
        if (isBackendSupportedChain(toGraphQLChain(chain))) {
          navigate(getTokenExploreURL({ tab, chainUrlParam: getChainUrlParam(chain) }))
        }
      },
      [navigate, tab],
    ),
  )

  return (
    <Trace logImpression page={InterfacePageName.ExplorePage} properties={{ chainName: chainInfo?.backendChain.chain }}>
      <ExploreContextProvider chainId={chainInfo?.id}>
        <Flex width="100%" minWidth={320} pt="$spacing24" pb="$spacing48" px="$spacing40" $md={{ p: '$spacing16' }}>
          <ExploreStatsSection />
          <Flex
            ref={tabNavRef}
            row
            maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
            mt={80}
            mx="auto"
            mb="$spacing4"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            $lg={{ row: false, flexDirection: 'column', mx: 'unset', alignItems: 'flex-start', gap: '$spacing16' }}
            // Pools page needs to break to multiple rows at larger breakpoint due to the extra filter options
            {...(currentKey === ExploreTab.Pools && {
              $lg: {},
              $xl: { row: false, flexDirection: 'column', mx: 'unset', alignItems: 'flex-start', gap: '$spacing16' },
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
              <TableNetworkFilter />
              {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
              {currentKey === ExploreTab.Pools && <ProtocolFilter />}
              <SearchBar tab={currentKey} />
            </Flex>
          </Flex>
          <Page />
        </Flex>
      </ExploreContextProvider>
      <TokenNotFoundModal />
      <PoolNotFoundModal />
    </Trace>
  )
}

export default Explore
