import { ChainId } from '@kyberswap/ks-sdk-core'
import axios from 'axios'

import { TokenMap, formatAndCacheToken } from 'hooks/Tokens'
import { TokenInfo } from 'state/lists/wrappedTokenInfo'
import { isAddress } from 'utils'

import { getFormattedAddress } from './tokenInfo'

// loop to fetch all whitelist token
export async function getTokenList(listUrl: string, chainId: ChainId): Promise<TokenMap> {
  let tokens: any[] = []
  try {
    const pageSize = 100
    const maximumPage = 15
    let page = 1
    while (true) {
      const { data } = await axios.get(`${listUrl}&pageSize=${pageSize}&page=${page}`)
      page++
      const tokensResponse = data.data.tokens ?? []
      tokens = tokens.concat(tokensResponse)
      if (tokensResponse.length < pageSize || page >= maximumPage) break // out of tokens, and prevent infinity loop
    }
  } catch (error) {
    console.error(`Failed to download list ${listUrl}`)
  }
  return listToTokenMap(tokens, chainId)
}
function listToTokenMap(list: TokenInfo[], chainId: ChainId): TokenMap {
  const map = list.reduce((tokenMap, tokenInfo) => {
    const formattedAddress = getFormattedAddress(chainId, tokenInfo.address)
    if (!tokenInfo || tokenMap[formattedAddress] || !isAddress(chainId, tokenInfo.address)) {
      return tokenMap
    }
    const token = formatAndCacheToken(tokenInfo)
    if (token) tokenMap[formattedAddress] = token
    return tokenMap
  }, {} as TokenMap)
  return map
}
