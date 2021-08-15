import { Currency, CurrencyAmount, JSBI, Token, TokenAmount } from 'dxswap-sdk'
import { useMemo } from 'react'
import ERC20_INTERFACE from '../../constants/abis/erc20'
import { useAllTokens } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { isAddress } from '../../utils' 
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../multicall/hooks'
import { useMulticallContract } from '../../hooks/useContract'

export function useNativeCurrencyBalance(): CurrencyAmount | undefined {
  const { chainId, account } = useActiveWeb3React()
  const multicallContract = useMulticallContract()

  const results = useSingleContractMultipleData(
    multicallContract,
    // the name is misleading. Depending on the deployment network, the
    // function returns the native currency balance
    'getEthBalance',
    account ? [[account]] : []
  )

  return useMemo(() => {
    if (!chainId) return
    const value = results?.[0]?.result?.[0]
    if (!value) return
    return CurrencyAmount.nativeCurrency(JSBI.BigInt(value.toString()), chainId)
  }, [results, chainId])
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])

  const balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20_INTERFACE, 'balanceOf', [address])

  const anyLoading: boolean = useMemo(() => balances.some(callState => callState.loading), [balances])

  return useMemo(() => {
    if (!address || validatedTokens.length === 0) return [{}, anyLoading]
    return [
      validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
        const value = balances?.[i]?.result?.[0]
        const amount = value ? JSBI.BigInt(value.toString()) : undefined
        if (amount) {
          memo[token.address] = new TokenAmount(token, amount)
        }
        return memo
      }, {}),
      anyLoading
    ]
  }, [address, anyLoading, balances, validatedTokens])
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const memoizedTokenArray = useMemo(() => [token], [token])
  const tokenBalances = useTokenBalances(account, memoizedTokenArray)
  return useMemo(() => {
    if (!token) return undefined
    return tokenBalances[token.address]
  }, [tokenBalances, token])
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount | undefined)[] {
  const tokens = useMemo(() => currencies?.filter((currency): currency is Token => currency instanceof Token) ?? [], [
    currencies
  ])

  const tokenBalances = useTokenBalances(account, tokens)
  const nativeCurrencyBalance = useNativeCurrencyBalance()

  return useMemo(
    () =>
      currencies?.map(currency => {
        if (!account || !currency) return undefined
        if (currency instanceof Token) return tokenBalances[currency.address]
        if (Currency.isNative(currency)) return nativeCurrencyBalance
        return undefined
      }) ?? [],
    [account, currencies, nativeCurrencyBalance, tokenBalances]
  )
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount | undefined {
  return useCurrencyBalances(account, [currency])[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: TokenAmount | undefined } {
  const { account } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalances(account ?? undefined, allTokensArray)
  return useMemo(() => balances ?? {}, [balances])
}
