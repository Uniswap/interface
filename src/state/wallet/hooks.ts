import { ChainId, JSBI, Token, TokenAmount, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useAllTokens } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { useEthScanContract } from '../../hooks/useContract'
import { isAddress } from '../../utils'
import { useSingleCallResult } from '../multicall/hooks'

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useETHBalances(uncheckedAddresses?: (string | undefined)[]): { [address: string]: JSBI | undefined } {
  const ethScan = useEthScanContract()

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const balances = useSingleCallResult(ethScan, 'etherBalances', [addresses])?.[0]

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: JSBI | undefined }>((memo, address, i) => {
        memo[address] = balances?.[i] ? JSBI.BigInt(balances[i].toString()) : undefined
        return memo
      }, {}),
    [addresses, balances]
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  const ethScan = useEthScanContract()
  const validatedAddress = isAddress(address)

  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])

  const balances = useSingleCallResult(ethScan, 'tokensBalance', [
    validatedAddress ? validatedAddress : undefined,
    validatedTokens.length > 0 ? validatedTokenAddresses : undefined
  ])?.[0]

  return useMemo(
    () =>
      validatedAddress && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
            const amount = balances?.[i] ? JSBI.BigInt(balances[i].toString()) : undefined
            if (amount) {
              memo[token.address] = new TokenAmount(token, amount)
            }
            return memo
          }, {})
        : {},
    [validatedTokens, validatedAddress, balances]
  )
}

// contains the hacky logic to treat the WETH token input as if it's ETH to
// maintain compatibility until we handle them separately.
export function useTokenBalancesTreatWETHAsETH(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  const { chainId } = useActiveWeb3React()
  const { tokensWithoutWETH, includesWETH } = useMemo(() => {
    if (!tokens || tokens.length === 0) {
      return { includesWETH: false, tokensWithoutWETH: [] }
    }
    let includesWETH = false
    const tokensWithoutWETH = tokens.filter(t => {
      if (!chainId) return true
      const isWETH = t?.equals(WETH[chainId as ChainId]) ?? false
      if (isWETH) includesWETH = true
      return !isWETH
    })
    return { includesWETH, tokensWithoutWETH }
  }, [tokens, chainId])

  const balancesWithoutWETH = useTokenBalances(address, tokensWithoutWETH)
  const ETHBalance = useETHBalances(includesWETH ? [address] : [])

  return useMemo(() => {
    if (!chainId || !address) return {}
    if (includesWETH) {
      const weth = WETH[chainId as ChainId]
      const ethBalance = ETHBalance[address]
      return {
        ...balancesWithoutWETH,
        ...(ethBalance && weth ? { [weth.address]: new TokenAmount(weth, ethBalance) } : null)
      }
    } else {
      return balancesWithoutWETH
    }
  }, [balancesWithoutWETH, ETHBalance, includesWETH, address, chainId])
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return
  return tokenBalances[token.address]
}

// mimics the behavior of useAddressBalance
export function useTokenBalanceTreatingWETHasETH(account?: string, token?: Token): TokenAmount | undefined {
  const balances = useTokenBalancesTreatWETHAsETH(account, [token])
  if (!token) return
  return balances?.[token.address]
}

// mimics useAllBalances
export function useAllTokenBalancesTreatingWETHasETH(): { [tokenAddress: string]: TokenAmount | undefined } {
  const { account } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalancesTreatWETHAsETH(account ?? undefined, allTokensArray)
  return balances ?? {}
}
