import { AddressZero } from '@ethersproject/constants'
import {
  BigintIsh,
  Token,
  TokenAmount,
  currencyEquals,
  ETHER,
  JSBI,
  Pair,
  Percent,
  Route,
  Trade,
  TradeType,
} from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useAllTokens } from '../hooks/Tokens'
import { useOneSplit, useV1FactoryContract } from '../hooks/useContract'
import { Version } from '../hooks/useToggledVersion'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useTokenBalances } from '../state/wallet/hooks'
import {
  ETH_ADDRESS,
  FLAG_DISABLE_ALL_SPLIT_SOURCES,
  FLAG_DISABLE_ALL_WRAP_SOURCES, FLAG_DISABLE_MOONISWAP_ALL, ONE_SPLIT_ADDRESSES,
  ZERO_ADDRESS
} from '../constants/one-split'
import { PairState, usePair } from './Reserves'
import { BigNumber } from '@ethersproject/bignumber'
import { isUseOneSplitContract, maxUint256Div2 } from '../utils'
import { DAI, USDC } from '../constants'

export function useV1ExchangeAddress(tokenAddress?: string): string | undefined {
  const contract = useV1FactoryContract()

  const inputs = useMemo(() => [tokenAddress], [tokenAddress])
  return useSingleCallResult(contract, 'getExchange', inputs)?.result?.[0]
}

export class MockV1Pair extends Pair {
  constructor(etherAmount: BigintIsh, tokenAmount: TokenAmount) {
    super(tokenAmount, new TokenAmount(ETHER, etherAmount), '0x0001')
  }
}

function useMockV1Pair(inputCurrency?: Token): MockV1Pair | undefined {
  return useMemo(
    () =>
      undefined,
    []
  )
}

// returns all v1 exchange addresses in the user's token list
export function useAllTokenV1Exchanges(): { [exchangeAddress: string]: Token } {
  const allTokens = useAllTokens()
  const factory = useV1FactoryContract()
  const args = useMemo(() => Object.keys(allTokens).map(tokenAddress => [tokenAddress]), [allTokens])

  const data = useSingleContractMultipleData(factory, 'getExchange', args, NEVER_RELOAD)

  return useMemo(
    () =>
      data?.reduce<{ [exchangeAddress: string]: Token }>((memo, { result }, ix) => {
        if (result?.[0] && result[0] !== AddressZero) {
          memo[result[0]] = allTokens[args[ix][0]]
        }
        return memo
      }, {}) ?? {},
    [allTokens, args, data]
  )
}

// returns whether any of the tokens in the user's token list have liquidity on v1
export function useUserHasLiquidityInAllTokens(): boolean | undefined {
  const { account, chainId } = useActiveWeb3React()

  const exchanges = useAllTokenV1Exchanges()

  const v1ExchangeLiquidityTokens = useMemo(
    () =>
      chainId ? Object.keys(exchanges).map(address => new Token(chainId, address, 18, 'UNI-V1', 'Uniswap V1')) : [],
    [chainId, exchanges]
  )

  const balances = useTokenBalances(account ?? undefined, v1ExchangeLiquidityTokens)

  return useMemo(
    () =>
      Object.keys(balances).some(tokenAddress => {
        const b = balances[tokenAddress]?.raw
        return b && JSBI.greaterThan(b, JSBI.BigInt(0))
      }),
    [balances]
  )
}

/**
 * Returns the trade to execute on V1 to go between input and output token
 */
export function useV1Trade(
  isExactIn?: boolean,
  inputCurrency?: Token,
  outputCurrency?: Token,
  exactAmount?: TokenAmount
): Trade | undefined {
  // get the mock v1 pairs
  const inputPair = useMockV1Pair(inputCurrency)
  const outputPair = useMockV1Pair(outputCurrency)

  const inputIsETH = inputCurrency === ETHER
  const outputIsETH = outputCurrency === ETHER

  // construct a direct or through ETH v1 route
  let pairs: Pair[] = []
  if (inputIsETH && outputPair) {
    pairs = [outputPair]
  } else if (outputIsETH && inputPair) {
    pairs = [inputPair]
  }
  // if neither are ETH, it's token-to-token (if they both exist)
  else if (inputPair && outputPair) {
    pairs = [inputPair, outputPair]
  }

  const route = inputCurrency && pairs && pairs.length > 0 && new Route(pairs, inputCurrency, outputCurrency)
  let v1Trade: Trade | undefined
  try {
    v1Trade =
      route && exactAmount
        ? new Trade(route, exactAmount, isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT)
        : undefined
  } catch (error) {
    console.error('Failed to create V1 trade', error)
  }
  return v1Trade
}

export function getTradeVersion(trade?: Trade): Version | undefined {
  const isV1 = trade?.route?.pairs?.some(pair => pair instanceof MockV1Pair)
  if (isV1) return Version.v1
  if (isV1 === false) return Version.v2
  return undefined
}

// returns the v1 exchange against which a trade should be executed
export function useV1TradeExchangeAddress(trade: Trade | undefined): string | undefined {
  const tokenAddress: string | undefined = useMemo(() => {
    if (!trade) return undefined
    const isV1 = getTradeVersion(trade) === Version.v1
    if (!isV1) return undefined
    return trade.inputAmount instanceof TokenAmount
      ? trade.inputAmount.token.address
      : trade.outputAmount instanceof TokenAmount
      ? trade.outputAmount.token.address
      : undefined
  }, [trade])
  return useV1ExchangeAddress(tokenAddress)
}

const ZERO_PERCENT = new Percent('0')
const ONE_HUNDRED_PERCENT = new Percent('1')

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
export function isTradeBetter(
  tradeA: Trade | undefined,
  tradeB: Trade | undefined,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (!tradeA || !tradeB) return undefined

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.token, tradeB.inputAmount.token) ||
    !currencyEquals(tradeB.outputAmount.token, tradeB.outputAmount.token)
  ) {
    throw new Error('Trades are not comparable')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  } else {
    return tradeA.executionPrice.raw.multiply(minimumDelta.add(ONE_HUNDRED_PERCENT)).lessThan(tradeB.executionPrice)
  }
}


export function useMooniswapTrade(
  inputCurrency?: Token,
  outputCurrency?: Token,
  parseAmount?: TokenAmount
): [Trade, BigNumber[]] | [undefined, undefined] | undefined {
  let mooniswapTrade: Trade | undefined

  const amount = inputCurrency?.decimals && inputCurrency?.decimals !== 0
    ? parseAmount?.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(inputCurrency?.decimals))).toFixed(0)
    : parseAmount?.toFixed(0)

  const params = [
    inputCurrency?.address ? inputCurrency.address !== ZERO_ADDRESS ? inputCurrency.address : ETH_ADDRESS : ETH_ADDRESS,
    outputCurrency?.address ? outputCurrency.address !== ZERO_ADDRESS ? outputCurrency.address : ETH_ADDRESS : ETH_ADDRESS,
    amount,
    1,
    JSBI.add(FLAG_DISABLE_ALL_WRAP_SOURCES, JSBI.add(FLAG_DISABLE_ALL_SPLIT_SOURCES, FLAG_DISABLE_MOONISWAP_ALL)).toString()
  ]

  const poolPair = usePair(inputCurrency, outputCurrency)

  const poolPairOverEth = usePair(inputCurrency, ETHER)
  const poolPairOverDai = usePair(inputCurrency, DAI)
  const poolPairOverUsdc = usePair(inputCurrency, USDC)

  const poolPairUsdcToDest = usePair(USDC, outputCurrency)
  const poolPairDaiToDest = usePair(DAI, outputCurrency)
  const poolPairEthToDest = usePair(USDC, outputCurrency)

  const results = useSingleCallResult(useOneSplit(), 'getExpectedReturn', params)
  if(!inputCurrency || !outputCurrency || !parseAmount || !results.result) {
    return
  }

  const distribution = results.result.distribution

  const pairs: Pair[] = []
  if (!distribution[31].isZero() && poolPairOverEth[1] && poolPairEthToDest[1]) {
    pairs.push(poolPairOverEth[1])
    pairs.push(poolPairEthToDest[1])
  }
  if (!distribution[32].isZero() && poolPairOverDai[1] && poolPairDaiToDest[1]) {
    pairs.push(poolPairOverDai[1])
    pairs.push(poolPairDaiToDest[1])
  }
  if (!distribution[33].isZero() && poolPairOverUsdc[1] && poolPairUsdcToDest[1]) {
    pairs.push(poolPairOverUsdc[1])
    pairs.push(poolPairUsdcToDest[1])
  }
  if (!distribution[12].isZero() && poolPair[1]) {
    pairs.push(poolPair[1])
  }

  if (pairs.length === 0) {
    return
  }

  const exactAmount = new TokenAmount(outputCurrency, JSBI.BigInt(results.result.returnAmount))

  const route = inputCurrency && pairs && pairs.length > 0 && new Route(pairs, inputCurrency, outputCurrency)
  try {
    mooniswapTrade =
      route && exactAmount
        ? new Trade(route, exactAmount, TradeType.EXACT_OUTPUT)
        : undefined
  } catch (error) {
    console.error('Failed to create mooniswapTrade trade', error)
  }
  return [mooniswapTrade, results.result.distribution]
}
