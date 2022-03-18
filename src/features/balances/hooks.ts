import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId, ChainIdToCurrencyIdTo } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
export type ChainIdToCurrencyIdToCurrencyAmount = ChainIdToCurrencyIdTo<CurrencyAmount<Currency>>
export type ChainIdToCurrencyIdToNativeCurrencyAmount = ChainIdToCurrencyIdTo<
  CurrencyAmount<NativeCurrency>
>
export type ChainIdToCurrencyIdToTokenAmount = ChainIdToCurrencyIdTo<CurrencyAmount<Token>>

const BLOCKS_PER_FETCH = 3
const blocksPerFetchOption = { blocksPerFetch: BLOCKS_PER_FETCH }

// TODO: refactor `features/balances` to process on chain balances
export function useTokenBalance(
  token: Token | undefined,
  accountAddress?: Address
): { balance: CurrencyAmount<Currency> | undefined; loading: boolean } {
  const chainId = token?.chainId ?? ChainId.Mainnet
  const contract = useTokenContract(chainId, token?.address)
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])

  const callState = useSingleCallResult(
    chainId,
    contract,
    'balanceOf',
    accountAddressArray,
    blocksPerFetchOption
  )

  const currencyAmount = useMemo(() => {
    const value = callState.result?.[0]
    const amount = value?.toString()
    return amount && token ? CurrencyAmount.fromRawAmount<Token>(token, amount) : undefined
  }, [callState.result, token])

  return { balance: currencyAmount, loading: callState.loading }
}

export function useNativeCurrencyBalance(
  chainId: ChainId,
  accountAddress?: Address
): { balance: CurrencyAmount<Currency>; loading: boolean } {
  const multicallContract = useMulticall2Contract(chainId)
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])

  const callState = useSingleCallResult(
    chainId,
    multicallContract,
    'getEthBalance',
    accountAddressArray,
    blocksPerFetchOption
  )

  const loading = callState.loading
  const balance = useMemo(() => {
    const value = callState.result?.[0]
    if (!value) return CurrencyAmount.fromRawAmount(NativeCurrency.onChain(chainId), 0)
    return CurrencyAmount.fromRawAmount(NativeCurrency.onChain(chainId), value.toString())
  }, [callState, chainId])

  return { balance, loading }
}
