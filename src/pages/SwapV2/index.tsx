import { ChainId, Currency, CurrencyAmount, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { debounce } from 'lodash'
import { stringify } from 'qs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserView } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { RouteComponentProps, useParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ReactComponent as TutorialSvg } from 'assets/svg/play_circle_outline.svg'
import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import Banner from 'components/Banner'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card/index'
import Column from 'components/Column/index'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Swap as SwapIcon } from 'components/Icons'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import InfoHelper from 'components/InfoHelper'
import LiveChart from 'components/LiveChart'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import { SEOSwap } from 'components/SEO'
import { ShareButtonWithModal } from 'components/ShareModal'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'
import TopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import Tutorial, { TutorialType } from 'components/Tutorial'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import MobileLiveChart from 'components/swapv2/MobileLiveChart'
import MobileTokenInfo from 'components/swapv2/MobileTokenInfo'
import MobileTradeRoutes from 'components/swapv2/MobileTradeRoutes'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import RefreshButton from 'components/swapv2/RefreshButton'
import Routing from 'components/swapv2/Routing'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfo from 'components/swapv2/TokenInfo'
import TokenInfoV2 from 'components/swapv2/TokenInfoV2'
import TradePrice from 'components/swapv2/TradePrice'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import {
  ArrowWrapper,
  BottomGrouping,
  Container,
  Dots,
  KyberTag,
  LiveChartWrapper,
  PageWrapper,
  PriceImpactHigh,
  RoutesWrapper,
  StyledActionButtonSwapForm,
  StyledFlex,
  SwapCallbackError,
  SwapFormActions,
  Tab,
  TabContainer,
  TabWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import usePrevious from 'hooks/usePrevious'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { BodyWrapper } from 'pages/AppBody'
import { ClickableText } from 'pages/Pool/styleds'
import { useToggleTransactionSettingsMenu, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import {
  useExpertModeManager,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTradeRoutes,
  useUserAddedTokens,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum, isAddressString } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { currencyId } from 'utils/currencyId'
import { filterTokensWithExactKeyword } from 'utils/filtering'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { reportException } from 'utils/sentry'
import { convertToSlug, getNetworkSlug, getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList, convertSymbol } from 'utils/tokenInfo'

const TutorialIcon = styled(TutorialSvg)`
  width: 22px;
  height: 22px;
  path {
    fill: ${({ theme }) => theme.subText};
    stroke: ${({ theme }) => theme.subText};
  }
`

enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  GAS_PRICE_TRACKER = 'gas_price_tracker',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  // LIMIT = 'limit'
}

const SwapFormWrapper = styled.div`
  width: 100%;
  max-width: 425px;

  @media only screen and (min-width: 768px) {
    max-width: 404px;
  }
  @media only screen and (min-width: 1100px) {
    position: sticky;
    top: 16px;
  }
`

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

export const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: ${Z_INDEXS.SWAP_FORM};
  padding: 16px 16px 24px;
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

export default function Swap({ history }: RouteComponentProps) {
  const [rotate, setRotate] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const [isSelectCurencyMannual, setIsSelectCurencyMannual] = useState(false) // true when: select token input, output mannualy or click rotate token.
  // else select via url

  const [activeTab, setActiveTab] = useState<TAB>(TAB.SWAP)

  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency],
  )

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient, feeConfig } = useSwapState()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    tradeComparer,
    onRefresh,
    loading: loadingAPI,
  } = useDerivedSwapInfoV2()

  const currencyIn = currencies[Field.INPUT]
  const currencyOut = currencies[Field.OUTPUT]

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { onSwitchTokensV2, onCurrencySelection, onResetSelectCurrency, onUserInput, onChangeRecipient } =
    useSwapActionHandlers()

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isExpertMode])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    if (showingPairSuggestionImport) {
      setShowingPairSuggestionImport(false)
    } else {
      setDismissTokenWarning(true)
    }
  }, [showingPairSuggestionImport])

  const handleConfirmTokenWarning = useCallback(() => {
    handleDismissTokenWarning()
    if (showingPairSuggestionImport) {
      refSuggestPair.current?.onConfirmImportToken() // callback from children
    }
  }, [handleDismissTokenWarning, showingPairSuggestionImport])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const handleRotateClick = useCallback(() => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    setRotate(prev => !prev)
    onSwitchTokensV2()
    setIsSelectCurencyMannual(true)
  }, [onSwitchTokensV2])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade, recipient)

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        // Exclude Transaction rejected from sentry
        if (!error?.message?.includes('Transaction rejected')) reportException(error)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [tradeToConfirm, showConfirm, swapCallback])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      setIsSelectCurencyMannual(true)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection],
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    onUserInput(Field.INPUT, currencyBalances[Field.INPUT]?.divide(2).toExact() || '')
  }, [currencyBalances, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      setIsSelectCurencyMannual(true)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection],
  )

  const isLoading =
    loadingAPI ||
    ((!currencyBalances[Field.INPUT] || !currencyBalances[Field.OUTPUT]) && userHasSpecifiedInputOutput && !v2Trade)

  const { mixpanelHandler } = useMixpanel(trade, currencies)
  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED)
  }

  /** check url params format `/swap/network/x-to-y` and then auto select token input
   * - Flow: check network first and find token pairs (x vs y)
   */

  const params = useParams<{
    fromCurrency: string
    toCurrency: string
    network: string
  }>()

  const getUrlMatchParams = () => {
    const fromCurrency = (params.fromCurrency || '').toLowerCase()
    const toCurrency = (params.toCurrency || '').toLowerCase()
    const network: string = convertToSlug(params.network || '')
    return { fromCurrency, toCurrency, network }
  }

  const { changeNetwork } = useActiveNetwork()
  const refIsCheckNetworkAutoSelect = useRef<boolean>(false) // has done check network
  const refIsImportUserToken = useRef<boolean>(false)

  const findToken = (keyword: string) => {
    const nativeToken = nativeOnChain(chainId as ChainId)
    if (keyword === getSymbolSlug(nativeToken)) {
      return nativeToken
    }
    return filterTokensWithExactKeyword(Object.values(defaultTokens), keyword)[0]
  }

  const navigate = useCallback(
    (url: string) => {
      const newQs = { ...qs }
      // /swap/net/symA-to-symB?inputCurrency= addressC/symC &outputCurrency= addressD/symD
      delete newQs.outputCurrency
      delete newQs.inputCurrency
      delete newQs.networkId
      history.push(`${url}?${stringify(newQs)}`) // keep query params
    },
    [history, qs],
  )

  function findTokenPairFromUrl() {
    let { fromCurrency, toCurrency, network } = getUrlMatchParams()

    const compareNetwork = getNetworkSlug(chainId)

    if (compareNetwork && network !== compareNetwork) {
      // when select change network => force get new network
      network = compareNetwork
      navigate(`/swap/${network}/${fromCurrency}${toCurrency ? `-to-${toCurrency}` : ''}`)
    }

    const isSame = fromCurrency && fromCurrency === toCurrency
    if (!toCurrency || isSame) {
      // net/symbol
      const fromToken = findToken(fromCurrency)
      if (fromToken) {
        onCurrencySelection(Field.INPUT, fromToken)
        if (isSame) navigate(`/swap/${network}/${fromCurrency}`)
      } else navigate('/swap')
      return
    }

    const isAddress1 = isAddressString(fromCurrency)
    const isAddress2 = isAddressString(toCurrency)

    // net/add-to-add
    if (isAddress1 && isAddress2) {
      const fromToken = findToken(fromCurrency)
      const toToken = findToken(toCurrency)
      if (fromToken && toToken) {
        navigate(`/swap/${network}/${getSymbolSlug(fromToken)}-to-${getSymbolSlug(toToken)}`)
        onCurrencySelection(Field.INPUT, fromToken)
        onCurrencySelection(Field.OUTPUT, toToken)
      } else navigate('/swap')
      return
    }

    // sym-to-sym
    fromCurrency = convertSymbol(network, fromCurrency)
    toCurrency = convertSymbol(network, toCurrency)

    const fromToken = findToken(fromCurrency)
    const toToken = findToken(toCurrency)

    if (!toToken || !fromToken) {
      navigate('/swap')
      return
    }
    onCurrencySelection(Field.INPUT, fromToken)
    onCurrencySelection(Field.OUTPUT, toToken)
  }

  const checkAutoSelectTokenFromUrl = () => {
    // check case:  `/swap/net/sym-to-sym` or `/swap/net/sym` is valid
    const { fromCurrency, network } = getUrlMatchParams()
    if (!fromCurrency || !network) return

    const findChainId = SUPPORTED_NETWORKS.find(chainId => NETWORKS_INFO[chainId].route === network) || ChainId.MAINNET
    if (findChainId !== chainId) {
      changeNetwork(findChainId)
        .then(() => {
          refIsCheckNetworkAutoSelect.current = true
        })
        .catch(() => {
          navigate('/swap')
        })
    } else {
      refIsCheckNetworkAutoSelect.current = true
    }
  }

  const syncUrl = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      const symbolIn = getSymbolSlug(currencyIn)
      const symbolOut = getSymbolSlug(currencyOut)
      if (symbolIn && symbolOut && chainId) {
        navigate(`/swap/${getNetworkSlug(chainId)}/${symbolIn}-to-${symbolOut}`)
      }
    },
    [navigate, chainId],
  )

  const onSelectSuggestedPair = useCallback(
    (
      fromToken: NativeCurrency | Token | undefined | null,
      toToken: NativeCurrency | Token | undefined | null,
      amount: string,
    ) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection],
  )

  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports) || []

  useEffect(() => {
    const { network } = getUrlMatchParams()
    const compareNetwork = getNetworkSlug(chainId)
    const isChangeNetwork = compareNetwork !== network
    if (isChangeNetwork) return

    // when import/remove token
    const isRemoved = prevTokenImports?.length > tokenImports.length
    const addressIn = currencyIn?.wrapped?.address
    const addressOut = currencyOut?.wrapped?.address

    if (isRemoved) {
      // removed token => deselect input
      const tokenRemoved = prevTokenImports.filter(
        token => !tokenImports.find(token2 => token2.address === token.address),
      )
      tokenRemoved.forEach(({ address }: Token) => {
        if (address === addressIn || !currencyIn) {
          onResetSelectCurrency(Field.INPUT)
        }
        if (address === addressOut || !currencyOut) {
          onResetSelectCurrency(Field.OUTPUT)
        }
      })
    }
    // import token
    else if (tokenImports.find(({ address }: Token) => address === addressIn || address === addressOut)) {
      refIsImportUserToken.current = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenImports])

  useEffect(() => {
    /**
     * defaultTokens change only when:
     * - the first time get data
     * - change network
     * - import/remove token */
    if (refIsCheckNetworkAutoSelect.current && !refIsImportUserToken.current && Object.keys(defaultTokens).length) {
      findTokenPairFromUrl()
    }
    refIsImportUserToken.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTokens, refIsCheckNetworkAutoSelect.current])

  useEffect(() => {
    checkAutoSelectTokenFromUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isSelectCurencyMannual) syncUrl(currencyIn, currencyOut) // when we select token manual
  }, [currencyIn, currencyOut, isSelectCurencyMannual, syncUrl])

  const refLoadedCurrency = useRef<{
    currencyIn: Currency | null | undefined
    currencyOut: Currency | null | undefined
  }>({ currencyIn: null, currencyOut: null })

  useEffect(() => {
    refLoadedCurrency.current = { currencyIn: loadedInputCurrency, currencyOut: loadedOutputCurrency }
  }, [loadedInputCurrency, loadedOutputCurrency])

  const checkParamWrong = useCallback(() => {
    const { currencyIn, currencyOut } = refLoadedCurrency.current
    if (!currencyIn || !currencyOut) {
      const newQuery = { ...qs }
      if (!currencyIn) delete newQuery.inputCurrency
      if (!currencyOut) delete newQuery.outputCurrency
      history.replace({
        search: stringify(newQuery),
      })
    }
  }, [qs, history])

  // swap?inputCurrency=xxx&outputCurrency=yyy. xxx yyy not exist in chain => remove params => select default pair
  const checkParamWrongDebounce = useMemo(() => debounce(checkParamWrong, 300), [checkParamWrong])
  useEffect(() => {
    checkParamWrongDebounce()
  }, [chainId, checkParamWrongDebounce])

  useEffect(() => {
    if (isExpertMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpertMode])

  const shareUrl = useMemo(() => {
    return `${window.location.origin}/swap?networkId=${chainId}${
      currencyIn && currencyOut
        ? `&${stringify({
            inputCurrency: currencyId(currencyIn, chainId),
            outputCurrency: currencyId(currencyOut, chainId),
          })}`
        : ''
    }`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyIn, currencyOut, chainId, currencyId, window.location.origin])

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList

  const isShowModalImportToken =
    importTokensNotInDefault.length > 0 && (!dismissTokenWarning || showingPairSuggestionImport)

  return (
    <>
      {/**
       * /swap/bnb/knc-to-usdt vs /swap/bnb/usdt-to-knc has same content
       * => add canonical link that specify which is main page, => /swap/bnb/knc-to-usdt
       */}
      <SEOSwap canonicalUrl={canonicalUrl} />

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
          <StyledFlex justifyContent={'center'} alignItems="flex-start" flexWrap={'wrap'}>
            <SwapFormWrapper>
              <RowBetween mb={'16px'}>
                <TabContainer>
                  <TabWrapper>
                    <Tab onClick={() => setActiveTab(TAB.SWAP)} isActive={activeTab === TAB.SWAP}>
                      <Text fontSize={20} fontWeight={500}>{t`Swap`}</Text>
                    </Tab>
                  </TabWrapper>
                </TabContainer>

                <SwapFormActions>
                  <Tutorial
                    type={TutorialType.SWAP}
                    customIcon={
                      <StyledActionButtonSwapForm>
                        <TutorialIcon />
                      </StyledActionButtonSwapForm>
                    }
                  />
                  <MobileTokenInfo
                    currencies={currencies}
                    onClick={() => setActiveTab(prev => (prev === TAB.INFO ? TAB.SWAP : TAB.INFO))}
                  />
                  <ShareButtonWithModal
                    url={shareUrl}
                    onShared={() => {
                      mixpanelHandler(MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED)
                    }}
                  />
                  <StyledActionButtonSwapForm
                    active={activeTab === TAB.SETTINGS}
                    onClick={() => setActiveTab(prev => (prev === TAB.SETTINGS ? TAB.SWAP : TAB.SETTINGS))}
                    aria-label="Swap Settings"
                  >
                    <MouseoverTooltip
                      text={!isExpertMode ? t`Settings` : t`Advanced mode is on!`}
                      placement="top"
                      width="fit-content"
                    >
                      <TransactionSettingsIcon fill={isExpertMode ? theme.warning : theme.subText} />
                    </MouseoverTooltip>
                  </StyledActionButtonSwapForm>
                  {/* <TransactionSettings isShowDisplaySettings /> */}
                </SwapFormActions>
              </RowBetween>

              <RowBetween mb={'16px'}>
                <PairSuggestion
                  ref={refSuggestPair}
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  setShowModalImportToken={setShowingPairSuggestionImport}
                />
              </RowBetween>

              <AppBodyWrapped data-highlight={shouldHighlightSwapBox}>
                {activeTab === TAB.SWAP && (
                  <>
                    <Wrapper id="swap-page">
                      <ConfirmSwapModal
                        isOpen={showConfirm}
                        trade={trade}
                        originalTrade={tradeToConfirm}
                        onAcceptChanges={handleAcceptChanges}
                        attemptingTxn={attemptingTxn}
                        txHash={txHash}
                        recipient={recipient}
                        allowedSlippage={allowedSlippage}
                        onConfirm={handleSwap}
                        swapErrorMessage={swapErrorMessage}
                        onDismiss={handleConfirmDismiss}
                        tokenAddToMetaMask={currencyOut}
                      />

                      <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.INPUT]}
                          positionMax="top"
                          showMaxButton
                          currency={currencyIn}
                          onUserInput={handleTypeInput}
                          onMax={handleMaxInput}
                          onHalf={handleHalfInput}
                          onCurrencySelect={handleInputSelect}
                          otherCurrency={currencyOut}
                          id="swap-currency-input"
                          showCommonBases={true}
                          estimatedUsd={
                            trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined
                          }
                        />
                        <AutoRow justify="space-between">
                          <Flex alignItems="center">
                            {!showWrap && (
                              <>
                                <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
                                <TradePrice
                                  price={trade?.executionPrice}
                                  showInverted={showInverted}
                                  setShowInverted={setShowInverted}
                                />
                              </>
                            )}
                          </Flex>

                          <ArrowWrapper rotated={rotate} onClick={handleRotateClick}>
                            <SwapIcon size={24} color={theme.subText} />
                          </ArrowWrapper>
                        </AutoRow>
                        <Box sx={{ position: 'relative' }}>
                          {tradeComparer?.tradeSaved?.usd && (
                            <KyberTag>
                              <Trans>You save</Trans>{' '}
                              {formattedNum(tradeComparer.tradeSaved.usd, true) +
                                ` (${
                                  tradeComparer?.tradeSaved?.percent &&
                                  (tradeComparer.tradeSaved.percent < 0.01
                                    ? '<0.01'
                                    : tradeComparer.tradeSaved.percent.toFixed(2))
                                }%)`}
                              <InfoHelper
                                text={
                                  <Text>
                                    <Trans>
                                      The amount you save compared to{' '}
                                      <Text as="span" color={theme.warning}>
                                        {tradeComparer.comparedDex.name}
                                      </Text>
                                      .
                                    </Trans>{' '}
                                    <Trans>
                                      <Text color={theme.primary} fontWeight={500} as="span">
                                        KyberSwap
                                      </Text>{' '}
                                      gets you the best token rates
                                    </Trans>
                                  </Text>
                                }
                                size={14}
                                color={theme.apr}
                              />
                            </KyberTag>
                          )}

                          <CurrencyInputPanel
                            disabledInput
                            value={formattedAmounts[Field.OUTPUT]}
                            onUserInput={handleTypeOutput}
                            showMaxButton={false}
                            currency={currencyOut}
                            onCurrencySelect={handleOutputSelect}
                            otherCurrency={currencyIn}
                            id="swap-currency-output"
                            showCommonBases={true}
                            estimatedUsd={
                              trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined
                            }
                          />
                        </Box>

                        {isExpertMode && !showWrap && (
                          <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
                        )}

                        {!showWrap && allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                          <Flex
                            alignItems="center"
                            fontSize={12}
                            color={theme.subText}
                            onClick={toggleSettings}
                            width="fit-content"
                          >
                            <ClickableText color={theme.subText} fontWeight={500}>
                              <Trans>Max Slippage:</Trans>&nbsp;
                              {allowedSlippage / 100}%
                            </ClickableText>
                          </Flex>
                        )}
                      </Flex>

                      <TradeTypeSelection />

                      <TrendingSoonTokenBanner currencies={currencies} style={{ marginTop: '24px' }} />

                      {trade?.priceImpact === -1 ? (
                        <PriceImpactHigh>
                          <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
                          <Trans>Unable to calculate Price Impact</Trans>
                          <InfoHelper text="Turn on Advanced Mode to trade" color={theme.text} />
                        </PriceImpactHigh>
                      ) : (
                        !!trade?.priceImpact &&
                        trade.priceImpact > 5 && (
                          <PriceImpactHigh veryHigh={trade?.priceImpact > 15}>
                            <AlertTriangle
                              color={trade?.priceImpact > 15 ? theme.red : theme.warning}
                              size={16}
                              style={{ marginRight: '10px' }}
                            />
                            {trade?.priceImpact > 15 ? (
                              <>
                                <Trans>Price Impact is Very High</Trans>
                                <InfoHelper text="Turn on Advanced Mode for high slippage trades" color={theme.text} />
                              </>
                            ) : (
                              <Trans>Price Impact is High</Trans>
                            )}
                          </PriceImpactHigh>
                        )
                      )}

                      <BottomGrouping>
                        {!account ? (
                          <ButtonLight onClick={toggleWalletModal}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        ) : isLoading ? (
                          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                            <Text color={theme.subText} fontSize="14px">
                              <Dots>
                                <Trans>Calculating best route</Trans>
                              </Dots>
                            </Text>
                          </GreyCard>
                        ) : showWrap ? (
                          <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                            {wrapInputError ??
                              (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                          </ButtonPrimary>
                        ) : noRoute && userHasSpecifiedInputOutput ? (
                          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                            <TYPE.main>
                              <Trans>Insufficient liquidity for this trade.</Trans>
                            </TYPE.main>
                          </GreyCard>
                        ) : showApproveFlow ? (
                          <RowBetween>
                            <ButtonConfirmed
                              onClick={approveCallback}
                              disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                              width="48%"
                              altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                              confirmed={approval === ApprovalState.APPROVED}
                            >
                              {approval === ApprovalState.PENDING ? (
                                <AutoRow gap="6px" justify="center">
                                  <Trans>Approving</Trans> <Loader stroke="white" />
                                </AutoRow>
                              ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                                t`Approved`
                              ) : (
                                t`Approve ${currencyIn?.symbol}`
                              )}
                            </ButtonConfirmed>
                            <ButtonError
                              onClick={() => {
                                mixpanelSwapInit()
                                if (isExpertMode) {
                                  handleSwap()
                                } else {
                                  setSwapState({
                                    tradeToConfirm: trade,
                                    attemptingTxn: false,
                                    swapErrorMessage: undefined,
                                    showConfirm: true,
                                    txHash: undefined,
                                  })
                                }
                              }}
                              width="48%"
                              id="swap-button"
                              disabled={!isValid || approval !== ApprovalState.APPROVED}
                            >
                              <Text fontSize={16} fontWeight={500}>
                                {trade && trade.priceImpact > 5 ? t`Swap Anyway` : t`Swap`}
                              </Text>
                            </ButtonError>
                          </RowBetween>
                        ) : (
                          <ButtonError
                            onClick={() => {
                              mixpanelSwapInit()
                              if (isExpertMode) {
                                handleSwap()
                              } else {
                                setSwapState({
                                  tradeToConfirm: trade,
                                  attemptingTxn: false,
                                  swapErrorMessage: undefined,
                                  showConfirm: true,
                                  txHash: undefined,
                                })
                              }
                            }}
                            id="swap-button"
                            disabled={
                              !isValid ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isExpertMode && trade && (trade.priceImpact > 15 || trade.priceImpact === -1))
                            }
                            style={{
                              border: 'none',
                              ...(!(
                                !isValid ||
                                !!swapCallbackError ||
                                approval !== ApprovalState.APPROVED ||
                                (!isExpertMode && trade && (trade.priceImpact > 15 || trade.priceImpact === -1))
                              ) &&
                              trade &&
                              (trade.priceImpact > 5 || trade.priceImpact === -1)
                                ? { background: theme.red, color: theme.white }
                                : {}),
                            }}
                          >
                            <Text fontWeight={500}>
                              {swapInputError
                                ? swapInputError
                                : approval !== ApprovalState.APPROVED
                                ? t`Checking allowance...`
                                : trade && (trade.priceImpact > 5 || trade.priceImpact === -1)
                                ? t`Swap Anyway`
                                : t`Swap`}
                            </Text>
                          </ButtonError>
                        )}
                        {showApproveFlow && (
                          <Column style={{ marginTop: '1rem' }}>
                            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                          </Column>
                        )}
                        {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                      </BottomGrouping>
                    </Wrapper>
                  </>
                )}
                {activeTab === TAB.INFO && <TokenInfo currencies={currencies} onBack={() => setActiveTab(TAB.SWAP)} />}
                {activeTab === TAB.SETTINGS && (
                  <SettingsPanel
                    onBack={() => setActiveTab(TAB.SWAP)}
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
              </AppBodyWrapped>
              <AdvancedSwapDetailsDropdown trade={trade} feeConfig={feeConfig} />
            </SwapFormWrapper>

            {(isShowLiveChart || isShowTradeRoutes || shouldRenderTokenInfo) && (
              <Flex flexDirection="column">
                <BrowserView>
                  {isShowLiveChart && (
                    <LiveChartWrapper>
                      <LiveChart onRotateClick={handleRotateClick} currencies={currencies} />
                    </LiveChartWrapper>
                  )}
                  {isShowTradeRoutes && (
                    <RoutesWrapper isOpenChart={isShowLiveChart}>
                      <Flex flexDirection="column" width="100%">
                        <Flex alignItems={'center'}>
                          <RoutingIconWrapper />
                          <Text fontSize={20} fontWeight={500} color={theme.subText}>
                            <Trans>Your trade route</Trans>
                          </Text>
                        </Flex>
                        <Routing trade={trade} currencies={currencies} formattedAmounts={formattedAmounts} />
                      </Flex>
                    </RoutesWrapper>
                  )}
                </BrowserView>
                {shouldRenderTokenInfo ? <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} /> : null}
              </Flex>
            )}
          </StyledFlex>
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
      </PageWrapper>
      <MobileLiveChart handleRotateClick={handleRotateClick} currencies={currencies} />
      <MobileTradeRoutes trade={trade} formattedAmounts={formattedAmounts} currencies={currencies} />
    </>
  )
}
