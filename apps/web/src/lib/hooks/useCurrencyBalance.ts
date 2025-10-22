import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useTokenBalances } from 'hooks/useTokenBalances'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { currencyKey } from 'utils/currencyKey'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useBalance, useReadContracts } from 'wagmi'

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useRpcTokenBalancesWithLoadingIndicator({
  address,
  tokens,
  skip,
}: {
  address?: string
  tokens?: (Token | undefined)[]
  skip?: boolean
}): [{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }, boolean] {
  const { chainId } = useAccount()
  const validatedTokens: Token[] = useMemo(
    () =>
      skip
        ? []
        : (tokens?.filter((t?: Token): t is Token => isEVMAddress(t?.address) !== false && t.chainId === chainId) ??
          []),
    [chainId, tokens, skip],
  )

  const { data, isLoading: balancesLoading } = useReadContracts({
    contracts: useMemo(
      () =>
        validatedTokens.map(
          (token) =>
            ({
              address: assume0xAddress(token.address),
              chainId,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address],
            }) as const,
        ),
      [address, chainId, validatedTokens],
    ),
    query: { enabled: !!address },
  })

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? // eslint-disable-next-line max-params
          validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }>((memo, token, i) => {
            const value = data?.[i].result
            if (!value) {
              return memo
            }

            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
            }
            return memo
          }, {})
        : {},
      balancesLoading,
    ],
    [address, validatedTokens, balancesLoading, data],
  )
}

function useRpcTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[],
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  return useRpcTokenBalancesWithLoadingIndicator({ address, tokens })[0]
}

function useRpcCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? [],
    [currencies],
  )

  const { chainId } = useAccount()
  const tokenBalances = useRpcTokenBalances(account, tokens)
  const containsETH: boolean = useMemo(() => currencies?.some((currency) => currency?.isNative) ?? false, [currencies])
  const { data: nativeBalance } = useBalance({
    address: assume0xAddress(account),
    chainId,
    query: { enabled: containsETH && !!account },
  })

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency || currency.chainId !== chainId) {
          return undefined
        }

        if (currency.isToken) {
          return tokenBalances[currency.address]
        } else if (nativeBalance?.value) {
          return CurrencyAmount.fromRawAmount(currency, nativeBalance.value.toString())
        } else {
          return undefined
        }
      }) ?? [],
    [account, chainId, currencies, nativeBalance?.value, tokenBalances],
  )
}

/**
 * Returns raw balances as CurrencyAmounts for tokens in users balanceMap via graphql.
 * Balances from graphql are used as a fallback when user is not connected to chain.
 * Currently they're returned from graphql formatted so we need to convert to the base unit.
 */
function useGqlCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const { balanceMap } = useTokenBalances({ cacheOnly: true })

  return useMemo(() => {
    if (!account || !currencies) {
      return []
    }

    return currencies.map((currency) => {
      if (!currency) {
        return undefined
      }

      const key = currencyKey(currency)
      const balance = balanceMap[key]

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (balance) {
        const currencyAmount = getCurrencyAmount({
          value: balance.balance.toString(),
          valueType: ValueType.Exact,
          currency,
        })
        if (!currencyAmount) {
          return undefined
        }
        return currencyAmount
      } else {
        return CurrencyAmount.fromRawAmount(currency, 0)
      }
    })
  }, [account, balanceMap, currencies])
}

/**
 * @deprecated use usePortfolioBalances & getOnChainBalancesFetch from packages/uniswap instead
 *
 * Returns balances for tokens on currently-connected chainId via RPC.
 * Falls back to graphql TokenBalances if user is not connected to chain, a.k.a !isSynced.
 */
export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const { chainId: providerChainId } = useAccount()
  const chainId = useMemo(() => currencies?.[0]?.chainId, [currencies])
  const isSynced = !chainId || chainId === providerChainId

  const gqlCurrencyBalances = useGqlCurrencyBalances(account, currencies)
  const rpcCurrencyBalances = useRpcCurrencyBalances(account, currencies)

  return useMemo(() => {
    if (!account || !currencies) {
      return []
    }

    return isSynced ? rpcCurrencyBalances : gqlCurrencyBalances
  }, [account, currencies, isSynced, gqlCurrencyBalances, rpcCurrencyBalances])
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  return useCurrencyBalance(account, token) as CurrencyAmount<Token> | undefined
}

export default function useCurrencyBalance(
  account?: string,
  currency?: Currency,
): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency]),
  )[0]
}
