import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import { ColumnCenter } from 'components/Column'
import { RowBetween } from 'components/Row'
import { SEOSwap } from 'components/SEO'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import TopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import { ListOrderHandle } from 'components/swapv2/LimitOrder/type'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfoTab'
import TokenInfoV2 from 'components/swapv2/TokenInfoV2'
import {
  Container,
  InfoComponentsWrapper,
  LiveChartWrapper,
  PageWrapper,
  RoutesWrapper,
  SwapFormWrapper,
} from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useIsLoadedTokenDefault } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import HeaderRightMenu from 'pages/SwapV3/HeaderRightMenu'
import Tabs from 'pages/SwapV3/Tabs'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useInputCurrency, useOutputCurrency, useSwapActionHandlers } from 'state/swap/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useDegenModeManager, useShowLiveChart, useShowTokenInfo, useShowTradeRoutes } from 'state/user/hooks'
import { CloseIcon } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { getTradeComposition } from 'utils/aggregationRouting'
import { getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList } from 'utils/tokenInfo'

import PopulatedSwapForm from './PopulatedSwapForm'

const TradeRouting = lazy(() => import('components/TradeRouting'))
const LiveChart = lazy(() => import('components/LiveChart'))

export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  GAS_PRICE_TRACKER = 'gas_price_tracker',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
}

const highlight = (theme: DefaultTheme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }

  70% {
    box-shadow: 0 0 0 2px ${theme.primary};
  }

  100% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }
`

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

const DegenBanner = styled(RowBetween)`
  padding: 10px 16px;
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 24px;
`

export default function Swap() {
  const { chainId, isSolana } = useActiveWeb3React()
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString<{
    highlightBox: string
    outputCurrency: string
    inputCurrency: string
  }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manualy or click rotate token.

  const { pathname } = useLocation()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const refListLimitOrder = useRef<ListOrderHandle>(null)

  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const [activeTab, setActiveTab] = useState<TAB>(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  const { onSelectPair: onSelectPairLimit } = useLimitActionHandlers()
  const limitState = useLimitState()
  const currenciesLimit = useMemo(() => {
    return { [Field.INPUT]: limitState.currencyIn, [Field.OUTPUT]: limitState.currencyOut }
  }, [limitState.currencyIn, limitState.currencyOut])

  useEffect(() => {
    setActiveTab(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  }, [isSwapPage])

  const refreshListOrder = useCallback(() => {
    if (isLimitPage) {
      refListLimitOrder.current?.refreshListOrder()
    }
  }, [isLimitPage])

  useDefaultsFromURLSearch()
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)

  const theme = useTheme()

  const [isDegenMode] = useDegenModeManager()

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn,
      [Field.OUTPUT]: currencyOut,
    }),
    [currencyIn, currencyOut],
  )

  const urlLoadedTokens: Token[] = useMemo(
    () =>
      (isSwapPage ? [currencyIn, currencyOut] : [limitState.currencyIn, limitState.currencyOut])?.filter(
        (c): c is Token => c instanceof Token,
      ) ?? [],
    [isSwapPage, currencyIn, currencyOut, limitState.currencyIn, limitState.currencyOut],
  )
  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    if (showingPairSuggestionImport) {
      setShowingPairSuggestionImport(false)
    } else {
      setDismissTokenWarning(true)
    }
  }, [showingPairSuggestionImport])

  const handleConfirmTokenWarning = useCallback(
    (tokens: Currency[]) => {
      handleDismissTokenWarning()
      if (showingPairSuggestionImport) {
        refSuggestPair.current?.onConfirmImportToken() // callback from children
      }
      if (isLimitPage) {
        onSelectPairLimit(tokens[0], tokens[1])
        setIsSelectCurrencyManually(true)
      }
    },
    [isLimitPage, onSelectPairLimit, showingPairSuggestionImport, handleDismissTokenWarning],
  )

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (isLimitPage) {
        onSelectPairLimit(fromToken, toToken)
        setIsSelectCurrencyManually(true)
        return
      }

      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection, onSelectPairLimit, isLimitPage],
  )

  const isLoadedTokenDefault = useIsLoadedTokenDefault()

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const onBackToSwapTab = () => setActiveTab(isLimitPage ? TAB.LIMIT : TAB.SWAP)

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList && isSwapPage

  const isShowModalImportToken =
    isLoadedTokenDefault && importTokensNotInDefault.length > 0 && (!dismissTokenWarning || showingPairSuggestionImport)

  const tradeRouteComposition = useMemo(() => {
    return getTradeComposition(chainId, routeSummary?.parsedAmountIn, undefined, routeSummary?.route, defaultTokens)
  }, [chainId, defaultTokens, routeSummary])

  const [isShowDegenBanner, setShowDegenBanner] = useState(true)

  return (
    <>
      {/**
       * /swap/bnb/knc-to-usdt vs /swap/bnb/usdt-to-knc has same content
       * => add canonical link that specify which is main page, => /swap/bnb/knc-to-usdt
       */}
      <SEOSwap canonicalUrl={canonicalUrl} />
      <TutorialSwap />
      <TokenWarningModal
        isOpen={isShowModalImportToken}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <PageWrapper>
        <Banner />
        <TopTrendingSoonTokensInCurrentNetwork />
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <ColumnCenter gap="sm">
              <RowBetween>
                <Tabs activeTab={activeTab} />

                <HeaderRightMenu activeTab={activeTab} setActiveTab={setActiveTab} />
              </RowBetween>
              <RowBetween>
                <Text fontSize={12} color={theme.subText}>
                  {isLimitPage ? (
                    <Trans>Buy or sell any token at a specific price</Trans>
                  ) : (
                    <Trans>Buy or sell any token instantly at the best price</Trans>
                  )}
                </Text>
              </RowBetween>
            </ColumnCenter>

            {isDegenMode && isShowDegenBanner && (
              <DegenBanner>
                <Text fontSize={12} fontWeight={400} color={theme.text}>
                  <Trans>You have turned on Degen Mode. Be cautious</Trans>
                </Text>
                <CloseIcon size={14} onClick={() => setShowDegenBanner(false)} />
              </DegenBanner>
            )}

            {!isSolana && (
              <RowBetween>
                <PairSuggestion
                  ref={refSuggestPair}
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  setShowModalImportToken={setShowingPairSuggestionImport}
                />
              </RowBetween>
            )}

            <AppBodyWrapped data-highlight={shouldHighlightSwapBox} id={TutorialIds.SWAP_FORM}>
              <PopulatedSwapForm
                routeSummary={routeSummary}
                setRouteSummary={setRouteSummary}
                goToSettingsView={() => setActiveTab(TAB.SETTINGS)}
                hidden={activeTab !== TAB.SWAP}
              />

              {activeTab === TAB.INFO && (
                <TokenInfoTab currencies={isSwapPage ? currencies : currenciesLimit} onBack={onBackToSwapTab} />
              )}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isLimitOrder={isLimitPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickGasPriceTracker={() => setActiveTab(TAB.GAS_PRICE_TRACKER)}
                />
              )}
              {activeTab === TAB.GAS_PRICE_TRACKER && (
                <GasPriceTrackerPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && (
                <LimitOrder
                  isSelectCurrencyManual={isSelectCurrencyManually}
                  setIsSelectCurrencyManual={setIsSelectCurrencyManually}
                  refreshListOrder={refreshListOrder}
                />
              )}
            </AppBodyWrapped>
          </SwapFormWrapper>

          {(isShowLiveChart || isShowTradeRoutes || shouldRenderTokenInfo || isLimitPage) && (
            <InfoComponentsWrapper>
              {isShowLiveChart && (
                <LiveChartWrapper>
                  <Suspense
                    fallback={
                      <Skeleton
                        height="100%"
                        baseColor={theme.background}
                        highlightColor={theme.buttonGray}
                        borderRadius="1rem"
                      />
                    }
                  >
                    <LiveChart currencies={isSwapPage ? currencies : currenciesLimit} />
                  </Suspense>
                </LiveChartWrapper>
              )}
              {isShowTradeRoutes && isSwapPage && (
                <RoutesWrapper isOpenChart={isShowLiveChart}>
                  <Flex flexDirection="column" width="100%">
                    <Flex alignItems={'center'}>
                      <RoutingIconWrapper />
                      <Text fontSize={20} fontWeight={500} color={theme.subText}>
                        <Trans>Your trade route</Trans>
                      </Text>
                    </Flex>
                    <Suspense
                      fallback={
                        <Skeleton
                          height="100px"
                          baseColor={theme.background}
                          highlightColor={theme.buttonGray}
                          borderRadius="1rem"
                        />
                      }
                    >
                      <TradeRouting
                        tradeComposition={tradeRouteComposition}
                        currencyIn={currencyIn}
                        currencyOut={currencyOut}
                        inputAmount={routeSummary?.parsedAmountIn}
                        outputAmount={routeSummary?.parsedAmountOut}
                      />
                    </Suspense>
                  </Flex>
                </RoutesWrapper>
              )}
              {isLimitPage && <ListLimitOrder ref={refListLimitOrder} />}
              {shouldRenderTokenInfo && <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} />}
            </InfoComponentsWrapper>
          )}
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
      </PageWrapper>
    </>
  )
}
