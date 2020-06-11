import { JSBI, Pair, Percent, Route, Token, TokenAmount, Trade, TradeType, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useAllTokens } from '../hooks/Tokens'
import { useV1FactoryContract } from '../hooks/useContract'
import { Version } from '../hooks/useToggledVersion'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useETHBalances, useTokenBalance, useTokenBalances } from '../state/wallet/hooks'

export function useV1ExchangeAddress(tokenAddress?: string): string | undefined {
  const contract = useV1FactoryContract()

  const inputs = useMemo(() => [tokenAddress], [tokenAddress])
  return useSingleCallResult(contract, 'getExchange', inputs)?.result?.[0]
}

class MockV1Pair extends Pair {}

function useMockV1Pair(token?: Token): MockV1Pair | undefined {
  const isWETH: boolean = token && WETH[token.chainId] ? token.equals(WETH[token.chainId]) : false

  const v1PairAddress = useV1ExchangeAddress(isWETH ? undefined : token?.address)
  const tokenBalance = useTokenBalance(v1PairAddress, token)
  const ETHBalance = useETHBalances([v1PairAddress])[v1PairAddress ?? '']

  return tokenBalance && ETHBalance && token
    ? new MockV1Pair(tokenBalance, new TokenAmount(WETH[token.chainId], ETHBalance.toString()))
    : undefined
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
        const token = allTokens[args[ix][0]]
        if (result?.[0]) {
          memo[result[0]] = token
        }
        return memo
      }, {}) ?? {},
    [allTokens, args, data]
  )
}

// returns whether any of the tokens in the user's token list have liquidity on v1
export function useUserHasLiquidityInAllTokens(): boolean | undefined {
  const exchanges = useAllTokenV1Exchanges()

  const { account, chainId } = useActiveWeb3React()

  const fakeLiquidityTokens = useMemo(
    () => (chainId ? Object.keys(exchanges).map(address => new Token(chainId, address, 18, 'UNI-V1')) : []),
    [chainId, exchanges]
  )

  const balances = useTokenBalances(account ?? undefined, fakeLiquidityTokens)

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
  inputToken?: Token,
  outputToken?: Token,
  exactAmount?: TokenAmount
): Trade | undefined {
  const { chainId } = useActiveWeb3React()

  // get the mock v1 pairs
  const inputPair = useMockV1Pair(inputToken)
  const outputPair = useMockV1Pair(outputToken)

  const inputIsWETH = (inputToken && chainId && WETH[chainId] && inputToken.equals(WETH[chainId])) ?? false
  const outputIsWETH = (outputToken && chainId && WETH[chainId] && outputToken.equals(WETH[chainId])) ?? false

  // construct a direct or through ETH v1 route
  let pairs: Pair[] = []
  if (inputIsWETH && outputPair) {
    pairs = [outputPair]
  } else if (outputIsWETH && inputPair) {
    pairs = [inputPair]
  }
  // if neither are WETH, it's token-to-token (if they both exist)
  else if (inputPair && outputPair) {
    pairs = [inputPair, outputPair]
  }

  const route = inputToken && pairs && pairs.length > 0 && new Route(pairs, inputToken)
  let v1Trade: Trade | undefined
  try {
    v1Trade =
      route && exactAmount
        ? new Trade(route, exactAmount, isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT)
        : undefined
  } catch {}
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
    const tradeVersion = getTradeVersion(trade)
    const isV1 = tradeVersion === Version.v1
    return isV1
      ? trade &&
        WETH[trade.inputAmount.token.chainId] &&
        trade.inputAmount.token.equals(WETH[trade.inputAmount.token.chainId])
        ? trade.outputAmount.token.address
        : trade?.inputAmount?.token?.address
      : undefined
  }, [trade])
  return useV1ExchangeAddress(tokenAddress)
}

const ZERO_PERCENT = new Percent('0')
const ONE_HUNDRED_PERCENT = new Percent('1')
// returns whether tradeB is better than tradeA by at least a threshold
export function isTradeBetter(
  tradeA: Trade | undefined,
  tradeB: Trade | undefined,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (!tradeA || !tradeB) return undefined

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.token.equals(tradeB.inputAmount.token) ||
    !tradeB.outputAmount.token.equals(tradeB.outputAmount.token)
  ) {
    throw new Error('Trades are not comparable')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  } else {
    return tradeA.executionPrice.raw.multiply(minimumDelta.add(ONE_HUNDRED_PERCENT)).lessThan(tradeB.executionPrice)
  }
}
