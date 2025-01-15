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
import { ExploreChartsSection } from 'pages/Explore/charts/ExploreChartsSection'
import { useExploreParams } from 'pages/Explore/redirects'
import RecentTransactions from 'pages/Explore/tables/RecentTransactions'
import { NamedExoticComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ExploreContextProvider } from 'state/explore'
import { TamaguiClickableStyle } from 'theme/components'
import { Button, Flex, Text, styled as tamaguiStyled } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isBackendSupportedChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
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

const Pages: Array<Page> = [
  {
    title: <Trans i18nKey="common.tokens" />,
    key: ExploreTab.Tokens,
    component: TopTokensTable,
    loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
  },
  {
    title: <Trans i18nKey="common.pools" />,
    key: ExploreTab.Pools,
    component: ExploreTopPoolTable,
    loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
  },
  {
    title: <Trans i18nKey="common.transactions" />,
    key: ExploreTab.Transactions,
    component: RecentTransactions,
    loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
  },
]

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
  const tabNavRef = useRef<HTMLDivElement>(null)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)

  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab])

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
  }, [resetManualOutage, tab])

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
        <Flex width="100%" minWidth={320} pt="$spacing48" px="$spacing40" $md={{ p: '$spacing16', pb: 0 }}>
          <ExploreChartsSection />
          <Flex
            ref={tabNavRef}
            row
            maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
            mt={0}
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
            <Flex row gap="$spacing8" height="$spacing40" justifyContent="flex-start">
              {currentKey === ExploreTab.Pools && isLPRedesignEnabled && (
                <Button
                  size="small"
                  backgroundColor="$accent3"
                  hoverStyle={{ backgroundColor: '$accent3', opacity: 0.6 }}
                  pressStyle={{ backgroundColor: '$accent3', opacity: 0.8 }}
                  onPress={() => navigate('/positions/create')}
                >
                  <Flex row gap="$gap8" alignItems="center">
                    <Plus size={20} color="$surface1" />
                    <Text variant="buttonLabel3" lineHeight={20} color="$surface1">
                      {t('common.addLiquidity')}
                    </Text>
                  </Flex>
                </Button>
              )}
              <TableNetworkFilter showMultichainOption={currentKey !== ExploreTab.Transactions} />
              {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
              {currentKey !== ExploreTab.Transactions && <SearchBar tab={currentKey} />}
            </Flex>
          </Flex>
          <Page />
        </Flex>
      </ExploreContextProvider>
    </Trace>
  )
}

export default Explore
