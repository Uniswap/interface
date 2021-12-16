import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { ChainId, ChainIdTo, ChainIdToAddressTo } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from 'src/features/multicall'
import { ChainIdToAddressToToken } from 'src/features/tokens/types'
import { currencyId } from 'src/utils/currencyId'
import { flattenChainIdToAddressTo } from 'src/utils/objects'

type ChainIdToAddressToCurrencyAmount = ChainIdToAddressTo<CurrencyAmount<Currency>>

const BLOCKS_PER_FETCH = 10
const ERC20Interface = new utils.Interface(ERC20_ABI)
const blocksPerFetchOption = { blocksPerFetch: BLOCKS_PER_FETCH }

// TODO: move balances to store?
export function useTokenBalance(
  token: Token | undefined,
  accountAddress?: Address
): [CurrencyAmount<Currency> | undefined, boolean] {
  const chainId = token?.chainId ?? ChainId.MAINNET
  const contract = useTokenContract(chainId, token?.address)
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  const balance = useSingleCallResult(
    chainId,
    contract,
    'balanceOf',
    accountAddressArray,
    blocksPerFetchOption
  )

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
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  const result = useSingleCallResult(
    chainId,
    multicallContract,
    'getEthBalance',
    accountAddressArray,
    blocksPerFetchOption
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

export function useEthBalances(
  chainIds: ChainId[],
  accountAddress?: Address
): {
  balances: ChainIdTo<AddressTo<CurrencyAmount<Ether>>>
  loading: boolean
} {
  const balances: ChainIdTo<AddressTo<CurrencyAmount<Ether>>> = {}
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
      const currencyAmount = CurrencyAmount.fromRawAmount(Ether.onChain(chainId), amount)
      balances[chainId] ??= {}
      balances[chainId]![currencyId(currencyAmount.currency)] = currencyAmount
    }
  }

  return { balances, loading }
}

/** returns a mapping of chainId to address to CurrencyAmount */
export function useAllBalancesByChainId(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): {
  balances: ChainIdToAddressToCurrencyAmount
  loading: boolean
} {
  const { balances: tokenBalances, loading: tokenBalancesLoading } = useTokenBalances(
    chainIds,
    chainIdToTokens,
    accountAddress
  )

  const { balances: ethBalances, loading: ethBalancesLoading } = useEthBalances(
    chainIds,
    accountAddress
  )

  return {
    loading: tokenBalancesLoading || ethBalancesLoading,
    balances: Object.assign(ethBalances, tokenBalances) as ChainIdToAddressToCurrencyAmount,
  }
}

/** returns a list of `CurrencyAmount<Currency>`s representing non-zero user balances */
export function useAllBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): {
  allCurrencyAmounts: CurrencyAmount<Currency>[]
  balances: CurrencyAmount<Currency>[]
  loading: boolean
} {
  const { balances: balanceList, loading } = useAllBalancesByChainId(
    chainIds,
    chainIdToTokens,
    accountAddress
  )

  const allCurrencyAmounts = flattenChainIdToAddressTo(balanceList)

  const balances = allCurrencyAmounts.filter(
    (currencyAmount: CurrencyAmount<Currency>) => !!currencyAmount?.greaterThan(0)
  )

  return { balances, allCurrencyAmounts, loading }
}

function getSortedChainTokens(chainId: ChainId, chainIdToTokens: ChainIdToAddressToToken) {
  const tokens = Object.values(chainIdToTokens[chainId] || [])
  tokens.sort((a, b) => {
    return a.sortsBefore(b) ? -1 : 1
  })
  return tokens
}
