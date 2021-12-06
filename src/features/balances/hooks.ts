import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20Interface } from 'src/abis/types/Erc20'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
} from 'src/features/multicall'
import { ChainIdToAddressToToken } from 'src/features/tokens/types'
import { isValidAddress } from 'src/utils/addresses'

const BLOCKS_PER_FETCH = 5

// TODO: move balances to store?
export function useTokenBalance(
  token: Token | undefined,
  accountAddress?: Address
): [CurrencyAmount<Currency> | undefined, boolean] {
  const chainId = token?.chainId ?? ChainId.MAINNET
  const contract = useTokenContract(chainId, token?.address)
  const balance = useSingleCallResult(chainId, contract, 'balanceOf', [accountAddress], {
    blocksPerFetch: BLOCKS_PER_FETCH,
  })

  return [
    useMemo(() => {
      const value = balance.result?.[0]
      const amount = value?.toString()
      return amount && token ? CurrencyAmount.fromRawAmount<Token>(token, amount) : undefined
    }, [balance.result, token]),
    balance.loading,
  ]
}

export function useEthBalance(
  chainId: ChainId,
  accountAddress?: Address
): CurrencyAmount<Currency> {
  const multicallContract = useMulticall2Contract(chainId)
  const result = useSingleCallResult(
    chainId,
    multicallContract,
    'getEthBalance',
    [accountAddress],
    { blocksPerFetch: BLOCKS_PER_FETCH }
  )
  const value = result?.result?.[0]
  if (!value) return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), 0)
  return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), value?.toString())
}

export function useTokenBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): [ChainIdTo<Record<string, CurrencyAmount<Token>>> | null, boolean] {
  const ERC20Interface = new utils.Interface(ERC20_ABI) as Erc20Interface
  const totalBalances = chainIds.map((chainId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tokenAddresses = useMemo(() => {
      const tokenRecords = chainIdToTokens[chainId] || []
      const tokens = Object.values(tokenRecords)
      return tokens.map((token) => token.address)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainId, chainIdToTokens])

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMultipleContractSingleData(
      chainId,
      tokenAddresses,
      ERC20Interface,
      'balanceOf',
      [accountAddress],
      { blocksPerFetch: BLOCKS_PER_FETCH }
    )
  })

  const anyLoading: boolean = useMemo(
    () => totalBalances.some((callState) => callState.some((call) => call.loading)),
    [totalBalances]
  )

  return [
    useMemo(
      () =>
        chainIds.reduce<{
          [chainId: string]: { [tokenAddress: string]: CurrencyAmount<Token> }
        }>((memo, chainId) => {
          const tokenRecords = chainIdToTokens[chainId] || []
          const tokens = Object.values(tokenRecords)
          const t = tokens.reduce<{
            [tokenAddress: string]: CurrencyAmount<Token>
          }>((chainTokensMemo, token, i) => {
            const value = totalBalances[chainId]?.[i]?.result?.[0]
            const amount = value?.toString()
            if (amount) {
              chainTokensMemo[token.address] = CurrencyAmount.fromRawAmount<Token>(token, amount)
            }
            return chainTokensMemo
          }, {})

          memo[chainId] = t
          return memo
        }, {}),
      [totalBalances, chainIdToTokens, chainIds]
    ),
    anyLoading,
  ]
}

/** Returns an array of all nonzero balances of tokens and ETH */
export function useAllBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): CurrencyAmount<Currency>[] {
  const [tokenBalances] = useTokenBalances(chainIds, chainIdToTokens, accountAddress)

  // Use hook in callback with guaranteed execution order
  const ethBalances = chainIds
    // eslint-disable-next-line react-hooks/rules-of-hooks
    .map((chainId) => useEthBalance(chainId, accountAddress))
    .filter((balance) => balance.greaterThan(0))

  const allTokenBalances: CurrencyAmount<Currency>[] = Object.values(tokenBalances ?? {})
    .map((chainTokenBalances) => Object.values(chainTokenBalances))
    .flat()
    .filter((balance) => balance && balance.greaterThan(0))

  const balances = ethBalances.length > 0 ? [...ethBalances, ...allTokenBalances] : allTokenBalances
  return balances
}
/* Returns a map of the given addresses to their eventually consistent ETH balances. */
export function useEthBalances(
  chainId: ChainId,
  uncheckedAddresses?: Address[]
): {
  [address: string]: CurrencyAmount<Currency>
} {
  const addresses = useMemo(
    () => (uncheckedAddresses ? uncheckedAddresses.filter((a) => isValidAddress(a)).sort() : []),
    [uncheckedAddresses]
  )
  const multicallContract = useMulticall2Contract(chainId)

  const results = useSingleContractMultipleData(
    chainId,
    multicallContract,
    'getEthBalance',
    addresses.map((address) => [address]),
    { blocksPerFetch: BLOCKS_PER_FETCH }
  )

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: CurrencyAmount<Currency> }>((memo, address, i) => {
        const value = results?.[i]?.result?.[0]
        if (value && chainId)
          memo[address] = CurrencyAmount.fromRawAmount(Ether.onChain(chainId), value.toString())
        return memo
      }, {}),
    [addresses, chainId, results]
  )
}
