import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { Token, Currency, Percent, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useV2Pair } from '../../hooks/useV2Pairs'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useCallback, useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";
import { AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, typeInput } from './actions'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useWeb3React } from '@web3-react/core'
import useInterval from 'hooks/useInterval'
import { useActiveWeb3React } from 'hooks/web3'

export function useBurnState(): AppState['burn'] {
  return useAppSelector((state) => state.burn)
}

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  MATIC = 137,
  FANTOM = 250,
}

const GAS_STATION = {
  [ChainId.MAINNET]: "https://www.gasnow.org/api/v3/gas/price",
  [ChainId.ROPSTEN]: undefined,
  [ChainId.MATIC]: "https://gasstation-mainnet.matic.network",
  [ChainId.FANTOM]: undefined,
};

const ADD_BUFFER = {
  [ChainId.MAINNET]: true,
  [ChainId.ROPSTEN]: false,
  [ChainId.MATIC]: false,
  [ChainId.FANTOM]: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseGasPrice = (data: any, chainId: ChainId): BigNumber => {
  const buffer = ADD_BUFFER[chainId]
    ? parseUnits("5", "gwei")
    : parseUnits("0", "gwei");
  const gasPriceWithBuffer = data.fast
    ? parseUnits(data.fast.toString(), "gwei")
    : BigNumber.from(data.data.fast).add(buffer);
  return gasPriceWithBuffer;
};

export default function useGasPrice(): number | undefined {
  const { chainId } = useActiveWeb3React();
  const [gasPrice, setGasPrice] = useState<number>();

  const gasPriceCallback = useCallback(() => {
    if (chainId && GAS_STATION[chainId as ChainId]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fetch(GAS_STATION[chainId as ChainId]!)
        .then((res) => {
          res.json().then((gasInfo) => {
            setGasPrice(parseGasPrice(gasInfo, chainId).toNumber());
          });
        })
        .catch((error) =>
          console.error(
            `Failed to get gas price for chainId: ${chainId}`,
            error
          )
        );
    }
  }, [chainId, setGasPrice]);

  useInterval(
    gasPriceCallback,
    chainId && isEthereumChain(chainId)
      ? 15000
      : chainId && GAS_STATION[chainId as ChainId]
      ? 60000
      : null)

  return gasPrice;
}

export function useDerivedBurnInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  pair?: Pair | null
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: CurrencyAmount<Token>
    [Field.CURRENCY_A]?: CurrencyAmount<Currency>
    [Field.CURRENCY_B]?: CurrencyAmount<Currency>
  }
  error?: string
} {
  const { account } = useActiveWeb3React()

  const { independentField, typedValue } = useBurnState()

  // pair + totalsupply
  const [, pair] = useV2Pair(currencyA, currencyB)

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pair?.liquidityToken])
  const userLiquidity: undefined | CurrencyAmount<Token> = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  const [tokenA, tokenB] = [currencyA?.wrapped, currencyB?.wrapped]
  const tokens = {
    [Field.CURRENCY_A]: tokenA,
    [Field.CURRENCY_B]: tokenB,
    [Field.LIQUIDITY]: pair?.liquidityToken,
  }

  // liquidity values
  const totalSupply = useTotalSupply(pair?.liquidityToken)
  const liquidityValueA =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenA &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.quotient, userLiquidity.quotient)
      ? CurrencyAmount.fromRawAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity, false).quotient)
      : undefined
  const liquidityValueB =
    pair &&
    totalSupply &&
    userLiquidity &&
    tokenB &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.quotient, userLiquidity.quotient)
      ? CurrencyAmount.fromRawAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity, false).quotient)
      : undefined
  const liquidityValues: { [Field.CURRENCY_A]?: CurrencyAmount<Token>; [Field.CURRENCY_B]?: CurrencyAmount<Token> } = {
    [Field.CURRENCY_A]: liquidityValueA,
    [Field.CURRENCY_B]: liquidityValueB,
  }

  let percentToRemove: Percent = new Percent('0', '100')
  // user specified a %
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  }
  // user specified a specific amount of liquidity tokens
  else if (independentField === Field.LIQUIDITY) {
    if (pair?.liquidityToken) {
      const independentAmount = tryParseAmount(typedValue, pair.liquidityToken)
      if (independentAmount && userLiquidity && !independentAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentAmount.quotient, userLiquidity.quotient)
      }
    }
  }
  // user specified a specific amount of token a or b
  else {
    if (tokens[independentField]) {
      const independentAmount = tryParseAmount(typedValue, tokens[independentField])
      const liquidityValue = liquidityValues[independentField]
      if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
        percentToRemove = new Percent(independentAmount.quotient, liquidityValue.quotient)
      }
    }
  }

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: CurrencyAmount<Token>
    [Field.CURRENCY_A]?: CurrencyAmount<Currency>
    [Field.CURRENCY_B]?: CurrencyAmount<Currency>
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? CurrencyAmount.fromRawAmount(
            userLiquidity.currency,
            percentToRemove.multiply(userLiquidity.quotient).quotient
          )
        : undefined,
    [Field.CURRENCY_A]:
      tokenA && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueA
        ? CurrencyAmount.fromRawAmount(tokenA, percentToRemove.multiply(liquidityValueA.quotient).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueB
        ? CurrencyAmount.fromRawAmount(tokenB, percentToRemove.multiply(liquidityValueB.quotient).quotient)
        : undefined,
  }

  let error: string | undefined
  if (!account) {
    error = t`Connect Wallet`
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? t`Enter an amount`
  }

  return { pair, parsedAmounts, error }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useAppDispatch()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onUserInput,
  }
}
