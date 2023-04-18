import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceTrade, LeverageTradeState, TradeState } from 'state/routing/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { useCurrencyBalances } from '../connection/hooks'
import { AppState } from '../types'
import { Field, replaceSwapState, selectCurrency, setHideClosedLeveragePositions, setLeverageFactor, setRecipient, switchCurrencies, typeInput, setLeverage, setLeverageManagerAddress } from './actions'
import { SwapState } from './reducer'
import {useLeverageManagerContract} from "../../hooks/useContract"
import { BigNumber as BN } from "bignumber.js";
import { usePool } from 'hooks/usePools'
import { FeeAmount } from '@uniswap/v3-sdk'
import useDebounce from 'hooks/useDebounce'
import JSBI from 'jsbi'
import { BigNumber } from 'ethers'
import { input } from 'nft/components/layout/Checkbox.css'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onLeverageFactorChange: (leverage: string) => void
  onHideClosedLeveragePositions: (hide: boolean) => void
  onLeverageChange: (leverage: boolean) => void
  onLeverageManagerAddress: (leverageManagerAddress: string) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken ? currency.address : currency.isNative ? 'ETH' : '',
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  const onLeverageFactorChange = useCallback(
    (leverageFactor: string) => {
      dispatch(setLeverageFactor({ leverageFactor }))
    },
    [dispatch]
  )

  const onHideClosedLeveragePositions = useCallback(
    (hide: boolean) => {
      dispatch(setHideClosedLeveragePositions({ hideClosedLeveragePositions: hide }))
    },
    [dispatch]
  )

  const onLeverageChange = useCallback(
    (leverage: boolean) => {
      dispatch(setLeverage({ leverage }))
      dispatch(setLeverageFactor({ leverageFactor: "1" }))
    },
    [dispatch]
  )

  const onLeverageManagerAddress = useCallback(
    (leverageManagerAddress: string) => {
      dispatch(setLeverageManagerAddress({ leverageManagerAddress }))
    }, [dispatch])

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onLeverageFactorChange,
    onHideClosedLeveragePositions,
    onLeverageChange,
    onLeverageManagerAddress
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

export interface LeverageTrade {
  inputAmount: CurrencyAmount<Currency> | undefined
  borrowedAmount: CurrencyAmount<Currency> | undefined
  state: LeverageTradeState
  expectedOutput: string | undefined
  strikePrice: string | undefined
  quotedPremium: string | undefined
  priceImpact: Percent | undefined
  effectiveLeverage: string | undefined
}

export function useDerivedLeverageCreationInfo()
: {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
  trade: LeverageTrade
  allowedSlippage: Percent
} 
{

  const { account } = useWeb3React()
  const [tradeState, setTradeState] = useState<LeverageTradeState>(LeverageTradeState.LOADING)
  const [contractResult, setContractResult] = useState()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
    leverage,
    leverageFactor,
    leverageManagerAddress
  } = useSwapState()



  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  // TODO: need to algoritmically calculate the best pool for the user

  const [poolState, pool] = usePool(inputCurrency ?? undefined, outputCurrency ?? undefined, FeeAmount.LOW)

  // user fund amount

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (inputCurrency) ?? undefined),
    [inputCurrency, outputCurrency, typedValue, leverage, leverageFactor]
  )


  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const currencies: { [field in Field]?: Currency | null } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }),
    [inputCurrency, outputCurrency]
  )

  const leverageManager = useLeverageManagerContract(leverageManagerAddress ?? undefined, true)
  const inputIsToken0 = outputCurrency?.wrapped ? inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped) : false; //inputCurrency?.wrapped.address === pool?.token0.address
  const initialPrice = pool ? (inputIsToken0 ? pool.token1Price : pool.token0Price) : undefined;
  // console.log("initialPrice: ", initialPrice, pool)
  const debouncedAmount = useDebounce(
    useMemo(() => (parsedAmount), [parsedAmount]),
    200
  )

  // TODO calculate slippage from the pool
  const allowedSlippage = new BN("103").shiftedBy(16).toFixed(0) // new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

  if(debouncedAmount && Number(leverageFactor) > 1){
  const _input = Number(debouncedAmount.toFixed()) * (10** Number(inputCurrency?.wrapped.decimals))
  const _borrowAmount = _input * (Number(leverageFactor)-1)
  // console.log('wtf',_input.toFixed(0)
  //   , _borrowAmount.toFixed(0) ); 
  }

  const simulateTrade = useCallback(async () => {
    if (leverageManager && debouncedAmount && leverage && Number(leverageFactor) > 1
      && outputCurrency?.wrapped && inputCurrency?.wrapped
      ) {
      try {
        // let input = new BN(debouncedAmount.toFixed(12))
        // let borrowAmount = input.multipliedBy(new BN(leverageFactor ?? "0")).minus(input)
        // input = input.shiftedBy(inputCurrency?.wrapped.decimals)
        // borrowAmount = borrowAmount.shiftedBy(outputCurrency?.wrapped.decimals)

        let isLong = !inputIsToken0 // borrowing token1 to buy token0
        setTradeState(LeverageTradeState.LOADING)
        let input = Number(debouncedAmount.toFixed()) * (10** Number(inputCurrency?.wrapped.decimals))
        let borrowAmount = input * (Number(leverageFactor)-1)


        const trade = await leverageManager.callStatic.createLevPosition(
          input.toFixed(0),
          allowedSlippage,
          borrowAmount.toFixed(0),
          isLong
        )
        // console.log("createPositionresult", trade)
        setContractResult(trade)
        setTradeState(LeverageTradeState.VALID)
      } catch (err) {
        console.log("simulation error: ", err)
        setTradeState(LeverageTradeState.INVALID)
      }
    } else {
      setTradeState(LeverageTradeState.INVALID)
    }
  }, [currencies,leverageManager, leverage, leverageFactor, debouncedAmount])
  //console.log("contractResultPost/tradestate", contractResult, tradeState)

  useEffect(() => {
    simulateTrade()
  }, [currencies,leverageManager, leverage, leverageFactor, debouncedAmount])

  const trade: LeverageTrade = useMemo(() => {
    if (initialPrice && contractResult && outputCurrency?.wrapped && inputCurrency?.wrapped && debouncedAmount) {
      const position: any = contractResult[0]
      const expectedOutput = new BN(position.totalPosition.toString()).shiftedBy(-outputCurrency?.wrapped.decimals).toFixed(6);
      const borrowedAmount = new BN(position.totalDebtInput.toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toFixed(6)
      const strikePrice = new BN(expectedOutput).div(new BN(borrowedAmount).plus(debouncedAmount.toExact())).toFixed(6)
      const quotedPremium = new BN((contractResult[2] as any ).toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toFixed(6)
      let t = new BN(strikePrice).minus(initialPrice.toFixed(12)).abs().dividedBy(initialPrice.toFixed(12)).multipliedBy(1000).toFixed(0)
      const priceImpact = new Percent(t, 1000)
      
      // ? new Percent(String(Number(strikePrice) - Number(initialPrice.toFixed(12))), String(Number(initialPrice.toFixed(12)))) : 
      // new Percent(String(Number(initialPrice.toFixed(12)) - Number(strikePrice)), String(Number(initialPrice.toFixed(12))))
      // console.log("debounced: ", debouncedAmount.toExact(), borrowedAmount)
      const effectiveLeverage = new BN( ( Number(borrowedAmount) + Number(debouncedAmount.toExact()) + Number(quotedPremium) ) / (Number(debouncedAmount.toExact()) + Number(quotedPremium))).toFixed(6)

      return {
        inputAmount: debouncedAmount,
        borrowedAmount: CurrencyAmount.fromRawAmount(inputCurrency?.wrapped, new BN(borrowedAmount).shiftedBy(inputCurrency?.wrapped.decimals).toFixed(0)),
        state: tradeState,
        expectedOutput,
        strikePrice,
        quotedPremium,
        priceImpact,
        effectiveLeverage
      }

      // inputAmount: CurrencyAmount<Currency> | undefined
      // borrowedAmount: CurrencyAmount<Currency> | undefined
      // state: LeverageTradeState
      // expectedOutput: string | undefined
      // strikePrice: string | undefined
      // quotedPremium: string | undefined
      // priceImpact: string | undefined
    } else {
      return {
        inputAmount: undefined,
        borrowedAmount: undefined,
        state: tradeState,
        expectedOutput: undefined,
        strikePrice: undefined,
        quotedPremium: undefined,
        priceImpact: undefined,
        effectiveLeverage: undefined
      }
    }
  }, [initialPrice, tradeState, contractResult, leverageManager, leverage, leverageFactor, debouncedAmount, currencies, inputCurrency, outputCurrency])
  
  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    if (leverage && Number(leverageFactor) <= 1) {
      inputError = inputError ?? <Trans>Invalid Leverage</Trans>
    }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], parsedAmount?.toExact()]

    // TODO add slippage to all the simulations
    if (balanceIn && amountIn && Number(balanceIn.toExact()) < Number(amountIn)) {
      inputError = <Trans>Insufficient {inputCurrency?.symbol} balance</Trans>
    }

    return inputError
  }, [account, allowedSlippage, currencies, currencyBalances, parsedAmount, leverage, leverageFactor, inputCurrency])

  return {
    trade,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError: inputError,
    allowedSlippage: new Percent(JSBI.BigInt(3), JSBI.BigInt(100))
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
  trade: {
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
    state: TradeState
  }
  allowedSlippage: Percent
} {
  const { account } = useWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
    leverage,
    leverageFactor
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue, leverage, leverageFactor]
  )

  const trade = useBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const currencies: { [field in Field]?: Currency | null } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }),
    [inputCurrency, outputCurrency]
  )

  // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled
  const autoSlippageTolerance = useAutoSlippageTolerance(trade.trade)
  const allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance)
  // console.log("allowedSlippage:", allowedSlippage)

  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    const formattedTo = isAddress(to)
    if (!to || !formattedTo) {
      inputError = inputError ?? <Trans>Enter a recipient</Trans>
    } else {
      if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
        inputError = inputError ?? <Trans>Invalid recipient</Trans>
      }
    }

    if (leverage && Number(leverageFactor) <= 1) {
      inputError = inputError ?? <Trans>Invalid Leverage</Trans>
    }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade.trade?.maximumAmountIn(allowedSlippage)]

    if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
      inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
    }

    return inputError
  }, [account, allowedSlippage, currencies, currencyBalances, parsedAmount, to, trade.trade, leverage, leverageFactor])

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      trade,
      allowedSlippage,
    }),
    [allowedSlippage, currencies, currencyBalances, inputError, parsedAmount, trade, leverage, leverageFactor]
  )
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') return 'ETH'
    if (upper in TOKEN_SHORTHANDS) return upper
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)
  const independentField = parseIndependentFieldURLParameter(parsedQs.exactField)

  if (inputCurrency === '' && outputCurrency === '' && typedValue === '' && independentField === Field.INPUT) {
    // Defaults to having the native currency selected
    inputCurrency = 'ETH'
  } else if (inputCurrency === outputCurrency) {
    // clear output if identical
    outputCurrency = ''
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency === '' ? null : inputCurrency ?? null,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency === '' ? null : outputCurrency ?? null,
    },
    typedValue,
    independentField,
    recipient,
    leverageFactor: "1",
    leverage: false,
    hideClosedLeveragePositions: true,
    leverageManagerAddress: null
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(): SwapState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedSwapState = useMemo(() => {
    return queryParametersToSwapState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return
    const inputCurrencyId = parsedSwapState[Field.INPUT].currencyId ?? undefined
    const outputCurrencyId = parsedSwapState[Field.OUTPUT].currencyId ?? undefined

    dispatch(
      replaceSwapState({
        typedValue: parsedSwapState.typedValue,
        field: parsedSwapState.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsedSwapState.recipient,
        leverageFactor: "1",
        hideClosedLeveragePositions: true,
        leverage: false
      })
    )
  }, [dispatch, chainId, parsedSwapState])

  return parsedSwapState
}
