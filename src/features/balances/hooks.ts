import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { config } from 'src/config'
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

const ERC20Interface = new utils.Interface(ERC20_ABI)
const blocksPerFetchOption = { blocksPerFetch: BLOCKS_PER_FETCH }

export function useTokenBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): { balances: ChainIdTo<AddressTo<CurrencyAmount<Token>>>; loading: boolean } {
  const balances: ChainIdTo<AddressTo<CurrencyAmount<Token>>> = {}
  let loading = false
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])

  for (const chainId of config.activeChains) {
    balances[chainId] = {}

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sortedChainTokens = useMemo(
      () => getSortedChainTokens(chainId, chainIdToTokens),
      [chainId, chainIdToTokens]
    )
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tokenAddresses = useMemo(
      () => sortedChainTokens.map((t) => t.address),
      [sortedChainTokens]
    )
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const callStates = useMultipleContractSingleData(
      chainId,
      tokenAddresses,
      ERC20Interface,
      'balanceOf',
      accountAddressArray,
      blocksPerFetchOption
    )

    for (let i = 0; i < sortedChainTokens.length; i++) {
      const token = sortedChainTokens[i]
      const callState = callStates[i]
      if (callState.loading) {
        loading = true
      }
      const amount = callState.result?.[0]?.toString()
      if (amount) {
        balances[chainId]![token.address] = CurrencyAmount.fromRawAmount<Token>(token, amount)
      }
    }
  }
  return { balances, loading }
}

/** Returns an array of all nonzero balances of tokens and ETH */
export function useAllBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): CurrencyAmount<Currency>[] {
  const { balances: tokenBalances } = useTokenBalances(chainIds, chainIdToTokens, accountAddress)

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

function getSortedChainTokens(chainId: ChainId, chainIdToTokens: ChainIdToAddressToToken) {
  const tokens = Object.values(chainIdToTokens[chainId] || [])
  tokens.sort((a, b) => {
    return a.sortsBefore(b) ? -1 : 1
  })
  return tokens
}
