import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from 'src/features/multicall'
import { ChainIdToAddressToToken } from 'src/features/tokens/types'

const BLOCKS_PER_FETCH = 3
const ERC20Interface = new utils.Interface(ERC20_ABI)
const blocksPerFetchOption = { blocksPerFetch: BLOCKS_PER_FETCH }

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
) {
  const balances: ChainIdTo<AddressTo<CurrencyAmount<Token>>> = {}
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  let loading = false

  for (const chainId of chainIds) {
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
      if (callState?.loading) {
        loading = true
      }
      const amount = callState?.result?.[0]?.toString()
      if (amount) {
        balances[chainId]![token.address] = CurrencyAmount.fromRawAmount(token, amount)
      }
    }
  }
  return { balances, loading }
}

export function useEthBalances(chainIds: ChainId[], accountAddress?: Address) {
  const balances: ChainIdTo<CurrencyAmount<Ether>> = {}
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  let loading = false

  for (const chainId of chainIds) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const multicallContract = useMulticall2Contract(chainId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const callState = useSingleCallResult(
      chainId,
      multicallContract,
      'getEthBalance',
      accountAddressArray,
      blocksPerFetchOption
    )

    if (callState?.loading) {
      loading = true
    }
    const amount = callState?.result?.[0]?.toString()
    if (amount) {
      balances[chainId] = CurrencyAmount.fromRawAmount(Ether.onChain(chainId), amount)
    }
  }

  return { balances, loading }
}

/** Returns an array of all nonzero balances of tokens and ETH */
export function useAllBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
) {
  const { balances: tokenBalances, loading: tokenBalancesLoading } = useTokenBalances(
    chainIds,
    chainIdToTokens,
    accountAddress
  )

  const { balances: ethBalances, loading: ethBalancesLoading } = useEthBalances(
    chainIds,
    accountAddress
  )

  // Note: considered use of useMemo here but would
  // not help since balances is a new object each call anyway
  const ethBalancesList = Object.values(ethBalances)
  const filteredEthBalances = ethBalancesList.filter((balance) => !!balance?.greaterThan(0))
  const tokenBalancesList = Object.values(tokenBalances)
    .map((chainTokenBalances) => Object.values(chainTokenBalances))
    .flat()
  const filteredTokenBalances = tokenBalancesList.filter((balance) => !!balance?.greaterThan(0))
  const balances = [...filteredEthBalances, ...filteredTokenBalances]

  const loading = tokenBalancesLoading || ethBalancesLoading

  return { balances, loading }
}

function getSortedChainTokens(chainId: ChainId, chainIdToTokens: ChainIdToAddressToToken) {
  const tokens = Object.values(chainIdToTokens[chainId] || [])
  tokens.sort((a, b) => {
    return a.sortsBefore(b) ? -1 : 1
  })
  return tokens
}
