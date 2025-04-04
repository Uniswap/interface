import { InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { ExploreTopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import { TopTokensTable } from 'components/Tokens/TokenTable'
import TableNetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import VolumeTimeFrameSelector from 'components/Tokens/TokenTable/VolumeTimeFrameSelector'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { getTokenExploreURL } from 'graphql/data/util'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useResetAtom } from 'jotai/utils'
import ExploreStatsSection from 'pages/Explore/ExploreStatsSection'
import ProtocolFilter from 'pages/Explore/ProtocolFilter'
import { useExploreParams } from 'pages/Explore/redirects'
import RecentTransactions from 'pages/Explore/tables/RecentTransactions'
import { NamedExoticComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ExploreContextProvider } from 'state/explore'
import { TamaguiClickableStyle } from 'theme/components/styles'
import { Button, Flex, Text, styled as tamaguiStyled, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isBackendSupportedChain } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useChainIdFromUrlParam } from 'utils/chainParams'

export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
}

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: NamedExoticComponent<object>
  loggingElementName: InterfaceElementName
}

function usePages(): Array<Page> {
  const { t } = useTranslation()
  return [
    {
      title: t('common.tokens'),
      key: ExploreTab.Tokens,
      component: TopTokensTable,
      loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
    },
    {
      title: t('common.pools'),
      key: ExploreTab.Pools,
      component: ExploreTopPoolTable,
      loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
    },
    {
      title: t('common.transactions'),
      key: ExploreTab.Transactions,
      component: RecentTransactions,
      loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
    },
  ]
}

const HeaderTab = tamaguiStyled(Text, {
  ...TamaguiClickableStyle,
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

  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab, Pages])

  useEffect(() => {
    if (tabNavRef.current && initialTab) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - 90, behavior: 'smooth' })
    }
    // scroll to tab navbar on initial page mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const navigate = useNavigate()
  useOnGlobalChainSwitch(
    useCallback(
      (_chainId, chain) => {
        if (chain && isBackendSupportedChain(chain)) {
          navigate(getTokenExploreURL({ tab, chain }))
        }
      },
      [navigate, tab],
    ),
  )

  return (
    <Trace
      logImpression
      page={InterfacePageName.EXPLORE_PAGE}
      properties={{ chainName: chainInfo?.backendChain.chain }}
    >
      <ExploreContextProvider chainId={chainInfo?.id}>
        <Flex width="100%" minWidth={320} py="$spacing48" px="$spacing40" $md={{ p: '$spacing16' }}>
          <ExploreStatsSection />
          <Flex
            ref={tabNavRef}
            row
            maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
            mt={60}
            mx="auto"
            mb="$spacing4"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            $lg={{
              row: false,
              flexDirection: 'column',
              mx: 'unset',
              alignItems: 'flex-start',
              gap: '$spacing16',
            }}
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
                const url = getTokenExploreURL({ tab: key, chain: chainInfo?.backendChain.chain })
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
            <Flex row gap="$spacing8" justifyContent="flex-start">
              {currentKey === ExploreTab.Pools && (
                <Flex row>
                  <Button size="small" icon={<Plus />} onPress={() => navigate('/positions/create')}>
                    {media.sm ? t('common.add.label') : t('common.addLiquidity')}
                  </Button>
                </Flex>
              )}
              <TableNetworkFilter showMultichainOption={currentKey !== ExploreTab.Transactions} />
              {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
              {currentKey === ExploreTab.Pools && <ProtocolFilter />}
              <SearchBar tab={currentKey} />
            </Flex>
          </Flex>
          <Page />
        </Flex>
      </ExploreContextProvider>
    </Trace>
  )
}

export default Explore
