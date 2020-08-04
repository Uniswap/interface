import { Pair, Token, TokenAmount } from '@uniswap/sdk'
import { useMemo } from 'react'
// import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { useActiveWeb3React } from '../hooks'

import { NEVER_RELOAD, usePoolAssetsBalances, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useMooniswapV1FactoryContract } from '../hooks/useContract'
// import { useCurrencyBalances } from '../state/wallet/hooks'
// import { V1_MOONISWAP_FACTORY_ADDRESSES } from '../constants/v1-mooniswap'

// const MOONISWAP_PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Token | undefined, Token | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(() =>
    currencies.map(([currencyA, currencyB]) => [currencyA, currencyB]),
    [chainId, currencies]
  )

  const tokenPairs: (string[] | undefined)[] = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        if (!tokenA || !tokenB) {
          return [ZERO_ADDRESS, ZERO_ADDRESS]
        }

        if (tokenA.isEther) {
          return [ZERO_ADDRESS, tokenB.address]
        }

        if (tokenB.isEther) {
          return [ZERO_ADDRESS, tokenA.address]
        }

        return [ZERO_ADDRESS, ZERO_ADDRESS]
      }),
    [tokens]
  )

  const results = useSingleContractMultipleData(useMooniswapV1FactoryContract(), 'pools', tokenPairs, NEVER_RELOAD)
  // const results = [{ result: ['0x10247d9370d54cc8ab93a3ebe67e9b5d668d2b1c'], loading: false }]

  const pools: { pool: string; tokenA: Token | undefined; tokenB: Token | undefined }[] = useMemo(() => {
    const defaultData = { pool: ZERO_ADDRESS, tokenA: undefined, tokenB: undefined }
    return results.map((res, i) => {
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (res.loading) return defaultData
      if (!tokenA || !tokenB) return defaultData
      if (tokenA.equals(tokenB)) return defaultData
      const poolAddress = res?.result?.[0]
      if (!res.result || poolAddress === ZERO_ADDRESS) {
        return defaultData
      }
      return { pool: poolAddress, tokenA: tokenA, tokenB: tokenB }
    })
  }, [results, tokens])
  //
  // const pools = poolAddresses.map(x => x.pool)
  // const tokenList = poolAddresses.map(x => [x.tokenA, x.tokenB])

  // const balances: (TokenAmount | undefined)[][] = [];
  // // todo: use something like useMultipleContractMultipleData() hook for multiple pool addresses
  // const x = useCurrencyBalancesFromManyAccounts(pools, );
  //
  const balances = usePoolAssetsBalances(pools);
  // for (let i = 0; i < pools.length; i++) {
  //
  //   // web3 -> getEthBalance
  //   //    ->
  //   //    ->
  //   //
  //   // Use Multiple -> Multiple
  //   //
  //   // x(poolAddresses) ->  [address, balanceA, balanceB]
  //   // useCurrencyBalances(pools: [poolAddress, tokenA, tokenB]) -> [balanceA, balanceB]
  //   // useCurrencyBalances(pools: [poolAddress, tokenA, tokenB]) -> [balanceA, balanceB]
  //
  //   const balancesResults = useCurrencyBalances(pools[0], tokenList[0])
  //   balances.push(balancesResults)
  // }

  return useMemo(() => {
    return results.map((res, i) => {
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (res.loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB) return [PairState.INVALID, null]
      if (tokenA.equals(tokenB)) return [PairState.INVALID, null]

      const bal = balances[i]
      if (!bal) return [PairState.LOADING, null]
      const balA = bal.amountA
      const balB = bal.amountB
      if (!balA || !balB) return [PairState.LOADING, null]

      const poolAddress = res.result?.[0]
      if (!res.result || poolAddress === ZERO_ADDRESS) {
        return [PairState.NOT_EXISTS, null]
      }

      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(tokenA, balA.raw.toString()),
          new TokenAmount(tokenB, balB.raw.toString()),
          poolAddress
        )
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Token, tokenB?: Token): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
