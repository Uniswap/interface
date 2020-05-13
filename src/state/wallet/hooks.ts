import { JSBI, Token, TokenAmount, WETH } from '@uniswap/sdk'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import {
  startListeningForBalance,
  startListeningForTokenBalances,
  stopListeningForBalance,
  stopListeningForTokenBalances,
  TokenBalanceListenerKey
} from './actions'
import { balanceKey } from './reducer'

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useETHBalances(uncheckedAddresses?: (string | undefined)[]): { [address: string]: JSBI } {
  const dispatch = useDispatch<AppDispatch>()
  const { chainId } = useWeb3React()

  const addresses: string[] = useMemo(() => (uncheckedAddresses ? uncheckedAddresses.filter(isAddress) : []), [
    uncheckedAddresses
  ])

  // add the listeners on mount, remove them on dismount
  useEffect(() => {
    if (addresses.length === 0) return
    dispatch(startListeningForBalance({ addresses }))
    return () => dispatch(stopListeningForBalance({ addresses }))
  }, [addresses])

  const rawBalanceMap = useSelector<AppState>(({ wallet: { balances } }) => balances)

  return useMemo(() => {
    return addresses.reduce<{ [address: string]: JSBI }>((map, address) => {
      const key = balanceKey({ address, chainId })
      const { value } = rawBalanceMap[key] ?? {}
      map[address] = JSBI.BigInt(value ?? 0)
      return map
    }, {})
  }, [chainId, addresses, rawBalanceMap])
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount } {
  const dispatch = useDispatch<AppDispatch>()
  const { chainId } = useWeb3React()

  const validTokens: Token[] = useMemo(() => tokens?.filter(t => t && t.address && isAddress(t.address)) ?? [], [
    tokens
  ])

  // keep the listeners up to date
  useEffect(() => {
    if (address && validTokens.length > 0) {
      const combos: TokenBalanceListenerKey[] = validTokens.map(token => ({ address, tokenAddress: token.address }))
      dispatch(startListeningForTokenBalances(combos))
      return () => dispatch(stopListeningForTokenBalances(combos))
    }
  }, [address, validTokens])

  const rawBalanceMap = useSelector<AppState>(({ wallet: { balances } }) => balances)

  return useMemo(() => {
    if (!address || validTokens.length === 0) {
      return {}
    }
    return (
      validTokens.reduce<{ [address: string]: TokenAmount }>((map, token) => {
        const key = balanceKey({ address, chainId, tokenAddress: token.address })
        const { value } = rawBalanceMap[key] ?? {}
        map[token.address] = new TokenAmount(token, JSBI.BigInt(value))
        return map
      }, {}) ?? {}
    )
  }, [address, validTokens, chainId, rawBalanceMap])
}

// contains the hacky logic to treat WETH as if it's WETH to maintain compatibility
// until we start treating them separately
export function useTokenBalancesTreatWETHAsETH(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount } {
  const { chainId } = useWeb3React()
  const { tokensWithoutWETH, includesWETH } = useMemo(() => {
    if (!tokens || tokens.length === 0) {
      return { includesWETH: false, tokensWithoutWETH: [] }
    }
    let includesWETH = false
    const tokensWithoutWETH = tokens.filter(t => {
      const isWETH = t.equals(WETH[chainId])
      if (isWETH) includesWETH = true
      return !isWETH
    })
    return { includesWETH, tokensWithoutWETH }
  }, [tokens])

  const balancesWithoutWETH = useTokenBalances(address, tokensWithoutWETH)
  const ETHBalance = useETHBalances(includesWETH ? [address] : [])

  return useMemo(() => {
    if (includesWETH) {
      const weth = WETH[chainId]
      const ethBalance = ETHBalance[address]
      return {
        ...balancesWithoutWETH,
        ...(ethBalance && weth ? { [weth.address]: new TokenAmount(weth, ethBalance) } : null)
      }
    }
  }, [balancesWithoutWETH, ETHBalance, includesWETH])
}
