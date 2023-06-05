import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, TraceEvent } from '@uniswap/analytics'
import {
  BrowserEvent,
  InterfaceElementName,
  InterfaceEventName,
  InterfacePageName,
  InterfaceSectionName,
  SwapEventName,
} from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import Loader from 'components/Icons/LoadingSpinner'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import PriceImpactWarning from 'components/swap/PriceImpactWarning'
import SwapDetailsDropdown, { BorrowDetailsDropdown } from 'components/swap/SwapDetailsDropdown'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { useToggleWalletDrawer } from 'components/WalletDropdown'
import Widget from 'components/Widget'
import { isSupportedChain } from 'constants/chains'
import { useSwapWidgetEnabled } from 'featureFlags/flags/swapWidget'
import useENSAddress from 'hooks/useENSAddress'
import usePermit2Allowance, { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { useAddBorrowPositionCallback, useAddLeveragePositionCallback, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import JSBI from 'jsbi'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactNode } from 'react'
import { ArrowDown, Info } from 'react-feather'
import { useNavigate, useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import { InterfaceTrade, LeverageTradeState } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'
import invariant from 'tiny-invariant'
// import { currencyAmountToPreciseFloat, formatTransactionAmount } from 'utils/formatNumbers'
import { currencyAmountToPreciseFloat, formatDollarAmount, formatTransactionAmount } from 'utils/formatNumbers'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { GrayCard, LightCard } from '../../components/Card'
import { AutoColumn, Column } from '../../components/Column'
import SwapCurrencyInputPanel from '../../components/CurrencyInputPanel/SwapCurrencyInputPanel'
import LeveragedOutputPanel from '../../components/CurrencyInputPanel/leveragedOutputPanel'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal, { BorrowConfirmModal, LeverageConfirmModal } from '../../components/swap/ConfirmSwapModal'
import { ArrowWrapper, PageWrapper, SwapCallbackError, SwapWrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency, useDefaultActiveTokens, useToken } from '../../hooks/Tokens'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import useWrapCallback, { WrapErrorText, WrapType } from '../../hooks/useWrapCallback'
import { ActiveSwapTab, Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedLeverageCreationInfo,
  useDerivedSwapInfo,
  useBestPoolAddress,
  useSwapActionHandlers,
  useSwapState,
  useBestPool,
  useDerivedBorrowCreationInfo,
} from '../../state/swap/hooks'
import { useAddUserToken, useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, ThemedText } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { computeRealizedPriceImpact, warningSeverity } from '../../utils/prices'
import { supportedChainId } from '../../utils/supportedChainId'
import Slider from "../../components/Slider"
import { ResponsiveHeaderText, SmallMaxButton } from '../RemoveLiquidity/styled'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
// import LeveragePositionsList from 'components/LeveragedPositionsList'
import { Chain, TokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import ChartSection, { PairChartSection } from 'components/Tokens/TokenDetails/ChartSection'
import TokenDetailsSkeleton, {
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { pageTimePeriodAtom } from 'pages/TokenDetails'
import { useAtom } from 'jotai'
import { CHAIN_ID_TO_BACKEND_NAME, toHistoryDuration } from 'graphql/data/util'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { BORROW_MANAGER_FACTORY_ADDRESSES, feth, fusdc, GlOBAL_STORAGE_ADDRESS, LEVERAGE_MANAGER_FACTORY_ADDRESSES, PS_ROUTER, V3_CORE_FACTORY_ADDRESSES } from 'constants/addresses'
import { ethers } from 'ethers'
import GlobalStorageData from "../../perpspotContracts/GlobalStorage.json"
import LeverageManagerData from "../../perpspotContracts/LeverageManager.json"
import { useLeverageManagerAddress } from 'hooks/useGetLeverageManager'
import { usePoolAddressCache } from 'components/WalletDropdown/MiniPortfolio/Pools/cache'
import { computeBorrowManagerAddress, computeLeverageManagerAddress, computePoolAddress, usePool } from 'hooks/usePools'
import { useTokenAllowance } from 'hooks/useTokenAllowance'
import { ApprovalState, useApproval } from 'lib/hooks/useApproval'
import { useApproveCallback, useFaucetCallback } from 'hooks/useApproveCallback'
import { BigNumber as BN } from "bignumber.js";
import { useLimitlessPositions } from 'hooks/useV3Positions'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Input as NumericalInput } from 'components/NumericalInput'
import useDebounce from 'hooks/useDebounce'
import { ONE_HOUR_SECONDS, TimeWindow } from './intervals'
import { usePoolPriceData } from 'graphql/limitlessGraph/poolPriceData'
import dayjs from 'dayjs'
import CandleChart from 'components/CandleChart'
import LeveragePositionsTable from 'components/LeveragePositionTable/TokenTable'
import { PoolDataSection } from 'components/ExchangeChart'
import _ from 'lodash'
import { FakeTokens } from "constants/fake-tokens"
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { TabContent } from 'components/Tabs'
import BorrowPositionsTable from "components/BorrowPositionTable/TokenTable"


const Hr = styled.hr`
  background-color: ${({ theme }) => theme.backgroundOutline};
  width: 100%;
  border: none;
  height: 0.5px;
`

const StyledNumericalInput = styled(NumericalInput)`
  width: 100px;
  text-align:left;
  padding: 10px;
`

const StyledBorrowNumericalInput = styled(NumericalInput)`
  width: 120px;
  text-align:left;
  padding: 10px;
`

const ArrowContainer = styled.div`
  display: inline-block;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
`

const LeverageInputSection = styled(ResponsiveHeaderText)`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding-right: 14px;
`

const SwapSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  padding: 16px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;

  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.backgroundModule};
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`

const MainSwapContainer = styled(RowBetween)`
  align-items: flex-start;
`

const InputLeverageSection = styled(SwapSection)`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`

const InputSection = styled(SwapSection) <{ leverage: boolean }>`
  border-bottom-left-radius: ${({ leverage }) => leverage && '0'};
  border-bottom-right-radius: ${({ leverage }) => leverage && '0'};
`

const OutputSwapSection = styled(SwapSection) <{ showDetailsDropdown: boolean }>`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundSurface}`};
  // border-bottom-left-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  // border-bottom-right-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
`
const LeverageGaugeSection = styled(SwapSection) <{ showDetailsDropdown: boolean }>`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundSurface}`};
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  // border-bottom-left-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  // border-bottom-right-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
`

const DetailsSwapSection = styled(SwapSection)`
  padding: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`
export const MonoSpace = styled.span`
  font-variant-numeric: tabular-nums;
`
const ChartContainer = styled(AutoColumn)`
  margin-right: 20px;
`

const PositionsContainer = styled.div`
  margin-right: 20px;
  margin-top: 15px;
`

const StatsContainer = styled.div`
  margin-top: 20px;
  margin-right: 20px;
`

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: center;
  width:95%;
`



// background-color: ${({ theme }) => theme.backgroundSurface};
const LeveragePositionsWrapper = styled.main`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 4px;
  margin-left: 20px;
  margin-right:20px;
  border-radius: 16px;
  width:100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`

export function getIsValidSwapQuote(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return !!swapInputError && !!trade && (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING)
}

function largerPercentValue(a?: Percent, b?: Percent) {
  if (a && b) {
    return a.greaterThan(b) ? a : b
  } else if (a) {
    return a
  } else if (b) {
    return b
  }
  return undefined
}



const TRADE_STRING = 'SwapRouter';

export default function Swap({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [newSwapQuoteNeedsLogging, setNewSwapQuoteNeedsLogging] = useState(true)
  const [fetchingSwapQuoteStartTime, setFetchingSwapQuoteStartTime] = useState<Date | undefined>()
  const swapWidgetEnabled = useSwapWidgetEnabled()

  // HACK
  // const addToken = useAddUserToken()
  const fETH = useToken(feth)
  const fUSDC = useToken(fusdc)

  // useEffect(() => {
  //   if (fETH && fUSDC) {
  //     if (nonce === 0 && chainId === 80001) {
  //       nonce = 1
  //       addToken(fUSDC as Token)
  //       addToken(fETH as Token)
  //     }
  //   }
  // }, [chainId, account])

  // console.log("loadedUrlParams", loadedUrlParams)
  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId),
    useCurrency(loadedUrlParams?.[Field.OUTPUT]?.currencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useDefaultActiveTokens()

  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo()

  const [inputCurrency, outputCurrency] = useMemo(() => {
    return [currencies[Field.INPUT], currencies[Field.OUTPUT]]
  }, [currencies])
  const pool = useBestPool(currencies.INPUT ?? undefined, currencies.OUTPUT ?? undefined);

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletDrawer = useToggleWalletDrawer()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()
  // swap state
  const { independentField,
    typedValue,
    recipient,
    leverageFactor,
    hideClosedLeveragePositions,
    leverage,
    leverageManagerAddress,
    activeTab,
    ltv,
    borrowManagerAddress
  } = useSwapState()

  // console.log("tradeState", tradeState)
  // console.log("trade", trade)
  // console.log("allowedSlippage", allowedSlippage)
  // console.log("currenciesswap", currencies)

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
          [Field.INPUT]: parsedAmount,
          [Field.OUTPUT]: parsedAmount,
        }
        : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
        },
    [currencies, independentField, parsedAmount, showWrap, trade]
  )
  
  const [approveInputAmount, approveOutputAmount] = useMemo(() => {
    if (inputCurrency 
      && parsedAmounts[Field.INPUT] 
      && outputCurrency 
      && pool?.token0Price 
      && pool?.token1Price 
      && ltv && ltv !== ""
      ) {
      const inputIsToken0 = inputCurrency.wrapped.sortsBefore(outputCurrency.wrapped)
      const price = inputIsToken0 ? pool.token0Price.toFixed(18) : pool.token1Price.toFixed(18)
      return [
        CurrencyAmount.fromRawAmount(
          inputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).multipliedBy(1.002).shiftedBy(18).toFixed(0)
        ),
        CurrencyAmount.fromRawAmount(
          outputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).times(ltv ?? "0").times(price).shiftedBy(18).toFixed(0)
        )
      ]
    }
    else {
      return [undefined, undefined]
    }
  }, [inputCurrency, parsedAmounts[Field.INPUT], ltv, pool, outputCurrency])

  const [leverageApprovalState, approveLeverageManager] = useApproveCallback(
    approveInputAmount,
    leverageManagerAddress ?? undefined
  )

  const {
    trade: leverageTrade,
    inputError,
    allowedSlippage: leverageAllowedSlippage,
    contractError
  } = useDerivedLeverageCreationInfo({ allowance: leverageApprovalState })

  const [borrowInputApprovalState, approveInputBorrowManager] = useApproveCallback(approveInputAmount, borrowManagerAddress ?? undefined)
  const [borrowOutputApprovalState, approveOutputBorrowManager] = useApproveCallback(approveOutputAmount, borrowManagerAddress ?? undefined)
  const {
    trade: borrowTrade,
    inputError: borrowInputError,
    allowedSlippage: borrowAllowedSlippage,
    contractError: borrowContractError
  } = useDerivedBorrowCreationInfo({
    allowance: {
      input: borrowInputApprovalState,
      output: borrowOutputApprovalState
    }
  })

  const fiatValueInput = useUSDPrice(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDPrice(parsedAmounts[Field.OUTPUT])

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState],
    [trade, tradeState]
  )

  const [borrowRouteNotFound, borrowRouteIsLoading] = useMemo(
    () => [borrowTrade.state === TradeState.NO_ROUTE_FOUND, borrowTrade.state === TradeState.LOADING]
    , [borrowTrade])

  const [lmtRouteNotFound, lmtRouteIsLoading] = useMemo(
    () => [leverageTrade.state === LeverageTradeState.NO_ROUTE_FOUND, leverageTrade.state === LeverageTradeState.LOADING]
    , [leverageTrade])

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const stablecoinPriceImpact = useMemo(
    () =>
      routeIsSyncing || !trade
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient, onLeverageFactorChange, onHideClosedLeveragePositions, onLeverageChange, onLeverageManagerAddress, onLTVChange, onBorrowManagerAddress } = useSwapActionHandlers()
  
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    if (fETH && fUSDC && nonce === 0 && chainId && account) {
      onCurrencySelection(Field.INPUT, fUSDC)
      onCurrencySelection(Field.OUTPUT, fETH)
      setNonce(1)
    }
  }, [chainId, account, nonce])
  
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const lmtIsValid = !inputError

  const borrowIsValid = !borrowInputError

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/swap/')
  }, [navigate])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash, showLeverageConfirm, showBorrowConfirm }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
    showLeverageConfirm: boolean
    showBorrowConfirm: boolean
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
    showLeverageConfirm: false,
    showBorrowConfirm: false
  })

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : formatTransactionAmount(currencyAmountToPreciseFloat(parsedAmounts[dependentField])),
    }),
    [currencies, dependentField, independentField, parsedAmounts, showWrap, typedValue]
  )

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])

  const allowance = usePermit2Allowance(
    maximumAmountIn ??
    (parsedAmounts[Field.INPUT]?.currency.isToken
      ? (parsedAmounts[Field.INPUT] as CurrencyAmount<Token>)
      : undefined),
    // isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined
    isSupportedChain(chainId) ? PS_ROUTER : undefined
  )

  let poolAddress = useBestPoolAddress(currencies[Field.INPUT] ?? undefined, currencies[Field.OUTPUT] ?? undefined)

  useEffect(() => {
    // declare the data fetching function
    if (pool && account && provider) {
      onLeverageManagerAddress(computeLeverageManagerAddress(
        {
          factoryAddress: LEVERAGE_MANAGER_FACTORY_ADDRESSES[chainId ?? 80001],
          tokenA: pool.token0.address,
          tokenB: pool.token1.address,
          fee: pool.fee
        }
      ))
      onBorrowManagerAddress(computeBorrowManagerAddress(
        {
          factoryAddress: BORROW_MANAGER_FACTORY_ADDRESSES[chainId ?? 80001],
          tokenA: pool.token0.address,
          tokenB: pool.token1.address,
          fee: pool.fee
        }))
    }
  }, [poolAddress, account, trade, currencies, account, provider])

  const isApprovalLoading = allowance.state === AllowanceState.REQUIRED && allowance.isApprovalLoading
  const [isAllowancePending, setIsAllowancePending] = useState(false)
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setIsAllowancePending(true)
    try {
      await allowance.approveAndPermit()
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmountIn?.currency.symbol,
        token_address: maximumAmountIn?.currency.address,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsAllowancePending(false)
    }
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol])

  const inputToken = (currencies?.INPUT?.isToken ? (currencies?.INPUT as Token) : undefined)
  const outputToken = (currencies?.OUTPUT?.isToken ? (currencies?.OUTPUT as Token) : undefined)

  const faucetin = useFaucetCallback(inputToken, account)
  const faucetout = useFaucetCallback(outputToken, account)

  const [showInputFaucet, showOutputFaucet] = useMemo(() => {
    const inputResult = _.find(FakeTokens, (token: Token) => {
      return token.address === inputToken?.address
    })
    const outputResult = _.find(FakeTokens, (token: Token) => {
      return token.address === outputToken?.address
    })
    return [inputResult, outputResult]
  }, [inputToken, outputToken]);

  const faucetIn = useCallback(async () => {
    try {
      faucetin()
    } catch (err) {
      console.log('err', err)
    }

    // loadedInputCurrency, loadedOutputCurrency
  }, [currencies])

  const faucetOut = useCallback(async () => {
    try {
      faucetout()
    } catch (err) {
      console.log('err', err)
    }

  }, [currencies])

  const updateLeverageAllowance = useCallback(async () => {
    try {
      await approveLeverageManager()
    } catch (err) {
      console.log("approveLeverageManager err: ", err)
    }
  }, [leverageManagerAddress, parsedAmounts[Field.INPUT], approveLeverageManager])

  const updateInputBorrowAllowance = useCallback(async () => {
    try {
      await approveInputBorrowManager()
    } catch (err) {
      console.log("approveBorrowManager err: ", err)
    }
  }, [borrowManagerAddress, parsedAmounts[Field.INPUT], approveInputBorrowManager])

  const updateOutputBorrowAllowance = useCallback(async () => {
    try {
      await approveOutputBorrowManager()
    } catch (err) {
      console.log("approveBorrowManager err: ", err)
    }
  }, [borrowManagerAddress, parsedAmounts[Field.INPUT], approveOutputBorrowManager])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )

  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))
  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput, fiatValueTradeOutput])

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback(
    trade,
    swapFiatValues,
    allowedSlippage,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )
  // const inputIsToken0 = useMemo(() => {
  //   if (currencies && currencies[Field.INPUT] && currencies[Field.OUTPUT]) {
  //     return currencies[Field.INPUT]?.wrapped.sortsBefore(currencies[Field.OUTPUT]?.wrapped)
  //   }
  // }, [currencies])

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined, showLeverageConfirm: false, showBorrowConfirm: false })
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash, showLeverageConfirm: false, showBorrowConfirm: false })
        sendEvent({
          category: 'Swap',
          action: 'transaction hash',
          label: hash,
        })
        sendEvent({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
                ? 'Swap w/o Send + recipient'
                : 'Swap w/ Send',
          label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
            '/'
          ),
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
          showLeverageConfirm: false,
          showBorrowConfirm: false
        })
      })
  }, [
    swapCallback,
    stablecoinPriceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    trade?.inputAmount?.currency?.symbol,
    trade?.outputAmount?.currency?.symbol,
  ])

  // console.log("leverageAllowedSlippage: ", leverageAllowedSlippage.toFixed(6))
  const { callback: leverageCallback } = useAddLeveragePositionCallback(
    leverageManagerAddress ?? undefined,
    trade,
    leverageAllowedSlippage,
    leverageFactor ?? undefined,
  )

  const { callback: borrowCallback } = useAddBorrowPositionCallback(
    borrowManagerAddress ?? undefined,
    borrowAllowedSlippage,
    ltv ?? undefined,
    parsedAmount,
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
    borrowTrade
  )

  // errors
  const [swapQuoteReceivedDate, setSwapQuoteReceivedDate] = useState<Date | undefined>()
  // warnings on the greater of fiat value price impact and execution price impact
  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [stablecoinPriceImpact, trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash, showLeverageConfirm: false, showBorrowConfirm: false })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm, showLeverageConfirm: false, showBorrowConfirm: false })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    sendEvent({
      category: 'Swap',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const handleAddBorrowPosition = useCallback(() => {
    if (!borrowCallback) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
      showLeverageConfirm,
      showBorrowConfirm
    })
    borrowCallback().then((hash: any) => {
      setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash, showLeverageConfirm, showBorrowConfirm: false })
    })
      .catch((error: any) => {
        console.log("borrowCreationError: ", error)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: "Failed creation",//error.message,
          txHash: undefined,
          showLeverageConfirm,
          showBorrowConfirm: false
        })
      })
  }, [
    borrowCallback
  ])

  // poolAddress: string,
  // trade: Trade<Currency, Currency, TradeType> | undefined,  
  // allowedSlippage: Percent, // in bips
  // leverageFactor: string
  const handleLeverageCreation = useCallback(() => {
    if (!leverageCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined, showLeverageConfirm, showBorrowConfirm: false })
    leverageCallback().then((hash: any) => {
      setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash, showLeverageConfirm, showBorrowConfirm: false })
      sendEvent({
        category: 'Swap',
        action: 'transaction hash',
        label: hash,
      })
      sendEvent({
        category: 'Swap',
        action:
          recipient === null
            ? 'Swap w/o Send'
            : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
        label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
          '/'
        ),
      })
    })
      .catch((error: any) => {
        console.log("leverageCreationError: ", error)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: "Failed creation",//error.message,
          txHash: undefined,
          showLeverageConfirm,
          showBorrowConfirm
        })
      })
  }, [
    leverageCallback, leverageTrade, showLeverageConfirm, showBorrowConfirm
  ])

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  const showPriceImpactWarning = largerPriceImpact && priceImpactSeverity > 3

  const [sliderLeverageFactor, setSliderLeverageFactor] = useDebouncedChangeHandler(leverageFactor ?? "1", onLeverageFactorChange)
  // const [isTrade, setIsTrade] = useState(true); 

  const { state } = useLocation() as any;
  if (state) {
    // console.log('state', state)
    const { currency0, currency1 } = state

    useEffect(() => {
      handleInputSelect(currency0)
      handleOutputSelect(currency1)

    }, [currency0, currency1])
  }

  // Handle time based logging events and event properties.
  useEffect(() => {
    const now = new Date()
    // If a trade exists, and we need to log the receipt of this new swap quote:
    if (newSwapQuoteNeedsLogging && !!trade) {
      // Set the current datetime as the time of receipt of latest swap quote.
      setSwapQuoteReceivedDate(now)
      // Log swap quote.
      sendAnalyticsEvent(
        SwapEventName.SWAP_QUOTE_RECEIVED,
        formatSwapQuoteReceivedEventProperties(trade, trade.gasUseEstimateUSD ?? undefined, fetchingSwapQuoteStartTime)
      )
      // Latest swap quote has just been logged, so we don't need to log the current trade anymore
      // unless user inputs change again and a new trade is in the process of being generated.
      setNewSwapQuoteNeedsLogging(false)
      // New quote is not being fetched, so set start time of quote fetch to undefined.
      setFetchingSwapQuoteStartTime(undefined)
    }
    // If another swap quote is being loaded based on changed user inputs:
    if (routeIsLoading) {
      setNewSwapQuoteNeedsLogging(true)
      if (!fetchingSwapQuoteStartTime) setFetchingSwapQuoteStartTime(now)
    }
  }, [
    newSwapQuoteNeedsLogging,
    routeIsSyncing,
    routeIsLoading,
    fetchingSwapQuoteStartTime,
    trade,
    setSwapQuoteReceivedDate,
  ])

  const showDetailsDropdown = Boolean(
    !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing)
  )

  const { loading: limitlessPositionsLoading, positions: limitlessPositions } = useLimitlessPositions(account)

  const leveragePositions = limitlessPositions ?
    _.filter(limitlessPositions, (position) => (!position.isBorrow)) : []
  const borrowPositions = limitlessPositions ?
    _.filter(limitlessPositions, (position) => (position.isBorrow)) : []
  // console.log("leverageTrade: ", leverageTrade)
  // console.log("leverageTrade:", leverageTrade, lmtRouteNotFound, poolAddress, leverageManagerAddress, limitlessPositions)

  const [debouncedLeverageFactor, onDebouncedLeverageFactor] = useDebouncedChangeHandler(leverageFactor ?? "1", onLeverageFactorChange);

  // usePool(currencies.INPUT ?? undefined, currencies.OUTPUT ?? undefined, FeeAmount.LOW)

  // part of borrow integration

  const [debouncedLTV, debouncedSetLTV] = useDebouncedChangeHandler(ltv ?? "", onLTVChange);

  // console.log("loggingSwap: ", typedValue, formattedAmounts[Field.INPUT], leverageFactor)
  const showBorrowInputApproval = borrowInputApprovalState !== ApprovalState.APPROVED
  const showBorrowOutputApproval = borrowOutputApprovalState !== ApprovalState.APPROVED

  // console.log("borrowPositions: ", borrowPositions)

  return (
    <Trace page={InterfacePageName.SWAP_PAGE} shouldLogImpression>
      <>
        <TokenSafetyModal
          isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
          tokenAddress={importTokensNotInDefault[0]?.address}
          secondTokenAddress={importTokensNotInDefault[1]?.address}
          onContinue={handleConfirmTokenWarning}
          onCancel={handleDismissTokenWarning}
          showCancel={true}
        />
        <PageWrapper>
          {swapWidgetEnabled ? (
            <Widget
              defaultTokens={{
                [Field.INPUT]: loadedInputCurrency ?? undefined,
                [Field.OUTPUT]: loadedOutputCurrency ?? undefined,
              }}
              width="100%"
            />
          ) : (
            <MainSwapContainer>
              <LeftContainer>
                <StatsContainer>
                  <TokenInfoContainer data-testid="token-info-container">
                    <TokenNameCell>
                      {inputCurrency && outputCurrency && <DoubleCurrencyLogo currency0={inputCurrency as Currency} currency1={outputCurrency as Currency} size={40} margin />}
                      {inputCurrency && outputCurrency
                        ? <ThemedText.LargeHeader>{(outputCurrency.symbol)}/{(inputCurrency.symbol)}</ThemedText.LargeHeader>
                        : <ThemedText.LargeHeader>Pair not found</ThemedText.LargeHeader>}
                      {
                        showInputFaucet && (
                          <SmallMaxButton onClick={() => faucetIn()} width="10%">
                            <Trans>Faucet {inputCurrency?.symbol}</Trans>
                          </SmallMaxButton>
                        )
                      }
                      {
                        showOutputFaucet && (
                          <SmallMaxButton onClick={() => faucetOut()} width="10%">
                            <Trans>Faucet {outputCurrency?.symbol}</Trans>
                          </SmallMaxButton>
                        )
                      }
                    </TokenNameCell>
                  </TokenInfoContainer>
                  <PoolDataSection
                    chainId={chainId ?? 80001}
                    token0={pool?.token0}
                    token1={pool?.token1}
                    fee={pool?.fee}
                  />
                </StatsContainer>
                <Hr />
                <PositionsContainer>
                  <ThemedText.MediumHeader>Leverage Positions</ThemedText.MediumHeader>
                  <LeveragePositionsTable positions={leveragePositions} loading={limitlessPositionsLoading} />
                </PositionsContainer>
                <PositionsContainer>
                  <ThemedText.MediumHeader>Borrow Positions</ThemedText.MediumHeader>
                  <BorrowPositionsTable positions={borrowPositions} loading={limitlessPositionsLoading} />
                </PositionsContainer>
              </LeftContainer>

              <SwapWrapper chainId={chainId} className={className} id="swap-page">
                <SwapHeader allowedSlippage={allowedSlippage} activeTab={activeTab} />
                {leverage ? (
                  <LeverageConfirmModal
                    isOpen={showLeverageConfirm}
                    trade={trade}
                    originalTrade={tradeToConfirm}
                    onAcceptChanges={handleAcceptChanges}
                    attemptingTxn={attemptingTxn}
                    txHash={txHash}
                    recipient={recipient}
                    allowedSlippage={allowedSlippage}
                    onConfirm={handleLeverageCreation}
                    swapErrorMessage={swapErrorMessage}
                    onDismiss={handleConfirmDismiss}
                    swapQuoteReceivedDate={swapQuoteReceivedDate}
                    fiatValueInput={fiatValueTradeInput}
                    fiatValueOutput={fiatValueTradeOutput}
                    leverageFactor={leverageFactor ?? "1"}
                    leverageTrade={leverageTrade}
                  />
                ) : (
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
                    swapQuoteReceivedDate={swapQuoteReceivedDate}
                    fiatValueInput={fiatValueTradeInput}
                    fiatValueOutput={fiatValueTradeOutput}
                  />
                )}
                <BorrowConfirmModal
                  borrowTrade={borrowTrade}
                  isOpen={showBorrowConfirm}
                  attemptingTxn={attemptingTxn}
                  txHash={txHash}
                  recipient={recipient}
                  allowedSlippage={borrowAllowedSlippage}
                  onConfirm={handleAddBorrowPosition}
                  onDismiss={handleConfirmDismiss}
                  errorMessage={undefined}
                />
                <TabContent id={ActiveSwapTab.TRADE} activeTab={activeTab}>
                  <div style={{ display: 'relative' }}>
                    <InputSection leverage={leverage}>
                      <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
                        <SwapCurrencyInputPanel
                          label={
                            independentField === Field.OUTPUT && !showWrap ? (
                              <Trans>From (at most)</Trans>
                            ) : (
                              <Trans>From</Trans>
                            )
                          }
                          value={formattedAmounts[Field.INPUT]}
                          showMaxButton={showMaxButton}
                          currency={currencies[Field.INPUT] ?? null}
                          onUserInput={handleTypeInput}
                          onMax={handleMaxInput}
                          fiatValue={fiatValueInput}
                          onCurrencySelect={handleInputSelect}
                          otherCurrency={currencies[Field.OUTPUT]}
                          showCommonBases={true}
                          id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
                          loading={independentField === Field.OUTPUT && routeIsSyncing}
                          isInput={true}
                        />
                      </Trace>
                    </InputSection>
                    {leverage && <InputLeverageSection>
                      <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
                        <LeveragedOutputPanel
                          label={
                            independentField === Field.OUTPUT && !showWrap ? (
                              <Trans>From (at most)</Trans>
                            ) : (
                              <Trans>From</Trans>
                            )
                          }
                          value={
                            parsedAmount && leverageFactor ? String(Number(parsedAmount.toExact()) * Number(leverageFactor)) : ""
                          }
                          showMaxButton={showMaxButton}
                          currency={currencies[Field.INPUT] ?? null}
                          onUserInput={handleTypeInput}
                          onMax={handleMaxInput}
                          fiatValue={fiatValueInput}
                          onCurrencySelect={handleInputSelect}
                          otherCurrency={currencies[Field.OUTPUT]}
                          showCommonBases={true}
                          id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
                          loading={independentField === Field.OUTPUT && routeIsSyncing}
                          disabled={true}
                          parsedAmount={parsedAmount}
                        />
                      </Trace>
                    </InputLeverageSection>}
                    <ArrowWrapper clickable={isSupportedChain(chainId)}>
                      <TraceEvent
                        events={[BrowserEvent.onClick]}
                        name={SwapEventName.SWAP_TOKENS_REVERSED}
                        element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
                      >
                        <ArrowContainer
                          onClick={() => {
                            onSwitchTokens(leverage)
                          }}
                          color={theme.textPrimary}
                        >
                          <ArrowDown
                            size="16"
                            color={
                              currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.textPrimary : theme.textTertiary
                            }
                          />
                        </ArrowContainer>
                      </TraceEvent>
                    </ArrowWrapper>
                  </div>
                  <div>
                    <div>
                      <OutputSwapSection showDetailsDropdown={showDetailsDropdown}>
                        <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
                          <SwapCurrencyInputPanel
                            value={
                              (leverageApprovalState === ApprovalState.NOT_APPROVED) ?
                                "-"
                                :
                                !leverage ? formattedAmounts[Field.OUTPUT] :
                                  leverageTrade?.expectedOutput ?
                                    formatNumber(leverageTrade?.expectedOutput) : "-"
                            }
                            onUserInput={handleTypeOutput}
                            label={
                              independentField === Field.INPUT && !showWrap ? (
                                <Trans>To (at least)</Trans>
                              ) : (
                                <Trans>To</Trans>
                              )
                            }
                            showMaxButton={false}
                            hideBalance={false}
                            fiatValue={fiatValueOutput}
                            priceImpact={stablecoinPriceImpact}
                            currency={currencies[Field.OUTPUT] ?? null}
                            onCurrencySelect={handleOutputSelect}
                            otherCurrency={currencies[Field.INPUT]}
                            showCommonBases={true}
                            id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                            loading={independentField === Field.INPUT && routeIsSyncing}
                            isInput={false}
                            isLevered={leverage}
                            disabled={leverage}
                          />
                        </Trace>

                        {recipient !== null && !showWrap ? (
                          <>
                            <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                              <ArrowWrapper clickable={false}>
                                <ArrowDown size="16" color={theme.textSecondary} />
                              </ArrowWrapper>
                              <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                                <Trans>- Remove recipient</Trans>
                              </LinkStyledButton>
                            </AutoRow>
                            <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                          </>
                        ) : null}
                      </OutputSwapSection>
                      <LeverageGaugeSection showDetailsDropdown={(!inputError && leverage) || (!leverage && showDetailsDropdown)} >
                        <LightCard>
                          <AutoColumn gap="md">
                            <RowBetween>
                              <ThemedText.DeprecatedMain fontWeight={400}>
                                <Trans>Leverage</Trans>
                              </ThemedText.DeprecatedMain>
                              <Checkbox hovered={false} checked={leverage} onClick={() => {
                                onLeverageChange(!leverage)
                              }}>
                              </Checkbox>
                            </RowBetween>
                            {leverage && (
                              <>
                                <RowBetween>

                                  <LeverageInputSection>
                                    <StyledNumericalInput
                                      className="token-amount-input"
                                      value={debouncedLeverageFactor ?? ""}
                                      placeholder="1"
                                      onUserInput={(str: string) => {
                                        if (str === "") {
                                          onDebouncedLeverageFactor("")
                                        } else if (new BN(str).isGreaterThan(new BN("1000"))) {
                                          return
                                        } else if (new BN(str).dp() as number > 1) {
                                          onDebouncedLeverageFactor(String(new BN(str).decimalPlaces(1, BN.ROUND_DOWN)))
                                        } else {
                                          onDebouncedLeverageFactor(str)
                                        }
                                      }}
                                      disabled={false}
                                    />
                                  </LeverageInputSection>
                                  <AutoRow gap="4px" justify="flex-end">
                                    <SmallMaxButton onClick={() => onLeverageFactorChange("10")} width="20%">
                                      <Trans>10</Trans>
                                    </SmallMaxButton>
                                    <SmallMaxButton onClick={() => onLeverageFactorChange("100")} width="20%">
                                      <Trans>100</Trans>
                                    </SmallMaxButton>
                                    <SmallMaxButton onClick={() => onLeverageFactorChange("1000")} width="20%">
                                      <Trans>1000</Trans>
                                    </SmallMaxButton>
                                  </AutoRow>

                                </RowBetween>
                                <Slider
                                  value={sliderLeverageFactor === "" ? 1.0 : parseFloat(sliderLeverageFactor)}
                                  onChange={(val) => setSliderLeverageFactor(val.toString())}
                                  min={1.0}
                                  max={1000.0}
                                  step={1}
                                  float={true}
                                />
                              </>
                            )}
                          </AutoColumn>
                        </LightCard>
                      </LeverageGaugeSection>
                      <DetailsSwapSection>
                        <SwapDetailsDropdown
                          trade={trade}
                          syncing={routeIsSyncing}
                          loading={routeIsLoading}
                          allowedSlippage={allowedSlippage}
                          leverageTrade={leverageTrade}
                        />
                      </DetailsSwapSection>

                    </div>
                    {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
                    <div>
                      {!leverage && (swapIsUnsupported ? (
                        <ButtonPrimary disabled={true}>
                          <ThemedText.DeprecatedMain mb="4px">
                            <Trans>Unsupported Asset</Trans>
                          </ThemedText.DeprecatedMain>
                        </ButtonPrimary>
                      ) : !account ? (
                        <TraceEvent
                          events={[BrowserEvent.onClick]}
                          name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                          properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                          element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                        >
                          <ButtonLight onClick={toggleWalletDrawer} fontWeight={600}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        </TraceEvent>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap} fontWeight={600}>
                          {wrapInputError ? (
                            <WrapErrorText wrapInputError={wrapInputError} />
                          ) : wrapType === WrapType.WRAP ? (
                            <Trans>Wrap</Trans>
                          ) : wrapType === WrapType.UNWRAP ? (
                            <Trans>Unwrap</Trans>
                          ) : null}
                        </ButtonPrimary>
                      ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
                        <GrayCard style={{ textAlign: 'center' }}>
                          <ThemedText.DeprecatedMain mb="4px">
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </ThemedText.DeprecatedMain>
                        </GrayCard>
                      ) : isValid && allowance.state === AllowanceState.REQUIRED ? (
                        <ButtonPrimary
                          onClick={updateAllowance}
                          disabled={isAllowancePending || isApprovalLoading}
                          style={{ gap: 14 }}
                        >
                          {isAllowancePending ? (
                            <>
                              <Loader size="20px" />
                              <Trans>Approve in your wallet</Trans>
                            </>
                          ) : isApprovalLoading ? (
                            <>
                              <Loader size="20px" />
                              <Trans>Approval pending</Trans>
                            </>
                          ) : (
                            <>
                              <div style={{ height: 20 }}>
                                <MouseoverTooltip
                                  text={
                                    <Trans>
                                      Permission is required for Uniswap to swap each token. This will expire after one
                                      month for your security.
                                    </Trans>
                                  }
                                >
                                  <Info size={20} />
                                </MouseoverTooltip>
                              </div>
                              <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
                            </>
                          )}
                        </ButtonPrimary>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            if (isExpertMode) {
                              handleSwap()
                            } else {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined,
                                showLeverageConfirm: false,
                                showBorrowConfirm: false
                              })
                            }
                          }}
                          id="swap-button"
                          disabled={
                            !isValid ||
                            routeIsSyncing ||
                            routeIsLoading ||
                            priceImpactTooHigh ||
                            allowance.state !== AllowanceState.ALLOWED
                          }
                          error={isValid && priceImpactSeverity > 2 && allowance.state === AllowanceState.ALLOWED}
                        >
                          <Text fontSize={20} fontWeight={600}>
                            {swapInputError ? (
                              swapInputError
                            ) : routeIsSyncing || routeIsLoading ? (
                              <Trans>Swap</Trans>
                            ) : priceImpactTooHigh ? (
                              <Trans>Price Impact Too High</Trans>
                            ) : priceImpactSeverity > 2 ? (
                              <Trans>Swap Anyway</Trans>
                            ) : (
                              <Trans>Swap</Trans>
                            )}
                          </Text>
                        </ButtonError>
                      ))}

                      {leverage && (swapIsUnsupported ? (
                        <ButtonPrimary disabled={true}>
                          <ThemedText.DeprecatedMain mb="4px">
                            <Trans>Unsupported Asset</Trans>
                          </ThemedText.DeprecatedMain>
                        </ButtonPrimary>
                      ) : !account ? (
                        <TraceEvent
                          events={[BrowserEvent.onClick]}
                          name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                          properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                          element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                        >
                          <ButtonLight onClick={toggleWalletDrawer} fontWeight={600}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        </TraceEvent>
                      ) : ((routeNotFound || lmtRouteNotFound) && userHasSpecifiedInputOutput && !lmtRouteIsLoading ? (
                        <GrayCard style={{ textAlign: 'center' }}>
                          <ThemedText.DeprecatedMain mb="4px">
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </ThemedText.DeprecatedMain>
                        </GrayCard>
                      ) : lmtIsValid && leverageApprovalState !== ApprovalState.APPROVED ? (
                        <ButtonPrimary
                          onClick={updateLeverageAllowance}
                          style={{ gap: 14 }}
                          disabled={leverageApprovalState === ApprovalState.PENDING}
                        >
                          {leverageApprovalState === ApprovalState.PENDING ? (
                            <>
                              <Loader size="20px" />
                              <Trans>Approval pending</Trans>
                            </>
                          ) : (
                            <>
                              <div style={{ height: 20 }}>
                                <MouseoverTooltip
                                  text={
                                    <Trans>
                                      Permission is required for Uniswap to swap each token. This will expire after one
                                      month for your security.
                                    </Trans>
                                  }
                                >
                                  <Info size={20} />
                                </MouseoverTooltip>
                              </div>
                              <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
                            </>
                          )}
                        </ButtonPrimary>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: false,
                              txHash: undefined,
                              showLeverageConfirm: true,
                              showBorrowConfirm: false
                            })
                          }}
                          id="leverage-button"
                          disabled={
                            !!inputError || !!contractError ||
                            priceImpactTooHigh
                          }
                        >
                          <Text fontSize={20} fontWeight={600}>
                            {inputError ? (
                              inputError
                            ) : contractError ? (
                              contractError
                            ) : routeIsSyncing || routeIsLoading ? (
                              <Trans>Leverage</Trans>
                            ) : priceImpactTooHigh ? (
                              <Trans>Price Impact Too High</Trans>
                            ) : priceImpactSeverity > 2 ? (
                              <Trans>Leverage Anyway</Trans>
                            ) : (
                              <Trans>Leverage</Trans>
                            )}
                          </Text>
                        </ButtonError>
                      )
                      )
                      )}
                      {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </div>
                  </div>
                </TabContent>

                <TabContent id={ActiveSwapTab.BORROW} activeTab={activeTab}>
                  <div style={{ display: 'relative' }}>
                    <InputSection leverage={!leverage}>
                      <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
                        <SwapCurrencyInputPanel
                          label={
                            <Trans>Collateral Amount</Trans>
                          }
                          value={formattedAmounts[Field.INPUT]}
                          showMaxButton={showMaxButton}
                          currency={currencies[Field.INPUT] ?? null}
                          onUserInput={handleTypeInput}
                          onMax={handleMaxInput}
                          fiatValue={fiatValueInput}
                          onCurrencySelect={handleInputSelect}
                          otherCurrency={currencies[Field.OUTPUT]}
                          showCommonBases={true}
                          isTrade={false}
                          id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
                          loading={independentField === Field.OUTPUT && routeIsSyncing}
                          isInput={true}
                        />
                      </Trace>
                    </InputSection>
                    <ArrowWrapper clickable={isSupportedChain(chainId)}>
                      <TraceEvent
                        events={[BrowserEvent.onClick]}
                        name={SwapEventName.SWAP_TOKENS_REVERSED}
                        element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
                      >
                        <ArrowContainer
                          onClick={() => {
                            onSwitchTokens(true)
                          }}
                          color={theme.textPrimary}
                        >
                          <ArrowDown
                            size="16"
                            color={
                              currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.textPrimary : theme.textTertiary
                            }
                          />
                        </ArrowContainer>
                      </TraceEvent>
                    </ArrowWrapper>
                  </div>
                  <div>
                    <div>
                      <OutputSwapSection showDetailsDropdown={showDetailsDropdown}>
                        <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
                          <SwapCurrencyInputPanel
                            value={
                              (leverageApprovalState === ApprovalState.NOT_APPROVED) ?
                                "-"
                                :
                                !leverage ? formattedAmounts[Field.OUTPUT] :
                                  leverageTrade?.expectedOutput ?
                                    formatNumber(leverageTrade?.expectedOutput) : "-"
                            }
                            onUserInput={handleTypeOutput}
                            label={
                              <Trans>To</Trans>
                            }
                            showMaxButton={false}
                            hideBalance={false}
                            fiatValue={fiatValueOutput}
                            priceImpact={stablecoinPriceImpact}
                            currency={currencies[Field.OUTPUT] ?? null}
                            onCurrencySelect={handleOutputSelect}
                            otherCurrency={currencies[Field.INPUT]}
                            showCommonBases={true}
                            id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                            loading={independentField === Field.INPUT && routeIsSyncing}
                            isInput={false}
                            isLevered={leverage}
                            disabled={leverage}
                            isTrade={false}
                          />
                        </Trace>

                        {recipient !== null && !showWrap ? (
                          <>
                            <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                              <ArrowWrapper clickable={false}>
                                <ArrowDown size="16" color={theme.textSecondary} />
                              </ArrowWrapper>
                              <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                                <Trans>- Remove recipient</Trans>
                              </LinkStyledButton>
                            </AutoRow>
                            <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                          </>
                        ) : null}
                      </OutputSwapSection>
                      <LeverageGaugeSection showDetailsDropdown={(!inputError && leverage) || (!leverage && showDetailsDropdown)} >
                        <LightCard>
                          <AutoColumn gap="md">
                            <RowBetween>
                              <ThemedText.DeprecatedMain fontWeight={400}>
                                <Trans>LTV (%)</Trans>
                              </ThemedText.DeprecatedMain>
                            </RowBetween>
                            {(
                              <>
                                <RowBetween>
                                  <LeverageInputSection>
                                    <StyledBorrowNumericalInput
                                      className="token-amount-input"
                                      value={debouncedLTV}
                                      placeholder="1"
                                      onUserInput={(str: string) => {
                                        if (str === "") {
                                          debouncedSetLTV("")
                                        } else if (new BN(str).isGreaterThan(new BN("100"))) {
                                          return
                                        } else if (new BN(str).dp() as number > 1) {
                                          debouncedSetLTV(String(new BN(str).decimalPlaces(2, BN.ROUND_DOWN)))
                                        } else {
                                          debouncedSetLTV(str)
                                        }
                                      }}
                                      disabled={false}
                                    />
                                  </LeverageInputSection>
                                  <AutoRow gap="4px" justify="flex-end">
                                    <SmallMaxButton onClick={() => debouncedSetLTV("10")} width="20%">
                                      <Trans>10%</Trans>
                                    </SmallMaxButton>
                                    <SmallMaxButton onClick={() => debouncedSetLTV("50")} width="20%">
                                      <Trans>50%</Trans>
                                    </SmallMaxButton>
                                    <SmallMaxButton onClick={() => debouncedSetLTV("99")} width="20%">
                                      <Trans>99%</Trans>
                                    </SmallMaxButton>
                                  </AutoRow>
                                </RowBetween>
                                <Slider
                                  value={debouncedLTV === "" ? 0 : parseFloat(debouncedLTV)}
                                  onChange={(val) => debouncedSetLTV(val.toString())}
                                  min={0.0}
                                  max={100.0}
                                  step={0.01}
                                  float={true}
                                />
                              </>
                            )}
                          </AutoColumn>
                        </LightCard>
                      </LeverageGaugeSection>
                      <DetailsSwapSection>
                        <BorrowDetailsDropdown
                          trade={borrowTrade}
                          tradeState={borrowTrade.state}
                          syncing={false}
                          loading={borrowRouteIsLoading}
                          allowedSlippage={borrowAllowedSlippage}
                        />
                      </DetailsSwapSection>

                    </div>
                    {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
                    <div>
                      {
                        swapIsUnsupported ? (
                          <ButtonPrimary disabled={true}>
                            <ThemedText.DeprecatedMain mb="4px">
                              <Trans>Unsupported Asset</Trans>
                            </ThemedText.DeprecatedMain>
                          </ButtonPrimary>
                        ) : !account ? (
                          <TraceEvent
                            events={[BrowserEvent.onClick]}
                            name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                            properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                            element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                          >
                            <ButtonLight onClick={toggleWalletDrawer} fontWeight={600}>
                              <Trans>Connect Wallet</Trans>
                            </ButtonLight>
                          </TraceEvent>
                        ) : ((routeNotFound || borrowRouteNotFound) && userHasSpecifiedInputOutput && !lmtRouteIsLoading ? (
                          <GrayCard style={{ textAlign: 'center' }}>
                            <ThemedText.DeprecatedMain mb="4px">
                              <Trans>Insufficient liquidity for this trade.</Trans>
                            </ThemedText.DeprecatedMain>
                          </GrayCard>
                        ) : borrowIsValid && (
                          borrowInputApprovalState !== ApprovalState.APPROVED || borrowOutputApprovalState !== ApprovalState.APPROVED
                        ) ? (
                          <RowBetween>
                            {showBorrowInputApproval && 
                            <ButtonPrimary
                              onClick={updateInputBorrowAllowance}
                              style={{ gap: 14 }}
                              width={showBorrowOutputApproval ? '48%' : '100%'}
                              disabled={borrowInputApprovalState === ApprovalState.PENDING}
                            >
                              {borrowInputApprovalState === ApprovalState.PENDING ? (
                                <>
                                  <Loader size="20px" />
                                  <Trans>Approval pending</Trans>
                                </>
                              ) : (
                                <>
                                  {/* <div style={{ height: 20 }}>
                                    <MouseoverTooltip
                                      text={
                                        <Trans>
                                          Permission is required for Uniswap to swap each token. This will expire after one
                                          month for your security.
                                        </Trans>
                                      }
                                    >
                                      <Info size={20} />
                                    </MouseoverTooltip>
                                  </div> */}
                                  <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
                                </>
                              )}
                            </ButtonPrimary>}
                            {showBorrowOutputApproval &&
                            <ButtonPrimary
                              onClick={updateOutputBorrowAllowance}
                              style={{ gap: 14 }}
                              disabled={borrowOutputApprovalState === ApprovalState.PENDING}
                              width={showBorrowInputApproval ? '48%' : '100%'}
                            >
                              {borrowOutputApprovalState === ApprovalState.PENDING ? (
                                <>
                                  <Loader size="20px" />
                                  <Trans>Approval pending</Trans>
                                </>
                              ) : (
                                <>
                                  {/* <div style={{ height: 20 }}>
                                    <MouseoverTooltip
                                      text={
                                        <Trans>
                                          Permission is required for Uniswap to swap each token. This will expire after one
                                          month for your security.
                                        </Trans>
                                      }
                                    >
                                      <Info size={20} />
                                    </MouseoverTooltip>
                                  </div> */}
                                  <Trans>Approve use of {currencies[Field.OUTPUT]?.symbol}</Trans>
                                </>
                              )}
                            </ButtonPrimary>}
                          </RowBetween>
                        ) : (
                          <ButtonError
                            onClick={() => {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: false,
                                txHash: undefined,
                                showLeverageConfirm: false,
                                showBorrowConfirm: true,
                              })
                            }}
                            id="borrow-button"
                            disabled={
                              !!borrowInputError || !!borrowContractError ||
                              priceImpactTooHigh
                            }
                          >
                            <Text fontSize={20} fontWeight={600}>
                              {borrowInputError ? (
                                borrowInputError
                              ) : borrowContractError ? (
                                borrowContractError
                              ) : borrowRouteIsLoading ? (
                                <Trans>Borrow</Trans>
                              ) : priceImpactTooHigh ? (
                                <Trans>Price Impact Too High</Trans>
                              ) : priceImpactSeverity > 2 ? (
                                <Trans>Borrow Anyway</Trans>
                              ) : (
                                <Trans>Borrow</Trans>
                              )}
                            </Text>
                          </ButtonError>
                        ))}
                      {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </div>
                  </div>
                </TabContent>

              </SwapWrapper>
            </MainSwapContainer>
          )}
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
        {!swapIsUnsupported ? null : (
          <UnsupportedCurrencyFooter
            show={swapIsUnsupported}
            currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
          />
        )}
      </>
    </Trace>
  )
}