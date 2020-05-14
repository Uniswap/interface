import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount, Pair, Trade, ChainId, WETH, Route, TradeType, Percent } from '@uniswap/sdk'
import useSWR from 'swr'

import IUniswapV1Factory from '../constants/abis/v1_factory.json'
import { V1_FACTORY_ADDRESS } from '../constants'
import { useContract } from '../hooks'
import { SWRKeys } from '.'
import { useETHBalances, useTokenBalances } from '../state/wallet/hooks'

function getV1PairAddress(contract: Contract): (_: SWRKeys, tokenAddress: string) => Promise<string> {
  return async (_: SWRKeys, tokenAddress: string): Promise<string> => contract.getExchange(tokenAddress)
}

function useV1PairAddress(tokenAddress: string) {
  const contract = useContract(V1_FACTORY_ADDRESS, IUniswapV1Factory, false)
  const shouldFetch = typeof tokenAddress === 'string' && !!contract

  const { data } = useSWR(shouldFetch ? [SWRKeys.V1PairAddress, tokenAddress] : null, getV1PairAddress(contract), {
    refreshInterval: 0 // don't need to update these
  })

  return data
}

function useMockV1Pair(token?: Token) {
  const mainnet = token?.chainId === ChainId.MAINNET
  const isWETH = token?.equals(WETH[ChainId.MAINNET])

  const v1PairAddress = useV1PairAddress(mainnet && !isWETH ? token?.address : undefined)
  const tokenBalance = useTokenBalances(v1PairAddress, [token])[token?.address]
  const ETHBalance = useETHBalances([v1PairAddress])[v1PairAddress]

  return tokenBalance && ETHBalance
    ? new Pair(tokenBalance, new TokenAmount(WETH[ChainId.MAINNET], ETHBalance.toString()))
    : undefined
}

export function useV1TradeLinkIfBetter(trade: Trade, minimumDelta: Percent = new Percent('0')): string {
  const inputPair = useMockV1Pair(trade?.route?.input)
  const outputPair = useMockV1Pair(trade?.route?.output)

  const mainnet = trade?.route?.input?.chainId === ChainId.MAINNET
  const inputIsWETH = mainnet && trade?.route?.input?.equals(WETH[ChainId.MAINNET])
  const outputIsWETH = mainnet && trade?.route?.output?.equals(WETH[ChainId.MAINNET])
  const neitherWETH = mainnet && !!trade && !inputIsWETH && !outputIsWETH

  let pairs: Pair[]
  if (inputIsWETH && outputPair) {
    pairs = [outputPair]
  } else if (outputIsWETH && inputPair) {
    pairs = [inputPair]
  } else if (neitherWETH && inputPair && outputPair) {
    pairs = [inputPair, outputPair]
  }

  const route = pairs && new Route(pairs, trade.route.input)
  const v1Trade =
    route &&
    new Trade(
      route,
      trade.tradeType === TradeType.EXACT_INPUT ? trade.inputAmount : trade.outputAmount,
      trade.tradeType
    )

  const v1HasBetterRate = v1Trade?.slippage?.add(minimumDelta)?.lessThan(trade?.slippage)

  return v1HasBetterRate
    ? `https://v1.uniswap.exchange/swap?inputCurrency=${
        inputIsWETH ? 'ETH' : trade.route.input.address
      }&outputCurrency=${outputIsWETH ? 'ETH' : trade.route.output.address}`
    : undefined
}
