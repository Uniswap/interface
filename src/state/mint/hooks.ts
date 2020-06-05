import { useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Token, TokenAmount, Route, JSBI, Price, Percent, Pair } from '@uniswap/sdk'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { setDefaultsFromURLMatchParams, Field, typeInput } from './actions'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTokenBalancesTreatWETHAsETH } from '../wallet/hooks'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { tryParseAmount } from '../swap/hooks'

const ZERO = JSBI.BigInt(0)

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint)
}

export function useDerivedMintInfo(): {
  dependentField: Field
  tokens: { [field in Field]?: Token }
  pair?: Pair | null
  tokenBalances: { [field in Field]?: TokenAmount }
  parsedAmounts: { [field in Field]?: TokenAmount }
  price?: Price
  noLiquidity?: boolean
  liquidityMinted?: TokenAmount
  poolTokenPercentage?: Percent
  error?: string
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    otherTypedValue,
    [Field.TOKEN_A]: { address: tokenAAddress },
    [Field.TOKEN_B]: { address: tokenBAddress }
  } = useMintState()

  const dependentField = independentField === Field.TOKEN_A ? Field.TOKEN_B : Field.TOKEN_A

  // tokens
  const tokenA = useTokenByAddressAndAutomaticallyAdd(tokenAAddress)
  const tokenB = useTokenByAddressAndAutomaticallyAdd(tokenBAddress)
  const tokens: { [field in Field]?: Token } = useMemo(
    () => ({
      [Field.TOKEN_A]: tokenA,
      [Field.TOKEN_B]: tokenB
    }),
    [tokenA, tokenB]
  )

  // pair
  const pair = usePair(tokens[Field.TOKEN_A], tokens[Field.TOKEN_B])
  const noLiquidity =
    pair === null || (!!pair && JSBI.equal(pair.reserve0.raw, ZERO) && JSBI.equal(pair.reserve1.raw, ZERO))

  // route
  const route = useMemo(
    () =>
      !noLiquidity && pair && tokens[independentField] ? new Route([pair], tokens[Field.TOKEN_A] as Token) : undefined,
    [noLiquidity, pair, tokens, independentField]
  )

  // balances
  const relevantTokenBalances = useTokenBalancesTreatWETHAsETH(account ?? undefined, [
    tokens[Field.TOKEN_A],
    tokens[Field.TOKEN_B]
  ])
  const tokenBalances: { [field in Field]?: TokenAmount } = {
    [Field.TOKEN_A]: relevantTokenBalances?.[tokens[Field.TOKEN_A]?.address ?? ''],
    [Field.TOKEN_B]: relevantTokenBalances?.[tokens[Field.TOKEN_B]?.address ?? '']
  }

  // amounts
  const independentAmount = tryParseAmount(typedValue, tokens[independentField])
  const dependentAmount = useMemo(() => {
    if (noLiquidity && otherTypedValue && tokens[dependentField]) {
      return tryParseAmount(otherTypedValue, tokens[dependentField])
    } else if (route && independentAmount) {
      return dependentField === Field.TOKEN_B
        ? route.midPrice.quote(independentAmount)
        : route.midPrice.invert().quote(independentAmount)
    } else {
      return
    }
  }, [noLiquidity, otherTypedValue, tokens, dependentField, independentAmount, route])
  const parsedAmounts = {
    [Field.TOKEN_A]: independentField === Field.TOKEN_A ? independentAmount : dependentAmount,
    [Field.TOKEN_B]: independentField === Field.TOKEN_A ? dependentAmount : independentAmount
  }

  const price = useMemo(() => {
    if (
      noLiquidity &&
      tokens[Field.TOKEN_A] &&
      tokens[Field.TOKEN_B] &&
      parsedAmounts[Field.TOKEN_A] &&
      parsedAmounts[Field.TOKEN_B]
    ) {
      return new Price(
        tokens[Field.TOKEN_A] as Token,
        tokens[Field.TOKEN_B] as Token,
        (parsedAmounts[Field.TOKEN_A] as TokenAmount).raw,
        (parsedAmounts[Field.TOKEN_B] as TokenAmount).raw
      )
    } else if (route) {
      return route.midPrice
    } else {
      return
    }
  }, [noLiquidity, tokens, parsedAmounts, route])

  // liquidity minted
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityMinted = useMemo(() => {
    if (pair && totalSupply && parsedAmounts[Field.TOKEN_A] && parsedAmounts[Field.TOKEN_B]) {
      return pair.getLiquidityMinted(
        totalSupply,
        parsedAmounts[Field.TOKEN_A] as TokenAmount,
        parsedAmounts[Field.TOKEN_B] as TokenAmount
      )
    } else {
      return
    }
  }, [pair, totalSupply, parsedAmounts])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return
    }
  }, [liquidityMinted, totalSupply])

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.TOKEN_A] || !parsedAmounts[Field.TOKEN_B]) {
    error = error ?? 'Enter an amount'
  }

  if (
    parsedAmounts[Field.TOKEN_A] &&
    tokenBalances?.[Field.TOKEN_A]?.lessThan(parsedAmounts[Field.TOKEN_A] as TokenAmount)
  ) {
    error = 'Insufficient ' + tokens[Field.TOKEN_A]?.symbol + ' balance'
  }

  if (
    parsedAmounts[Field.TOKEN_B] &&
    tokenBalances?.[Field.TOKEN_B]?.lessThan(parsedAmounts[Field.TOKEN_B] as TokenAmount)
  ) {
    error = 'Insufficient ' + tokens[Field.TOKEN_B]?.symbol + ' balance'
  }

  return {
    dependentField,
    tokens,
    pair,
    tokenBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  }
}

export function useMintActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const { noLiquidity } = useDerivedMintInfo()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue, noLiquidity: noLiquidity === true ? true : false }))
    },
    [dispatch, noLiquidity]
  )

  return {
    onUserInput
  }
}

// updates the mint state to use the appropriate tokens, given the route
export function useDefaultsFromURLMatchParams(params: { [k: string]: string }) {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    if (!chainId) return
    dispatch(setDefaultsFromURLMatchParams({ chainId, params }))
  }, [dispatch, chainId, params])
}
