import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20Interface } from 'src/abis/types/Erc20'
import { ChainId } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
} from 'src/features/multicall'
import { ChainIdToAddressToToken } from 'src/features/tokens/types'
import { isValidAddress } from 'src/utils/addresses'

// TODO: Set to fetch every 5 blocks, can adjust this number as necessary

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
): CurrencyAmount<Currency> | null {
  const multicallContract = useMulticall2Contract(chainId)
  const result = useSingleCallResult(
    chainId,
    multicallContract,
    'getEthBalance',
    [accountAddress],
    { blocksPerFetch: BLOCKS_PER_FETCH }
  )
  const value = result?.result?.[0]
  if (!value) return null
  return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), value?.toString())
}

export function useTokenBalances(
  chainId: ChainId,
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): [{ [tokenAddress: string]: CurrencyAmount<Token> } | null | undefined, boolean] {
  const tokenRecords = chainIdToTokens[chainId]
  const tokens = tokenRecords ? Object.values(tokenRecords) : undefined
  const tokenAddresses = tokens?.map((token) => token.address) ?? []
  const ERC20Interface = new utils.Interface(ERC20_ABI) as Erc20Interface

  const balances = useMultipleContractSingleData(
    chainId,
    tokenAddresses,
    ERC20Interface,
    'balanceOf',
    [accountAddress],
    { blocksPerFetch: BLOCKS_PER_FETCH }
  )

  const anyLoading: boolean = useMemo(
    () => balances.some((callState) => callState.loading),
    [balances]
  )

  return [
    useMemo(
      () =>
        tokens?.reduce<{
          [tokenAddress: string]: CurrencyAmount<Token>
        }>((memo, token, i) => {
          const value = balances?.[i]?.result?.[0]
          const amount = value?.toString()
          if (amount) {
            memo[token.address] = CurrencyAmount.fromRawAmount<Token>(token, amount)
          }
          return memo
        }, {}),
      [balances, tokens]
    ),
    anyLoading,
  ]
}

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
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
