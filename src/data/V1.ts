import { ChainId, JSBI, Pair, Percent, Route, Token, TokenAmount, Trade, TradeType, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useAllTokens } from '../hooks/Tokens'
import { useV1FactoryContract } from '../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useETHBalances, useTokenBalance, useTokenBalances } from '../state/wallet/hooks'

function useV1PairAddress(tokenAddress?: string): string | undefined {
  const contract = useV1FactoryContract()

  const inputs = useMemo(() => [tokenAddress], [tokenAddress])
  return useSingleCallResult(contract, 'getExchange', inputs)?.result?.[0]
}

class MockV1Pair extends Pair {
  readonly isV1: true = true
}

function useMockV1Pair(token?: Token): MockV1Pair | undefined {
  const isWETH = token?.equals(WETH[token?.chainId])

  // will only return an address on mainnet, and not for WETH
  const v1PairAddress = useV1PairAddress(isWETH ? undefined : token?.address)
  const tokenBalance = useTokenBalance(v1PairAddress, token)
  const ETHBalance = useETHBalances([v1PairAddress])[v1PairAddress ?? '']

  return tokenBalance && ETHBalance && token
    ? new MockV1Pair(tokenBalance, new TokenAmount(WETH[token.chainId], ETHBalance.toString()))
    : undefined
}

// returns ALL v1 exchange addresses
export function useAllV1ExchangeAddresses(): string[] {
  const factory = useV1FactoryContract()
  const exchangeCount = useSingleCallResult(factory, 'tokenCount')?.result

  const parsedCount = parseInt(exchangeCount?.toString() ?? '0')

  const indices = useMemo(() => [...Array(parsedCount).keys()].map(ix => [ix]), [parsedCount])
  const data = useSingleContractMultipleData(factory, 'getTokenWithId', indices, NEVER_RELOAD)

  return useMemo(() => data?.map(({ result }) => result?.[0])?.filter(x => x) ?? [], [data])
}

// returns all v1 exchange addresses in the user's token list
export function useAllTokenV1ExchangeAddresses(): string[] {
  const allTokens = useAllTokens()
  const factory = useV1FactoryContract()
  const args = useMemo(() => Object.keys(allTokens).map(tokenAddress => [tokenAddress]), [allTokens])

  const data = useSingleContractMultipleData(factory, 'getExchange', args, NEVER_RELOAD)

  return useMemo(() => data?.map(({ result }) => result?.[0])?.filter(x => x) ?? [], [data])
}

// returns whether any of the tokens in the user's token list have liquidity on v1
export function useUserProbablyHasV1Liquidity(): boolean | undefined {
  const exchangeAddresses = useAllTokenV1ExchangeAddresses()

  const { account, chainId } = useActiveWeb3React()

  const fakeTokens = useMemo(
    () => (chainId ? exchangeAddresses.map(address => new Token(chainId, address, 18, 'UNI-V1')) : []),
    [chainId, exchangeAddresses]
  )

  const balances = useTokenBalances(account ?? undefined, fakeTokens)

  return useMemo(
    () =>
      Object.keys(balances).some(tokenAddress => {
        const b = balances[tokenAddress]?.raw
        return b && JSBI.greaterThan(b, JSBI.BigInt(0))
      }),
    [balances]
  )
}

export function useV1TradeLinkIfBetter(
  isExactIn?: boolean,
  input?: Token,
  output?: Token,
  exactAmount?: TokenAmount,
  v2Trade?: Trade,
  minimumDelta: Percent = new Percent('0')
): string | undefined {
  const { chainId } = useActiveWeb3React()

  const isMainnet: boolean = chainId === ChainId.MAINNET

  // get the mock v1 pairs
  const inputPair = useMockV1Pair(input)
  const outputPair = useMockV1Pair(output)

  const inputIsWETH = isMainnet && input?.equals(WETH[ChainId.MAINNET])
  const outputIsWETH = isMainnet && output?.equals(WETH[ChainId.MAINNET])

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

  const route = input && pairs && pairs.length > 0 && new Route(pairs, input)
  let v1Trade: Trade | undefined
  try {
    v1Trade =
      route && exactAmount
        ? new Trade(route, exactAmount, isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT)
        : undefined
  } catch {}

  let v1HasBetterTrade = false
  if (v1Trade) {
    if (isExactIn) {
      // discount the v1 output amount by minimumDelta
      const discountedV1Output = v1Trade?.outputAmount.multiply(new Percent('1').subtract(minimumDelta))
      // check if the discounted v1 amount is still greater than v2, short-circuiting if no v2 trade exists
      v1HasBetterTrade = !v2Trade || discountedV1Output.greaterThan(v2Trade.outputAmount)
    } else {
      // inflate the v1 amount by minimumDelta
      const inflatedV1Input = v1Trade?.inputAmount.multiply(new Percent('1').add(minimumDelta))
      // check if the inflated v1 amount is still less than v2, short-circuiting if no v2 trade exists
      v1HasBetterTrade = !v2Trade || inflatedV1Input.lessThan(v2Trade.inputAmount)
    }
  }

  return v1HasBetterTrade && input && output
    ? `https://v1.uniswap.exchange/swap?inputCurrency=${inputIsWETH ? 'ETH' : input.address}&outputCurrency=${
        outputIsWETH ? 'ETH' : output.address
      }`
    : undefined
}
