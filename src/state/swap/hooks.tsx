import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { computePoolAddress, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { BigNumber as BN } from "bignumber.js";
import { POOL_INIT_CODE_HASH, V3_CORE_FACTORY_ADDRESSES } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { FETH_MUMBAI, FETH_SEPOLIA, FUSDC_MUMBAI, FUSDC_SEPOLIA } from 'constants/fake-tokens'
import { useAllV3Routes } from 'hooks/useAllV3Routes'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import useDebounce from 'hooks/useDebounce'
import { usePool } from 'hooks/usePools'
import { useLimitlessPositionFromKeys } from 'hooks/useV3Positions'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceTrade, LeverageTradeState, TradeState } from 'state/routing/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'

import { DEFAULT_ERC20_DECIMALS, TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { useBorrowManagerContract, useLeverageManagerContract } from "../../hooks/useContract"
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { useCurrencyBalances } from '../connection/hooks'
import { AppState } from '../types'
import { ActiveSwapTab, Field, replaceSwapState, selectCurrency, setActiveTab, setBorrowManagerAddress, setHideClosedLeveragePositions, setLeverage, setLeverageFactor, setLeverageManagerAddress, setLTV, setPremium,setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'

// import { useLeveragePosition } from 'hooks/useV3Positions'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: (leverage: boolean) => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
  onLeverageFactorChange: (leverage: string) => void
  onHideClosedLeveragePositions: (hide: boolean) => void
  onLeverageChange: (leverage: boolean) => void
  onLeverageManagerAddress: (leverageManagerAddress: string) => void
  onActiveTabChange: (activeTab: ActiveSwapTab) => void
  onLTVChange: (ltv: string) => void
  onBorrowManagerAddress: (borrowManagerAddress: string) => void
  onPremiumChange: (premium: number) => void
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

  const onSwitchTokens = useCallback((leverage: boolean) => {
    dispatch(switchCurrencies({leverage}))
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

  const onActiveTabChange = useCallback(
    (activeTab: ActiveSwapTab) => {
      dispatch(setActiveTab({ activeTab }))
    }, [dispatch])

  const onLTVChange = useCallback(
    (ltv: string) => {
      dispatch(setLTV({ ltv }))
    }, [dispatch])

  const onBorrowManagerAddress = useCallback(
    (borrowManagerAddress: string) => {
      dispatch(setBorrowManagerAddress({ borrowManagerAddress }))
    }, [dispatch])

  const onPremiumChange = useCallback(
    (premium: number) => {
      dispatch(setPremium({ premium }))
    }, 
    [dispatch])

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onLeverageFactorChange,
    onHideClosedLeveragePositions,
    onLeverageChange,
    onLeverageManagerAddress,
    onActiveTabChange,
    onLTVChange,
    onBorrowManagerAddress,
    onPremiumChange
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

export interface LeverageTrade {
  inputAmount: CurrencyAmount<Currency>
  borrowedAmount: CurrencyAmount<Currency>
  expectedOutput: number // new output. i.e. new position - existing position.
  strikePrice: number
  quotedPremium: number
  priceImpact: Percent
  remainingPremium: number
  effectiveLeverage: number
  existingPosition: boolean
  existingTotalDebtInput?: number
  existingTotalPosition?: number
  existingCollateral?: number
  tokenId?: number // if not existing position then this will be undefined
}

export interface BorrowCreationDetails {
  collateralAmount: number// CurrencyAmount<Currency> | undefined
  borrowedAmount: number // totalDebtInput
  quotedPremium: number
  unusedPremium: number
  priceImpact: Percent
  ltv: number
  // state: TradeState
  existingPosition: boolean
  existingTotalDebtInput?: number
  existingCollateral?: number
}

// in its return the pos, vars.prevRemainingPremium, vars.premium, the vars.premium is new quoted, prevRemaining is unused amount you get back,
// for pos struct totalDebtInput
// is the amount borrowed given collateral and ltv

export function useBestPoolAddress(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined
): string | undefined {
  const { loading, routes } = useAllV3Routes(inputCurrency, outputCurrency)
  const { chainId } = useWeb3React()
  if (loading || routes.length === 0 || !chainId || routes[0].pools.length === 0) {
    return undefined
  }

  const pool = routes[0].pools[0]

  return computePoolAddress({
    factoryAddress: V3_CORE_FACTORY_ADDRESSES[chainId],
    tokenA: pool.token0,
    tokenB: pool.token1,
    fee: pool.fee,
    initCodeHashManualOverride: POOL_INIT_CODE_HASH
  })
}

export function useBestPool(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined
): Pool | undefined {
  const { loading, routes } = useAllV3Routes(inputCurrency, outputCurrency)
  const { chainId } = useWeb3React()
  if (loading || routes.length === 0 || !chainId || routes[0].pools.length === 0) {
    return undefined
  }

  const pool = routes[0].pools[0]

  return pool;
}


export function useDerivedBorrowCreationInfo({ allowance: {input: inputAllowance, output: outputAllowance} } : { allowance: { input: ApprovalState, output: ApprovalState} })
  : {
    currencies: { [field in Field]?: Currency | null }
    currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
    parsedAmount: CurrencyAmount<Currency> | undefined
    inputError?: ReactNode
    trade?: BorrowCreationDetails
    state: TradeState
    allowedSlippage: Percent
    contractError?: ReactNode
  } {

  const { account } = useWeb3React()
  const [tradeState, setTradeState] = useState<TradeState>(TradeState.INVALID)
  const [contractResult, setContractResult] = useState()
  const [error, setError] = useState()

  const {
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    ltv,
    borrowManagerAddress,
    activeTab
  } = useSwapState()

  const { onPremiumChange } = useSwapActionHandlers()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  // TODO: need to algoritmically calculate the best pool for the user
  // let poolAddress = useBestPoolAddress(inputCurrency ?? undefined, outputCurrency ?? undefined)
  // user fund amount

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (inputCurrency) ?? undefined),
    [inputCurrency, typedValue]
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

  const [_, pool] = usePool(inputCurrency ?? undefined, outputCurrency?? undefined, 500)
  // console.log("pool: ", pool, inputCurrency, outputCurrency)

  // const leverageManager = useLeverageManagerContract(leverageManagerAddress ?? undefined, true)
  const borrowManager = useBorrowManagerContract(borrowManagerAddress ?? undefined, true)
  const inputIsToken0 = useMemo(() => outputCurrency?.wrapped ? inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped) : false, [inputCurrency, outputCurrency]); //inputCurrency?.wrapped.address === pool?.token0.address
  const initialPrice = pool ? (inputIsToken0 ? pool.token1Price : pool.token0Price) : undefined;
  const debouncedAmount = useDebounce(
    useMemo(() => (parsedAmount), [parsedAmount]),
    200
  )

  const globalStorageAddress = useSingleCallResult(borrowManager, 'globalStorage');

  useEffect(() => {
    if (!globalStorageAddress) {
      setTradeState(TradeState.NO_ROUTE_FOUND)
    }
  }, [globalStorageAddress])

  const { loading, position: existingPosition } = useLimitlessPositionFromKeys(account, borrowManagerAddress ?? undefined, inputIsToken0, true)

  // TODO calculate slippage from the pool
  const allowedSlippage = useMemo(() => new Percent(JSBI.BigInt(3), JSBI.BigInt(100)),[])// new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

  // retrieves the trade object
  useEffect(() => {
    const lagged = async () => {
      // simulate the trade
      if (borrowManager && debouncedAmount && ltv && Number(ltv) > 0
        && outputCurrency?.wrapped && inputCurrency?.wrapped
        && inputAllowance === ApprovalState.APPROVED && outputAllowance === ApprovalState.APPROVED
      ) {
        try {
          const borrowBelow = inputIsToken0 // borrowing token1 to buy token0
          setTradeState(TradeState.LOADING)
          const collateralAmount = new BN((debouncedAmount.toFixed(DEFAULT_ERC20_DECIMALS))).shiftedBy(DEFAULT_ERC20_DECIMALS).toFixed(0)
          const _ltv = new BN(ltv).shiftedBy(16).toFixed(0)
  
          const trade = await borrowManager.callStatic.addBorrowPosition(
            borrowBelow,
            collateralAmount,
            _ltv,
            []
          )
          setTradeState(TradeState.VALID)
  
          setContractResult(trade)
          setError(undefined)
        } catch (err) {
          console.log("addBorrowPosition simulation error: ", err)
          setError(err.reason)
          setTradeState(TradeState.INVALID)
        }
      } else {
        setTradeState(TradeState.INVALID)
      }}
    lagged()
  }, [inputIsToken0, inputAllowance, outputAllowance, borrowManager, ltv, debouncedAmount, inputCurrency, outputCurrency])
  //console.log("contractResultPost/tradestate", contractResult, tradeState)

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

    if (!ltv || Number(ltv) >= 100 || Number(ltv) === 0 || ltv === "" ) {
      inputError = inputError ?? <Trans>Invalid LTV</Trans>
    }

    // compare input balance to max input based on version
    // const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], parsedAmount?.toExact()]
    // const price = inputIsToken0 ? pool.token0Price.toFixed(18) : pool.token1Price.toFixed(18)
    // new BN(parsedAmount?.toExact() ?? 0).times(ltv ?? "0").times(price).shiftedBy(18).toFixed(0)
    // const [balanceOut, premiumAmount] = [currencyBalances[Field.INPUT], parsedAmount?.toExact()]

    // // TODO add slippage to all the simulations
    // if (balanceIn && amountIn && Number(balanceIn.toExact()) < Number(amountIn)) {
    //   inputError = <Trans>Insufficient {inputCurrency?.symbol} balance</Trans>
    // }

    // if (balanceOut && premiumAmount && Number(balanceOut.toExact()) < Number(premium)) {
    //   inputError = inputError ?? <Trans>Insufficient {outputCurrency?.symbol} balance</Trans>
    // }

    if (tradeState === TradeState.NO_ROUTE_FOUND) {
      inputError = inputError ?? <Trans>Insufficient Liquidity</Trans>
    }

    return inputError
  }, [tradeState,  account, currencies, parsedAmount, ltv])


  const trade = useMemo(() => {
    if (
      tradeState === TradeState.VALID && 
      initialPrice && 
      contractResult && 
      outputCurrency?.wrapped && 
      inputCurrency?.wrapped && 
      debouncedAmount
    ) {
      const position: any = contractResult[0]
      // const expectedOutput = new BN(position.totalPosition.toString()).shiftedBy(-outputCurrency?.wrapped.decimals).toNumber()
      
      const borrowedAmount = new BN(position.totalDebtInput.toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const unusedPremium = new BN((contractResult[1] as any).toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const strikePrice = new BN(borrowedAmount).div(debouncedAmount.toExact()).toNumber()
      const quotedPremium = new BN((contractResult[2] as any)
        .toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const t = new BN(strikePrice).minus(initialPrice.toFixed(DEFAULT_ERC20_DECIMALS)).abs().dividedBy(initialPrice.toFixed(DEFAULT_ERC20_DECIMALS)).multipliedBy(1000).toFixed(0)
      const priceImpact = new Percent(t, 1000)

      // existing position
      const _existingPosition = !!existingPosition
      const existingTotalDebtInput = existingPosition?.totalDebtInput
      const existingCollateral = existingPosition?.initialCollateral
      // if (existingPosition) {
      //   _existingPosition = true
      //   existingTotalDebtInput = 
      //   existingCollateral = existingPosition.initialCollateral
      // }

      return {
        collateralAmount: Number(debouncedAmount.toExact()),
        borrowedAmount, // CurrencyAmount.fromRawAmount(inputCurrency?.wrapped, new BN(borrowedAmount).shiftedBy(inputCurrency?.wrapped.decimals).toFixed(0)),
        state: tradeState,
        unusedPremium,
        strikePrice,
        quotedPremium, // quotedPremium - unusedPremium,
        priceImpact,
        ltv: Number(ltv),
        existingPosition: _existingPosition,
        existingTotalDebtInput,
        existingCollateral
      }
    } else {
      return undefined
    }
  }, [inputAllowance, outputAllowance, ltv, initialPrice, tradeState, contractResult, borrowManager, debouncedAmount, currencies, inputCurrency, outputCurrency])

  // console.log('trade', existingPosition, trade)

  useEffect(() => {
    if (activeTab === ActiveSwapTab.BORROW) {
      const amount = Number(typedValue)
      const price = inputIsToken0 ? pool?.token0Price.toFixed(18) : pool?.token1Price.toFixed(18)
      const _ltv = Number(ltv) / 100;
      // console.log("premiumBorrow", price, amount, _ltv)
      if (tradeState === TradeState.VALID && trade) {
        onPremiumChange(trade.quotedPremium)
      } else if (existingPosition && amount && Number(_ltv) > 0) {
        const addedDebt = Number(amount) * Number(price);
        onPremiumChange(
          ( addedDebt + Number(existingPosition?.totalDebtInput) ) * 0.002
        )
      } else if (Number(_ltv) > 0 && amount) {
        onPremiumChange(Number(amount) * Number(price) * 0.002)
        // console.log("zeke")
      } else {
        onPremiumChange(0)
        // console.log("alli")
      }
    }
  }, [activeTab, tradeState, trade, typedValue, pool, ltv])



  const contractError = useMemo(() => {
    let _contractError;

    if (error === '!liq') {
      _contractError = <Trans>Insufficient liquidity for trade</Trans>
    }

    if (tradeState === TradeState.INVALID) {
      _contractError = _contractError ?? <Trans>Invalid Trade</Trans>
    }
    return _contractError
  }, [error, inputAllowance, outputAllowance, account, allowedSlippage, currencies, currencyBalances, parsedAmount, borrowManager, ltv, inputCurrency, trade])

  return {
    trade,
    state: tradeState,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    allowedSlippage,
    contractError
  }
}

export function useDerivedLeverageCreationInfo()
  : {
    currencies: { [field in Field]?: Currency | null }
    currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
    parsedAmount: CurrencyAmount<Currency> | undefined
    inputError?: ReactNode
    trade: LeverageTrade | undefined
    state: LeverageTradeState
    allowedSlippage: Percent
    contractError?: ReactNode
  } {

  const { account } = useWeb3React()
  const [tradeState, setTradeState] = useState<LeverageTradeState>(LeverageTradeState.INVALID)
  const [contractResult, setContractResult] = useState()
  const [error, setError] = useState()

  const {
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    leverage,
    leverageFactor,
    leverageManagerAddress,
    premium,
    activeTab
  } = useSwapState()

  const { onPremiumChange } = useSwapActionHandlers()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  // TODO: need to algoritmically calculate the best pool for the user
  // let poolAddress = useBestPoolAddress(inputCurrency ?? undefined, outputCurrency ?? undefined)
  // user fund amount

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (inputCurrency) ?? undefined),
    [inputCurrency, typedValue ]
  )

  const leverageApproveAmount = useMemo(() => {
    if (inputCurrency
      && parsedAmount
      && outputCurrency
      && premium
    ) {
      return CurrencyAmount.fromRawAmount(
        inputCurrency,
        new BN(parsedAmount?.toExact() ?? 0).plus(premium).shiftedBy(18).toFixed(0)
      )
    }
    else {
      return undefined
    }
  }, [inputCurrency, outputCurrency, premium, parsedAmount])

  const [allowance, ] = useApproveCallback(
    leverageApproveAmount,
    leverageManagerAddress ?? undefined
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

  const [_, pool] = usePool(inputCurrency ?? undefined, outputCurrency?? undefined, 500)

  const leverageManager = useLeverageManagerContract(leverageManagerAddress ?? undefined, true)
  const inputIsToken0 = useMemo(() => {
    return outputCurrency?.wrapped ? inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped) : false
  }, [outputCurrency, inputCurrency]); //inputCurrency?.wrapped.address === pool?.token0.address

  const initialPrice = pool ? (inputIsToken0 ? pool.token0Price : pool.token1Price) : undefined;

  const debouncedAmount = useDebounce(
    useMemo(() => (parsedAmount), [parsedAmount]),
    200
  )

  const { position: existingPosition } = useLimitlessPositionFromKeys(account, leverageManagerAddress ?? undefined, !inputIsToken0, false)


  // TODO calculate slippage from the pool
  const allowedSlippage = useMemo(() => new Percent(JSBI.BigInt(3), JSBI.BigInt(100)), []) // new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

  const globalStorageAddress = useSingleCallResult(leverageManager, 'globalStorage');

  useEffect(() => {
    if (!globalStorageAddress) {
      setTradeState(LeverageTradeState.NO_ROUTE_FOUND)
    }
  }, [globalStorageAddress])

  // retrieves the trade object
  useEffect(() => {
    const lagged = async () => {
      // checks if the leverageManager exists
      // simulate the trade
      if (leverageManager && debouncedAmount && leverage && Number(leverageFactor) > 1
        && outputCurrency?.wrapped && inputCurrency?.wrapped && allowance === ApprovalState.APPROVED
      ) {
        try {
          // borrowing token1 to buy token0
          setTradeState(LeverageTradeState.LOADING)
          const input = new BN((debouncedAmount.toFixed(DEFAULT_ERC20_DECIMALS)))
          const borrowAmount = input.multipliedBy((Number(leverageFactor) - 1))
  
          // console.log("input: ", input.toFixed(), borrowAmount.toFixed(0))
  
          const trade = await leverageManager.callStatic.addPosition(
            input.shiftedBy(inputCurrency?.wrapped.decimals).toFixed(0),
            new BN(allowedSlippage.toFixed(4)).plus(1).shiftedBy(18).toFixed(0),
            borrowAmount.shiftedBy(inputCurrency?.wrapped.decimals).toFixed(0),
            !inputIsToken0
          )
          setTradeState(LeverageTradeState.VALID)
  
          setContractResult(trade)
          setError(undefined)
        } catch (err) {
          console.log("simulation error: ", err.reason)
          // setContractError(err)
          setTradeState(LeverageTradeState.INVALID)
          setError(err.reason)
        }
      } else {
        setTradeState(LeverageTradeState.INVALID)
      }
    }

    lagged();
  }, [leverageFactor, debouncedAmount, allowance, inputCurrency, outputCurrency, leverage, inputIsToken0, leverageManager])
  // [allowedSlippage, inputIsToken0, inputCurrency, outputCurrency, leverageManager, leverage, leverageFactor, debouncedAmount, allowance]

  // console.log("contractResultPost/tradestate", contractResult, tradeState, parsedAmount?.toExact())
  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined
    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount || Number(parsedAmount) <= 0) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    if (leverage && Number(leverageFactor) <= 1) {
      inputError = inputError ?? <Trans>Invalid Leverage</Trans>
    }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], parsedAmount?.toExact()]

    // TODO add slippage to all the simulations
    if (balanceIn && amountIn && Number(balanceIn.toExact()) < Number(amountIn) + Number(premium)) {
      inputError = <Trans>Insufficient {inputCurrency?.symbol} balance</Trans>
    }

    return inputError
  }, [premium, account, currencies, currencyBalances, parsedAmount, leverage, leverageFactor, inputCurrency])


  const trade = useMemo(() => {
    if (
      tradeState === LeverageTradeState.VALID && 
      initialPrice && 
      contractResult && 
      outputCurrency?.wrapped && 
      inputCurrency?.wrapped && 
      debouncedAmount
    ) {
            // existing position
      let _existingPosition = false
      let existingTotalDebtInput
      let existingTotalPosition
      let tokenId
      let existingCollateral
      if (existingPosition){
        _existingPosition = true
        existingTotalDebtInput = existingPosition.totalDebtInput
        existingTotalPosition = existingPosition.totalPosition
        tokenId = Number(existingPosition.tokenId)
        existingCollateral = existingPosition.initialCollateral
      }

      const position: any = contractResult[0]
      const expectedOutput = new BN(position.totalPosition.toString()).shiftedBy(-outputCurrency?.wrapped.decimals).toNumber()
      const borrowedAmount = new BN(position.totalDebtInput.toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const strikePrice = new BN(expectedOutput).div(new BN(borrowedAmount ).plus(debouncedAmount.toExact() )).toNumber()

      const quotedPremium = new BN((contractResult[2] as any)
        .toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const returnedPremium = new BN((contractResult[1] as any)
        .toString()).shiftedBy(-inputCurrency?.wrapped.decimals).toNumber()
      const t = new BN(strikePrice).minus(initialPrice.toFixed(DEFAULT_ERC20_DECIMALS)).abs().dividedBy(initialPrice.toFixed(DEFAULT_ERC20_DECIMALS)).multipliedBy(1000).toFixed(0)
      const priceImpact = new Percent(t, 1000)

      const effectiveLeverage = new BN((Number(borrowedAmount) + Number(debouncedAmount.toExact()) + Number(quotedPremium)) / (Number(debouncedAmount.toExact()) + Number(quotedPremium))).toNumber()
      
      return {
        inputAmount: debouncedAmount,
        borrowedAmount: CurrencyAmount.fromRawAmount(inputCurrency?.wrapped, new BN(borrowedAmount).shiftedBy(inputCurrency?.wrapped.decimals).toFixed(0)),
        expectedOutput,
        strikePrice,
        quotedPremium, //- returnedPremium,
        priceImpact,
        remainingPremium: returnedPremium,
        effectiveLeverage,
        existingPosition: _existingPosition,
        existingTotalDebtInput,
        existingTotalPosition,
        existingCollateral,
        tokenId
      }
    } else {
      return undefined
    }
  }, [contractResult, debouncedAmount, existingPosition, initialPrice, inputCurrency, outputCurrency, tradeState])

  useEffect(() => {
    if ( activeTab === ActiveSwapTab.TRADE) {
      const amount = Number(typedValue);
      // leverage premium, in input currency amount
      if (tradeState === LeverageTradeState.VALID && trade) {
        onPremiumChange((trade.quotedPremium))
        return
      } else if (existingPosition && Number(leverageFactor) > 1 && amount) {
        const addedDebt = Number(amount) * (Number(leverageFactor) - 1);
        onPremiumChange(
          ( addedDebt + Number(existingPosition.totalDebtInput) ) * 0.002
        )
        return
      } else if (Number(leverageFactor) > 1 && amount) {
        onPremiumChange((Number(amount) * (Number(leverageFactor) - 1) * 0.002 ))
        return
      } else {
        onPremiumChange(0)
      }
    }
  }, [tradeState, onPremiumChange, trade, typedValue, activeTab, leverage, leverageFactor, existingPosition])

  const contractError = useMemo(() => {
    let _contractError;

    if (error === '!liq') {
      _contractError = <Trans>Insufficient liquidity For trade</Trans>
    }

    if (tradeState === LeverageTradeState.INVALID) {
      _contractError = _contractError ?? <Trans>Invalid Trade</Trans>
    }


  
    return _contractError
  }, [error, tradeState])

  // console.log('everything', tradeState, inputIsToken0, debouncedAmount)

  return useMemo(
    () => ({
      trade,
      state: tradeState,
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      allowedSlippage,
      contractError
    }),
    [
      trade,
      tradeState,
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      allowedSlippage,
      contractError
    ]
  )
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
  } = useSwapState()

  // console.log("currencyId", inputCurrencyId, outputCurrencyId)

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  // console.log('inputCurrency', inputCurrency)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue]
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

    // if (leverage && Number(leverageFactor) <= 1) {
    //   inputError = inputError ?? <Trans>Invalid Leverage</Trans>
    // }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade.trade?.maximumAmountIn(allowedSlippage)]

    if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
      inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
    }

    return inputError
  }, [account, allowedSlippage, currencies, currencyBalances, parsedAmount, to, trade.trade])

  

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      trade,
      allowedSlippage,
    }),
    [allowedSlippage, currencies, currencyBalances, inputError, parsedAmount, trade]
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
const ENS_NAME_REGEX = /^(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+)eth(\/.*)?$/

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
    leverageManagerAddress: null,
    activeTab: ActiveSwapTab.TRADE,
    ltv: null,
    borrowManagerAddress: null,
    premium: null
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
    const inputCurrencyId = chainId === SupportedChainId.SEPOLIA ?  FUSDC_SEPOLIA.address : FUSDC_MUMBAI.address // parsedSwapState[Field.INPUT].currencyId ?? undefined
    const outputCurrencyId = chainId === SupportedChainId.SEPOLIA ? FETH_SEPOLIA.address : FETH_MUMBAI.address // parsedSwapState[Field.OUTPUT].currencyId ?? undefined

    dispatch(
      replaceSwapState({
        typedValue: parsedSwapState.typedValue,
        field: parsedSwapState.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsedSwapState.recipient,
        leverageFactor: "1",
        hideClosedLeveragePositions: true,
        leverage: true,
        activeTab: ActiveSwapTab.TRADE
      })
    )
  }, [dispatch, chainId, parsedSwapState])

  return parsedSwapState
}
