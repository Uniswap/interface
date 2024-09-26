import { InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { TopPoolTable } from 'components/Pools/PoolTable/PoolTable'
import { TopTokensTable } from 'components/Tokens/TokenTable'
import TableNetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import VolumeTimeFrameSelector from 'components/Tokens/TokenTable/VolumeTimeFrameSelector'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useChainFromUrlParam } from 'constants/chains'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { getTokenExploreURL, isBackendSupportedChain } from 'graphql/data/util'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useResetAtom } from 'jotai/utils'
import { ExploreChartsSection } from 'pages/Explore/charts/ExploreChartsSection'
import { useExploreParams } from 'pages/Explore/redirects'
import RecentTransactions from 'pages/Explore/tables/RecentTransactions'
import { NamedExoticComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExploreContextProvider } from 'state/explore'
import { TamaguiClickableStyle } from 'theme/components'
import { Flex, Text, styled as tamaguiStyled } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Trans } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
    component: TopPoolTable,
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
  fontSize: 28,
  fontWeight: '$book',
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
  const tabNavRef = useRef<HTMLDivElement>(null)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)

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

  const chainWithoutFallback = useChainFromUrlParam()
  const chain = useMemo(() => {
    return isMultichainExploreEnabled
      ? chainWithoutFallback
      : chainWithoutFallback ?? UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet]
  }, [chainWithoutFallback, isMultichainExploreEnabled])
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
    <Trace logImpression page={InterfacePageName.EXPLORE_PAGE} properties={{ chainName: chain?.backendChain.chain }}>
      <ExploreContextProvider chainId={chain?.id}>
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
                // disable Transactions tab if no chain is selected
                const disabled = isMultichainExploreEnabled && key === ExploreTab.Transactions && !chain
                const url = getTokenExploreURL({ tab: key, chain: chain?.backendChain.chain })
                return (
                  <Trace
                    logPress
                    eventOnTrigger={SharedEventName.NAVBAR_CLICKED}
                    element={loggingElementName}
                    key={index}
                  >
                    <MouseoverTooltip
                      size={TooltipSize.Max}
                      placement="bottom"
                      offsetX={68}
                      text={<Trans i18nKey="explore.transactions.disabled" />}
                      disabled={!disabled}
                    >
                      <HeaderTab
                        onPress={() => !disabled && navigate(url)}
                        active={currentTab === index}
                        disabled={disabled}
                        key={key}
                      >
                        {title}
                      </HeaderTab>
                    </MouseoverTooltip>
                  </Trace>
                )
              })}
            </Flex>
            <Flex row gap="$spacing8" height="$spacing40" justifyContent="flex-start">
              <TableNetworkFilter />
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
