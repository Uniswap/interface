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
import { Currency, CurrencyAmount, MaxUint256, Percent, Token, TradeType } from '@uniswap/sdk-core'
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
// import Widget from 'components/Widget'
import { isSupportedChain } from 'constants/chains'
// import { useSwapWidgetEnabled } from 'featureFlags/flags/swapWidget'
import useENSAddress from 'hooks/useENSAddress'
import usePermit2Allowance, { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { useAddBorrowPositionCallback, useAddLeveragePositionCallback, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import JSBI from 'jsbi'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
// import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
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
import TokenDetailsSkeleton, {
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { BORROW_MANAGER_FACTORY_ADDRESSES, LEVERAGE_MANAGER_FACTORY_ADDRESSES, SEPOLIA_ROUTER, MUMBAI_ROUTER, V3_CORE_FACTORY_ADDRESSES, ROUTER_ADDRESSES } from 'constants/addresses'
import { computeBorrowManagerAddress, computeLeverageManagerAddress, computePoolAddress, usePool } from 'hooks/usePools'
import { useTokenAllowance } from 'hooks/useTokenAllowance'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useApproveCallback, useFaucetCallback, useMaxApproveCallback } from 'hooks/useApproveCallback'
import { BigNumber as BN } from "bignumber.js";
import { useLimitlessPositionFromKeys, useLimitlessPositions } from 'hooks/useV3Positions'
import { Input as NumericalInput } from 'components/NumericalInput'
import LeveragePositionsTable from 'components/LeveragePositionTable/TokenTable'
import { PoolDataSection } from 'components/ExchangeChart'
// import _ from 'lodash'
// import { FakeTokens, FETH, FUSDC } from "constants/fake-tokens"
import { TabContent, TabNavItem } from 'components/Tabs'
import BorrowPositionsTable from "components/BorrowPositionTable/TokenTable"
import { WarningIcon } from 'components/TokenSafety/TokenSafetyIcon'

import BorrowTabContent from "./borrowModal"
import moment from 'moment'
import { formatNumber, NumberType } from '@uniswap/conedison/format'

const TradeTabContent = React.lazy(() => import('./swapModal'));

// const BorrowTabContent = React.lazy(() => import('./borrowModal'));


const Hr = styled.hr`
  background-color: ${({ theme }) => theme.backgroundOutline};
  width: 100%;
  border: none;
  height: 0.5px;
`

const TableHeader = styled(RowFixed)`
  flex-flow: row nowrap;
`

export const StyledNumericalInput = styled(NumericalInput)`
  width: 100px;
  text-align:left;
  padding: 10px;
`

export const StyledBorrowNumericalInput = styled(NumericalInput)`
  width: 120px;
  text-align:left;
  padding: 10px;
`

export const ArrowContainer = styled.div`
  display: inline-block;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
`

export const LeverageInputSection = styled(ResponsiveHeaderText)`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding-right: 14px;
`

export const SwapSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
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
    border: 1px solid ${({ theme }) => theme.backgroundSurface};
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`

const TabHeader = styled.div<{ active: boolean }>`
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  width: 200px;
  background: ${({active, theme}) => active ? theme.backgroundSurface : theme.backgroundBackdrop }
`

const MainSwapContainer = styled(RowBetween)`
  align-items: flex-start;
`

export const InputLeverageSection = styled(SwapSection)`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`

export const InputSection = styled(SwapSection) <{ leverage: boolean }>`
  border-bottom-left-radius: ${({ leverage }) => leverage && '0'};
  border-bottom-right-radius: ${({ leverage }) => leverage && '0'};
`

export const OutputSwapSection = styled(SwapSection) <{ showDetailsDropdown: boolean }>`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundSurface}`};
  // border-bottom-left-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  // border-bottom-right-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  border-bottom-left-radius: 10;
  border-bottom-right-radius:10;

`
export const LeverageGaugeSection = styled(SwapSection) <{ showDetailsDropdown: boolean }>`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundSurface}`};
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;

  // border-bottom-left-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
  // border-bottom-right-radius: ${({ showDetailsDropdown }) => showDetailsDropdown && '0'};
`

export const DetailsSwapSection = styled(SwapSection)`
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
  // background-color: ${({ theme }) => theme.backgroundSurface};
  max-width: 1200px;
  width: 100%;
  border-radius: 32px;
  padding: 12px;
  margin-left: auto

`

const StatsContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 32px;
  padding: 18px;
  max-width: 1200px;
  width: 100%;
  margin-top: 0px;
  margin-right: 20px;
  margin-left: auto
`

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: center;
  width:95%;
`

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
  // const swapWidgetEnabled = useSwapWidgetEnabled()

  const {
    onSwitchTokens, onCurrencySelection, onUserInput,
    onChangeRecipient, onLeverageFactorChange,
    onLeverageChange, onLeverageManagerAddress, onLTVChange, onBorrowManagerAddress,
    onPremiumChange
  } = useSwapActionHandlers()

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
  const {
    independentField,
    typedValue,
    recipient,
    leverageFactor,
    leverage,
    leverageManagerAddress,
    activeTab,
    ltv,
    borrowManagerAddress,
    premium
  } = useSwapState()

  const isBorrowTab = ActiveSwapTab.BORROW == activeTab


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

  const inputIsToken0 = outputCurrency?.wrapped ? inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped) : false;

  const [inputApprovalState, inputApprove] = useMaxApproveCallback(inputCurrency ? CurrencyAmount.fromRawAmount(inputCurrency, MaxUint256) : undefined, isBorrowTab ? borrowManagerAddress ?? undefined : leverageManagerAddress ?? undefined)
  const [outputApprovalState, outputApprove] = useMaxApproveCallback(outputCurrency ? CurrencyAmount.fromRawAmount(outputCurrency, MaxUint256) : undefined, isBorrowTab ? borrowManagerAddress ?? undefined : leverageManagerAddress ?? undefined)
  const [leverageApproveAmount, borrowInputApproveAmount, borrowOutputApproveAmount] = useMemo(() => {
    if (inputCurrency
      && parsedAmounts[Field.INPUT]
      && outputCurrency
      && premium
    ) {
      return [
        CurrencyAmount.fromRawAmount(
          inputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).plus(premium).shiftedBy(18).toFixed(0)
        ),
        CurrencyAmount.fromRawAmount(
          inputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).shiftedBy(18).toFixed(0)
        ),
        CurrencyAmount.fromRawAmount(
          outputCurrency,
          new BN(premium).shiftedBy(18).toFixed(0)
        )
      ]
    }
    else {
      return [undefined, undefined, undefined]
    }
  }, [inputCurrency, parsedAmounts[Field.INPUT], ltv, pool, outputCurrency, premium])

  const [leverageApprovalState, approveLeverageManager] = useApproveCallback(
    leverageApproveAmount,
    leverageManagerAddress ?? undefined
  )

  const {
    trade: leverageTrade,
    state: leverageState,
    inputError,
    allowedSlippage: leverageAllowedSlippage,
    contractError
  } = useDerivedLeverageCreationInfo()

  const [borrowInputApprovalState, approveInputBorrowManager] = useApproveCallback(borrowInputApproveAmount, borrowManagerAddress ?? undefined)
  const [borrowOutputApprovalState, approveOutputBorrowManager] = useApproveCallback(borrowOutputApproveAmount, borrowManagerAddress ?? undefined)

  const {
    trade: borrowTrade,
    state: borrowState,
    inputError: borrowInputError,
    allowedSlippage: borrowAllowedSlippage,
    contractError: borrowContractError
  } = useDerivedBorrowCreationInfo({
    allowance: {
      input: borrowInputApprovalState,
      output: borrowOutputApprovalState,
    }
  })

  const fiatValueInput = useUSDPrice(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDPrice(parsedAmounts[Field.OUTPUT])

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState],
    [trade, tradeState]
  )

  const [borrowRouteNotFound, borrowRouteIsLoading] = useMemo(
    () => [borrowState === TradeState.NO_ROUTE_FOUND, borrowState === TradeState.LOADING]
    , [borrowTrade])

  const [lmtRouteNotFound, lmtRouteIsLoading] = useMemo(
    () => [leverageState === LeverageTradeState.NO_ROUTE_FOUND, leverageState === LeverageTradeState.LOADING]
    , [leverageState])

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const stablecoinPriceImpact = useMemo(
    () =>
      routeIsSyncing || !trade
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const isValid = !swapInputError
  const lmtIsValid = !inputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // valid user input
  // const lmtIsValid = !inputError

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

  // console.log("valid borrow", borrowIsValid)

  // modal and loading
  // const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash, showLeverageConfirm, showBorrowConfirm }, setSwapState] = useState<{
  //   showConfirm: boolean
  //   tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
  //   attemptingTxn: boolean
  //   swapErrorMessage: string | undefined
  //   txHash: string | undefined
  //   showLeverageConfirm: boolean
  //   showBorrowConfirm: boolean
  // }>({
  //   showConfirm: false,
  //   tradeToConfirm: undefined,
  //   attemptingTxn: false,
  //   swapErrorMessage: undefined,
  //   txHash: undefined,
  //   showLeverageConfirm: false,
  //   showBorrowConfirm: false
  // })

  // const formattedAmounts = useMemo(
  //   () => ({
  //     [independentField]: typedValue,
  //     [dependentField]: showWrap
  //       ? parsedAmounts[independentField]?.toExact() ?? ''
  //       : formatTransactionAmount(currencyAmountToPreciseFloat(parsedAmounts[dependentField])),
  //   }),
  //   [currencies, dependentField, independentField, parsedAmounts, showWrap, typedValue]
  // )

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
    isSupportedChain(chainId) ? ROUTER_ADDRESSES[chainId] : undefined
  )

  let poolAddress = useBestPoolAddress(currencies[Field.INPUT] ?? undefined, currencies[Field.OUTPUT] ?? undefined)

  useEffect(() => {
    // declare the data fetching function
    if (pool && account && provider) {
      onLeverageManagerAddress(computeLeverageManagerAddress(
        {
          factoryAddress: LEVERAGE_MANAGER_FACTORY_ADDRESSES[chainId ?? 11155111],
          tokenA: inputCurrency?.wrapped.address ?? "",
          tokenB: outputCurrency?.wrapped.address ?? "",
          fee: pool.fee
        }
      ))
      onBorrowManagerAddress(computeBorrowManagerAddress(
        {
          factoryAddress: BORROW_MANAGER_FACTORY_ADDRESSES[chainId ?? 11155111],
          tokenA: inputCurrency?.wrapped.address ?? "",
          tokenB: outputCurrency?.wrapped.address ?? "",
          fee: pool.fee
        }))
    }
  }, [poolAddress, account, trade, currencies, account, provider])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )

  // const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))
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

  // errors
  const [swapQuoteReceivedDate, setSwapQuoteReceivedDate] = useState<Date | undefined>()
  // warnings on the greater of fiat value price impact and execution price impact

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )


  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )



  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  // const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  // const showPriceImpactWarning = largerPriceImpact && priceImpactSeverity > 3

  // const [sliderLeverageFactor, setSliderLeverageFactor] = useDebouncedChangeHandler(leverageFactor ?? "1", onLeverageFactorChange)
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

  const leveragePositions = useMemo(() => {
    const  now = moment()
    const timestamp = now.unix()

    return limitlessPositions ?
    limitlessPositions.filter((position) => {
      return !position.isBorrow 
    }) : []
  }, [limitlessPositionsLoading, limitlessPositions ])
  const borrowPositions = useMemo(() => {
    const  now = moment()
    const timestamp = now.unix()
    return limitlessPositions ?
    limitlessPositions.filter((position) => {
      return position.isBorrow 
    }) : []
  }, [limitlessPositionsLoading, limitlessPositions])

  const [activePositionTable, setActiveTable] = useState(1)

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
          <MainSwapContainer>
            <LeftContainer>

              <StatsContainer>
                <TokenInfoContainer data-testid="token-info-container">

                  <TokenNameCell>
                    {inputCurrency && outputCurrency && <DoubleCurrencyLogo currency0={inputCurrency as Currency} currency1={outputCurrency as Currency} size={40} margin />}
                    {inputCurrency && outputCurrency
                      ? <ThemedText.LargeHeader>{(outputCurrency.symbol)}/{(inputCurrency.symbol)}</ThemedText.LargeHeader>
                      : <ThemedText.LargeHeader>Pair not found</ThemedText.LargeHeader>}

                    {inputApprovalState !== ApprovalState.APPROVED && <SmallMaxButton onClick={() => inputApprove()} width="10%">
                      <Trans><WarningIcon size="1.25em" />Approve {inputCurrency?.symbol}</Trans>
                    </SmallMaxButton>}
                    {outputApprovalState !== ApprovalState.APPROVED && <SmallMaxButton onClick={() => outputApprove()} width="10%">
                      <Trans><WarningIcon size="1.25em" /> Approve {outputCurrency?.symbol}</Trans>
                    </SmallMaxButton>}
                  </TokenNameCell>


                </TokenInfoContainer>
                <PoolDataSection
                  chainId={chainId ?? 11155111}
                  token0={inputIsToken0 ? inputCurrency?.wrapped : outputCurrency?.wrapped}
                  token1={inputIsToken0 ? outputCurrency?.wrapped : inputCurrency?.wrapped}
                  fee={pool?.fee}
                />
              </StatsContainer>
              <Hr />
              <PositionsContainer>
                <TableHeader>
                  <TabHeader active={activePositionTable === 1}>
                  <TabNavItem id={1} activeTab={activePositionTable} setActiveTab={setActiveTable}>
                    Leverage Positions
                  </TabNavItem>
                  </TabHeader>
                  <TabHeader active={activePositionTable === 2}>
                  <TabNavItem id={2} activeTab={activePositionTable} setActiveTab={setActiveTable}>
                    Borrow Positions
                  </TabNavItem>
                  </TabHeader>
                </TableHeader>
                <TabContent id={1} activeTab={activePositionTable}>
                <LeveragePositionsTable positions={leveragePositions} loading={limitlessPositionsLoading} />
                </TabContent>
                <TabContent id={2} activeTab={activePositionTable}>
                <BorrowPositionsTable positions={borrowPositions} loading={limitlessPositionsLoading} />
                </TabContent>
              </PositionsContainer>
            </LeftContainer>

            <SwapWrapper chainId={chainId} className={className} id="swap-page">
              <SwapHeader allowedSlippage={allowedSlippage} activeTab={activeTab} />

              <TabContent id={ActiveSwapTab.TRADE} activeTab={activeTab}>
                <TradeTabContent />
              </TabContent>

              <TabContent id={ActiveSwapTab.BORROW} activeTab={activeTab}>
                <BorrowTabContent />
              </TabContent>

            </SwapWrapper>
          </MainSwapContainer>

          {/*<NetworkAlert /> */}
        </PageWrapper>
        {/*<SwitchLocaleLink />*/}
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