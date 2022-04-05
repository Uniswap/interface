import { TokenInfo } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { isAddress } from '../../utils'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { USDC, USDT } from 'constants/tokens'
import _ from 'lodash'
const alwaysTrue = () => true

/**
 * Create a filter function to apply to a token for whether it matches a particular search query
 * @param search the search query to apply to the token
 */
export function createTokenFilterFunction<T extends Token | TokenInfo>(search: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase()
    return (t: T) => ('isToken' in t ? searchingAddress === t.address : lower === t.address.toLowerCase())
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0)

  if (lowerSearchParts.length === 0) return alwaysTrue

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    return lowerSearchParts.every((p) => p.length === 0 || sParts.some((sp) => sp.startsWith(p) || sp.endsWith(p)))
  }

  return ({ name, symbol }: T): boolean => Boolean((symbol && matchesSearch(symbol)) || (name && matchesSearch(name)))
}

export function filterTokens<T extends Token | TokenInfo>(tokens: T[], search: string): T[] {
  return tokens.filter(createTokenFilterFunction(search))
}

export function useSortedTokensByQuery(tokens: Token[] | undefined, searchQuery: string, showOnlyTrumpCoins?:boolean): Token[] {
  return useMemo(() => {
    if (!tokens) {
      return []
    }

    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    if (symbolMatch.length > 1) {
      return tokens
    }

    const exactMatches: Token[] = []
    const symbolSubtrings: Token[] = []
    const rest: Token[] = []

    // sort tokens by exact match -> subtring on symbol match -> rest
    tokens.map((token) => {
      if (token.symbol?.toLowerCase() === symbolMatch[0]) {
        return exactMatches.push(token)
      } else if (token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    const allowedContracts = [
      '0x99d36e97676a68313ffdc627fd6b56382a2a08b6'.toLowerCase(),
      '0xfF69e48af1174Da7F15D0c771861c33d3f19eD8a'.toLowerCase(),
      '0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013'.toLowerCase(),
      '0x29699C8485302cd2857043FaB8bd885bA08Cf268'.toLowerCase(),
      WETH9[1].address,
      USDC.address,
      USDT.address,
    ]
    const trumpCoin = new Token(
      1,
      "0x99d36e97676A68313ffDc627fd6b56382a2a08B6",
      9,
      "BabyTrump",
      "BabyTrump Token"
    );
    const stimulusCoin = new Token(
      1,
      "0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013",
      9,
      "Stimulus",
      "Stimlus Check"
    );
    const trumpGoldCoin = new Token(
      1,
      "0x29699C8485302cd2857043FaB8bd885bA08Cf268",
      9,
      "TGOLD",
      "Trump Gold"
    );
    const teslaInuCoin = new Token(
      1,
      '0xfF69e48af1174Da7F15D0c771861c33d3f19eD8a',
      9,
      'TESINU',
      'Tesla Inu'
    )
  const trumpListedCoins = [teslaInuCoin, trumpGoldCoin, trumpCoin, stimulusCoin];

    return _.uniqBy( [...exactMatches, ...symbolSubtrings, ...rest, ...trumpListedCoins], item => item.address.toLowerCase()).filter((item: any) => {
      if (!showOnlyTrumpCoins) return !!item;
      const isTrumpApproved = allowedContracts.includes(item.address.toLowerCase())
      return isTrumpApproved
    })
  }, [tokens, searchQuery, showOnlyTrumpCoins])
}
