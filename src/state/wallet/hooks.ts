import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId as UbeswapChainId, JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { UBE } from 'constants/tokens'
import { useAsyncState } from 'hooks/useAsyncState'
import { useCallback, useMemo } from 'react'
import { AbiItem } from 'web3-utils'

import { ERC20_ABI } from '../../constants/abis/erc20'
import { useAllTokens } from '../../hooks/Tokens'
import { isAddress } from '../../utils'

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const { kit } = useContractKit()

  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])

  const call = useCallback(
    async () => {
      return await Promise.all(
        validatedTokenAddresses.map((tokenAddress) => {
          const token = new kit.web3.eth.Contract(ERC20_ABI as AbiItem[], tokenAddress)
          return token.methods.balanceOf(address).call()
        })
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kit, validatedTokenAddresses[0]]
  )
  const [balances] = useAsyncState(
    validatedTokenAddresses.map(() => null),
    call
  )

  // const balances = validatedTokenAddresses.map(() => null)
  const anyLoading: boolean = useMemo(() => balances.some((balance) => balance === null), [balances])

  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
              const value = balances?.[i]
              const amount = value ? JSBI.BigInt(value.toString()) : undefined
              if (amount) {
                memo[token.address] = new TokenAmount(token, amount)
              }
              return memo
            }, {})
          : {},
      [address, validatedTokens, balances]
    ),
    anyLoading,
  ]
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(account?: string, currencies?: (Token | undefined)[]): (TokenAmount | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency instanceof Token) ?? [],
    [currencies]
  )

  const tokenBalances = useTokenBalances(account, tokens)

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency) return undefined
        if (currency instanceof Token) return tokenBalances[currency.address]
        return undefined
      }) ?? [],
    [account, currencies, tokenBalances]
  )
}

export function useCurrencyBalance(account?: string, currency?: Token): TokenAmount | undefined {
  return useCurrencyBalances(account, [currency])[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: TokenAmount | undefined } {
  const { address: account } = useContractKit()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalances(account ?? undefined, allTokensArray)
  return balances ?? {}
}

// get the total owned, unclaimed, and unharvested UBE for account
export function useAggregateUbeBalance(): TokenAmount | undefined {
  const {
    address,
    network: { chainId },
  } = useContractKit()

  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined

  const ubeBalance: TokenAmount | undefined = useTokenBalance(address ?? undefined, ube)

  if (!ube) return undefined

  return ubeBalance
}
