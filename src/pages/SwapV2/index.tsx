import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { stringify } from 'querystring'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useNavigate, useParams } from 'react-router-dom'
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
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import MobileTokenInfo from 'components/swapv2/MobileTokenInfo'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import RefreshButton from 'components/swapv2/RefreshButton'
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
  InfoComponentsWrapper,
  KyberTag,
  LiveChartWrapper,
  PageWrapper,
  PriceImpactHigh,
  RoutesWrapper,
  StyledActionButtonSwapForm,
  SwapCallbackError,
  SwapFormActions,
  SwapFormWrapper,
  Tab,
  TabContainer,
  TabWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import { AGGREGATOR_WAITING_TIME, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies, STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import usePrevious from 'hooks/usePrevious'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { BodyWrapper } from 'pages/AppBody'
import { ClickableText } from 'pages/Pool/styleds'
import { useToggleTransactionSettingsMenu, useWalletModalToggle } from 'state/application/hooks'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useEncodeSolana, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
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
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'
import { convertToSlug, getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList, convertSymbol } from 'utils/tokenInfo'

const LiveChart = lazy(() => import('components/LiveChart'))
const Routing = lazy(() => import('components/swapv2/Routing'))
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

export default function Swap() {
  const navigateFn = useNavigate()
  const { account, chainId, networkInfo, isSolana, isEVM } = useActiveWeb3React()
  const [rotate, setRotate] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString<{
    highlightBox: string
    outputCurrency: string
    inputCurrency: string
  }>()
  const allDexes = useAllDexes()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  useSyncNetworkParamWithStore()
  const [encodeSolana] = useEncodeSolana()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manualy or click rotate token.
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

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const {
    independentField,
    typedValue,
    recipient,
    feeConfig,
    [Field.INPUT]: INPUT,
    [Field.OUTPUT]: OUTPUT,
  } = useSwapState()

  const {
    onSwitchTokensV2,
    onCurrencySelection,
    onResetSelectCurrency,
    onUserInput,
    onChangeRecipient,
    onChangeTrade,
  } = useSwapActionHandlers()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    tradeComparer,
    onRefresh,
    loading: loadingAPI,
    isPairNotfound,
  } = useDerivedSwapInfoV2()

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

  const comparedDex = useMemo(
    () => allDexes?.find(dex => dex.id === tradeComparer?.comparedDex),
    [allDexes, tradeComparer],
  )
  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]
  const balanceIn: CurrencyAmount<Currency> | undefined = currencyBalances[Field.INPUT]
  const balanceOut: CurrencyAmount<Currency> | undefined = currencyBalances[Field.OUTPUT]

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade
  const isPriceImpactInvalid = !!trade?.priceImpact && trade?.priceImpact === -1
  const isPriceImpactHigh = !!trade?.priceImpact && trade?.priceImpact > 5
  const isPriceImpactVeryHigh = !!trade?.priceImpact && trade?.priceImpact > 15

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isExpertMode])

  useEffect(() => {
    // Save current trade to store
    onChangeTrade(trade)
  }, [trade, onChangeTrade])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

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
    setIsSelectCurrencyManually(true)
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

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade)

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
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [swapCallback, tradeToConfirm, showConfirm])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const tradeLoadedRef = useRef(0)
  useEffect(() => {
    tradeLoadedRef.current = Date.now()
  }, [trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })

    // when open modal, trade is locked from to be updated
    // if user open modal too long, trade is outdated
    // need to refresh data on close modal
    if (Date.now() - tradeLoadedRef.current > TIME_TO_REFRESH_SWAP_RATE * 1000) {
      onRefresh(false, AGGREGATOR_WAITING_TIME)
    }

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash, onRefresh])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, setSwapState, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection],
  )

  const handleMaxInput = useCallback(() => {
    onUserInput(Field.INPUT, maxAmountInput || '')
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    !isSolanaUnwrap && onUserInput(Field.INPUT, halfAmountInput || '')
  }, [isSolanaUnwrap, halfAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection],
  )

  const isLoading = loadingAPI || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput && !v2Trade)

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

  const changeNetwork = useChangeNetwork()
  const refIsCheckNetworkAutoSelect = useRef<boolean>(false) // has done check network
  const refIsImportUserToken = useRef<boolean>(false)

  const findToken = (keyword: string) => {
    const nativeToken = NativeCurrencies[chainId]
    if (keyword === getSymbolSlug(nativeToken)) {
      return nativeToken
    }
    return filterTokensWithExactKeyword(chainId, Object.values(defaultTokens), keyword)[0]
  }

  const navigate = useCallback(
    (url: string) => {
      // /swap/net/symA-to-symB?inputCurrency= addressC/symC &outputCurrency= addressD/symD
      const { inputCurrency, outputCurrency, ...newQs } = qs
      navigateFn(`${url}?${stringify(newQs)}`) // keep query params
    },
    [navigateFn, qs],
  )

  function findTokenPairFromUrl() {
    let { fromCurrency, toCurrency, network } = getUrlMatchParams()
    if (!fromCurrency || !network) return

    const compareNetwork = networkInfo.route

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

    const isAddress1 = isAddressString(chainId, fromCurrency)
    const isAddress2 = isAddressString(chainId, toCurrency)

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

    const findChainId = SUPPORTED_NETWORKS.find(chainId => NETWORKS_INFO[chainId].route === network)
    if (!findChainId) {
      return navigate('/swap')
    }
    if (findChainId !== chainId) {
      changeNetwork(
        findChainId,
        () => {
          refIsCheckNetworkAutoSelect.current = true
        },
        () => {
          navigate('/swap')
        },
      )
    } else {
      refIsCheckNetworkAutoSelect.current = true
    }
  }

  const syncUrl = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      const symbolIn = getSymbolSlug(currencyIn)
      const symbolOut = getSymbolSlug(currencyOut)
      if (symbolIn && symbolOut && chainId) {
        navigate(`/swap/${networkInfo.route}/${symbolIn}-to-${symbolOut}`)
      }
    },
    [navigate, networkInfo, chainId],
  )

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount: string) => {
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
    const isChangeNetwork = network !== networkInfo.route
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

  const initialTotalTokenDefault = useRef<number | null>(null)

  useEffect(() => {
    checkAutoSelectTokenFromUrl()
    initialTotalTokenDefault.current = Object.keys(defaultTokens).length // it will be equal with tokenImports.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoadedTokenDefault = account
    ? Object.keys(defaultTokens).length > tokenImports.length
    : initialTotalTokenDefault.current !== null && Object.keys(defaultTokens).length > initialTotalTokenDefault.current //

  useEffect(() => {
    /**
     * defaultTokens change only when:
     * - the first time get data
     * - change network
     * - import/remove token */
    if (refIsCheckNetworkAutoSelect.current && !refIsImportUserToken.current && isLoadedTokenDefault) {
      findTokenPairFromUrl()
    }
    refIsImportUserToken.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTokens, refIsCheckNetworkAutoSelect.current])

  useEffect(() => {
    if (isSelectCurrencyManually) syncUrl(currencyIn, currencyOut) // when we select token manual
  }, [currencyIn, currencyOut, isSelectCurrencyManually, syncUrl])

  // swap?inputCurrency=xxx&outputCurrency=yyy. xxx yyy not exist in chain => remove params => select default pair

  const checkParamsWrong = () => {
    if (isPairNotfound && !currencyIn && !currencyOut) {
      const newQuery = { ...qs }
      delete newQuery.inputCurrency
      delete newQuery.outputCurrency
      navigateFn(
        {
          search: stringify(newQuery),
        },
        { replace: true },
      )
    }
  }

  const refCheckParamWrong = useRef(checkParamsWrong)
  refCheckParamWrong.current = checkParamsWrong
  useEffect(() => {
    refCheckParamWrong.current()
  }, [chainId])

  useEffect(() => {
    if (isExpertMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
  }, [isExpertMode, mixpanelHandler])

  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const isStableCoinSwap =
    INPUT?.currencyId &&
    OUTPUT?.currencyId &&
    chainId &&
    STABLE_COINS_ADDRESS[chainId].includes(INPUT?.currencyId) &&
    STABLE_COINS_ADDRESS[chainId].includes(OUTPUT?.currencyId)

  const rawSlippageRef = useRef(rawSlippage)
  rawSlippageRef.current = rawSlippage

  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setRawSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setRawSlippage(50)
    }
  }, [isStableCoinSwap, setRawSlippage])

  const shareUrl = useMemo(() => {
    return `${window.location.origin}/swap/${networkInfo.route}${
      currencyIn && currencyOut
        ? `?${stringify({
            inputCurrency: currencyId(currencyIn, chainId),
            outputCurrency: currencyId(currencyOut, chainId),
          })}`
        : ''
    }`
  }, [networkInfo.route, currencyIn, currencyOut, chainId])

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList

  const isShowModalImportToken =
    isLoadedTokenDefault && importTokensNotInDefault.length > 0 && (!dismissTokenWarning || showingPairSuggestionImport)

  const isLargeSwap = useMemo((): boolean => {
    return false // todo: not used for current release yet
    // if these line is 6 months old, feel free to delete it
    /*
    if (!isSolana) return false
    if (!trade) return false
    try {
      return trade.swaps.some(swapPath =>
        swapPath.some(swap => {
          // return swapAmountInUsd / swap.reserveUsd > 1%
          //  =  (swap.swapAmount / 10**decimal * tokenIn.price) / swap.reserveUsd > 1%
          //  = swap.swapAmount * tokenIn.price / (10**decimal * swap.reserveUsd) > 1%
          //  = 10**decimal * swap.reserveUsd / (swap.swapAmount * tokenIn.price) < 100
          const tokenIn = trade.tokens[swap.tokenIn]
          if (!tokenIn || !tokenIn.decimals) return false

          return JSBI.lessThan(
            JSBI.divide(
              JSBI.multiply(
                JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(tokenIn.decimals + 20)),
                JSBI.BigInt(swap.reserveUsd * 10 ** 20),
              ),
              JSBI.multiply(JSBI.BigInt(tokenIn.price * 10 ** 20), JSBI.BigInt(Number(swap.swapAmount) * 10 ** 20)),
            ),
            JSBI.BigInt(100),
          )
        }),
      )
    } catch (e) {
      return false
    }
  }, [isSolana, trade])
  */
  }, [])

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
        {chainId !== ChainId.ETHW && <TopTrendingSoonTokensInCurrentNetwork />}
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <RowBetween mb={'16px'}>
              <TabContainer>
                <TabWrapper>
                  <Tab onClick={() => setActiveTab(TAB.SWAP)} isActive={activeTab === TAB.SWAP}>
                    <Text fontSize={20} fontWeight={500}>
                      <Trans>Swap</Trans>
                    </Text>
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
                {chainId !== ChainId.ETHW && (
                  <MobileTokenInfo
                    currencies={currencies}
                    onClick={() => setActiveTab(prev => (prev === TAB.INFO ? TAB.SWAP : TAB.INFO))}
                  />
                )}
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
                    text={!isExpertMode ? <Trans>Settings</Trans> : <Trans>Advanced mode is on!</Trans>}
                    placement="top"
                    width="fit-content"
                  >
                    <span id={TutorialIds.BUTTON_SETTING_SWAP_FORM}>
                      <TransactionSettingsIcon fill={isExpertMode ? theme.warning : theme.subText} />
                    </span>
                  </MouseoverTooltip>
                </StyledActionButtonSwapForm>
                {/* <TransactionSettings isShowDisplaySettings /> */}
              </SwapFormActions>
            </RowBetween>

            {chainId !== ChainId.ETHW && !isSolana && (
              <RowBetween mb={'16px'}>
                <PairSuggestion
                  ref={refSuggestPair}
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  setShowModalImportToken={setShowingPairSuggestionImport}
                />
              </RowBetween>
            )}

            <AppBodyWrapped data-highlight={shouldHighlightSwapBox} id={TutorialIds.SWAP_FORM}>
              {activeTab === TAB.SWAP && (
                <>
                  <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
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
                        currency={currencyIn}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onHalf={isSolanaUnwrap ? null : handleHalfInput}
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
                        {tradeComparer?.tradeSaved?.usd && comparedDex && (
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
                                      {comparedDex.name}
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
                          onMax={null}
                          onHalf={null}
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

                      {isExpertMode && isEVM && !showWrap && (
                        <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
                      )}

                      {!showWrap && (
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

                    {chainId !== ChainId.ETHW && (
                      <TrendingSoonTokenBanner currencies={currencies} style={{ marginTop: '24px' }} />
                    )}

                    {isPriceImpactInvalid ? (
                      <PriceImpactHigh>
                        <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
                        <Trans>Unable to calculate Price Impact</Trans>
                        <InfoHelper text={t`Turn on Advanced Mode to trade`} color={theme.text} />
                      </PriceImpactHigh>
                    ) : (
                      isPriceImpactHigh && (
                        <PriceImpactHigh veryHigh={isPriceImpactVeryHigh}>
                          <AlertTriangle
                            color={isPriceImpactVeryHigh ? theme.red : theme.warning}
                            size={16}
                            style={{ marginRight: '10px' }}
                          />
                          {isPriceImpactVeryHigh ? (
                            <Trans>Price Impact is Very High</Trans>
                          ) : (
                            <Trans>Price Impact is High</Trans>
                          )}
                          <InfoHelper
                            text={
                              isExpertMode
                                ? t`You have turned on Advanced Mode from settings. Trades with high price impact can be executed`
                                : t`Turn on Advanced Mode from settings to execute trades with high price impact`
                            }
                            color={theme.text}
                          />
                        </PriceImpactHigh>
                      )
                    )}
                    {isLargeSwap && (
                      <PriceImpactHigh>
                        <AlertTriangle color={theme.warning} size={24} style={{ marginRight: '10px' }} />
                        <Trans>
                          Your transaction may not be successful. We recommend increasing the slippage for this trade
                        </Trans>
                      </PriceImpactHigh>
                    )}
                    <BottomGrouping>
                      {!account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? (
                              <Trans>Wrap</Trans>
                            ) : wrapType === WrapType.UNWRAP ? (
                              <Trans>Unwrap</Trans>
                            ) : null)}
                        </ButtonPrimary>
                      ) : noRoute && userHasSpecifiedInputOutput ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                          <TYPE.main>
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </TYPE.main>
                        </GreyCard>
                      ) : showApproveFlow ? (
                        <>
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
                                <Trans>Approved</Trans>
                              ) : (
                                <Trans>Approve ${currencyIn?.symbol}</Trans>
                              )}
                            </ButtonConfirmed>
                            <ButtonError
                              onClick={() => {
                                // TODO check this button, it will never run, is it?
                                // console.error('This will never be run')
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
                              disabled={!!swapInputError || approval !== ApprovalState.APPROVED}
                              backgroundColor={
                                isPriceImpactHigh || isPriceImpactInvalid
                                  ? isPriceImpactVeryHigh
                                    ? theme.red
                                    : theme.warning
                                  : undefined
                              }
                              color={isPriceImpactHigh || isPriceImpactInvalid ? theme.white : undefined}
                            >
                              <Text fontSize={16} fontWeight={500}>
                                {isPriceImpactHigh ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
                              </Text>
                            </ButtonError>
                          </RowBetween>
                          <Column style={{ marginTop: '1rem' }}>
                            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                          </Column>
                        </>
                      ) : isLoading ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                          <Text color={theme.subText} fontSize="14px">
                            <Dots>
                              <Trans>Calculating best route</Trans>
                            </Dots>
                          </Text>
                        </GreyCard>
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
                            !!swapInputError ||
                            !!swapCallbackError ||
                            approval !== ApprovalState.APPROVED ||
                            (!isExpertMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                            (isExpertMode && isSolana && !encodeSolana)
                          }
                          style={{
                            border: 'none',
                            ...(!(
                              !!swapInputError ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isExpertMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                              (isExpertMode && isSolana && !encodeSolana)
                            ) &&
                            (isPriceImpactHigh || isPriceImpactInvalid)
                              ? { background: isPriceImpactVeryHigh ? theme.red : theme.warning, color: theme.white }
                              : {}),
                          }}
                        >
                          <Text fontWeight={500}>
                            {swapInputError ? (
                              swapInputError
                            ) : approval !== ApprovalState.APPROVED ? (
                              <Dots>
                                <Trans>Checking allowance</Trans>
                              </Dots>
                            ) : isExpertMode && isSolana && !encodeSolana ? (
                              <Dots>
                                <Trans>Checking accounts</Trans>
                              </Dots>
                            ) : isPriceImpactHigh || isPriceImpactInvalid ? (
                              <Trans>Swap Anyway</Trans>
                            ) : (
                              <Trans>Swap</Trans>
                            )}
                          </Text>
                        </ButtonError>
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
                    <LiveChart onRotateClick={handleRotateClick} currencies={currencies} />
                  </Suspense>
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
                      <Routing trade={trade} currencies={currencies} formattedAmounts={formattedAmounts} />
                    </Suspense>
                  </Flex>
                </RoutesWrapper>
              )}
              {shouldRenderTokenInfo ? <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} /> : null}
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
