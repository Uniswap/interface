import { TokenAmount, Pair, Currency, Token, ETHER } from '@uniswap/sdk'
import { useMemo } from 'react'
// import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { NEVER_RELOAD, useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { normalizeToken } from '../utils/wrappedCurrency'
import { useMooniswapV1FactoryContract } from '../hooks/useContract'
import {
  useCurrencyBalances,
  // useCurrencyBalances,
  useTokenBalances
} from '../state/wallet/hooks'
// import { V1_MOONISWAP_FACTORY_ADDRESSES } from '../constants/v1-mooniswap'
import ERC20ABI from '../constants/abis/erc20.json'
import { useCurrency } from '../hooks/Tokens'

// const MOONISWAP_PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA, currencyB]),
    [chainId, currencies]
  )

  const tokenPairs: (string[] | undefined)[] = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        if (!tokenA || !tokenB) {
          return [ZERO_ADDRESS, ZERO_ADDRESS]
        }
        if (tokenA instanceof Token && tokenB instanceof Token) {
          return !tokenA.equals(tokenB)
            ? [tokenA.address, tokenB.address]
            : [ZERO_ADDRESS, ZERO_ADDRESS]
        }

        if (tokenA instanceof Token) {
          return [ZERO_ADDRESS, tokenA.address]
        }

        if (tokenB instanceof Token) {
          return [ZERO_ADDRESS, tokenB.address]
        }

        return [ZERO_ADDRESS, ZERO_ADDRESS]
      }),
    [tokens]
  )

  const results = useSingleContractMultipleData(useMooniswapV1FactoryContract(), 'pools', tokenPairs, NEVER_RELOAD)
  // const results = [{ result: ['0x10247d9370d54cc8ab93a3ebe67e9b5d668d2b1c'], loading: false }]

  const poolAddresses: { pool: string; tokenA: Currency | undefined; tokenB: Currency | undefined }[] = useMemo(() => {
    const defaultData = { pool: ZERO_ADDRESS, tokenA: undefined, tokenB: undefined }
    return results.map((res, i) => {
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (res.loading) return defaultData
      if (!tokenA || !tokenB) return defaultData
      if (tokenA instanceof Token && tokenB instanceof Token) {
        if (tokenA.equals(tokenB)) return defaultData
      }
      const poolAddress = res?.result?.[0]
      if (!res.result || poolAddress === ZERO_ADDRESS) {
        return defaultData
      }
      return { pool: poolAddress, tokenA: tokenA as Currency, tokenB: tokenB as Currency }
    })
  }, [results, tokens])
  const pools = poolAddresses.map(x => x.pool)
  const tokenList = poolAddresses.map(x => [x.tokenA, x.tokenB]).flat()
  const balResults = useCurrencyBalances(pools[0], tokenList)

  return useMemo(() => {
    return results.map((res, i) => {
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (res.loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB) return [PairState.INVALID, null]
      if (tokenA instanceof Token && tokenB instanceof Token) {
        if (tokenA.equals(tokenB)) return [PairState.INVALID, null]
      }

      if (!balResults[0]) return [PairState.LOADING, null]
      if (!balResults[1]) return [PairState.LOADING, null]

      const poolAddress = res.result?.[0]
      if (!res.result || poolAddress === '0x0000000000000000000000000000000000000000') {
        return [PairState.NOT_EXISTS, null]
      }

      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(tokenA as Token, balResults[0].raw.toString()),
          new TokenAmount(tokenB as Token, balResults[1].raw.toString())
        )
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
