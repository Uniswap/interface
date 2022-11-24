import { TokenList } from '@uniswap/token-lists'
import axios from 'axios'

import { getFormattedAddress } from './tokenInfo'

// lazily get the validator the first time it is used
// loop to fetch all whitelist token
export async function getTokenListV2(listUrl: string): Promise<TokenList> {
  return new Promise(async (resolve, reject) => {
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
      return reject(`Failed to download list ${listUrl}`)
    }
    const parsedData: TokenList = {
      tokens,
      name: 'KyberSwap Token List',
      logoURI: 'https://kyberswap.com/favicon.png?version=v1',
      keywords: ['kyberswap', 'dmmexchange'],
      version: { major: 0, minor: 0, patch: 0 },
      timestamp: Date.now() + '',
    }
    formatTokensAddress(parsedData)
    resolve(parsedData)
  })
}

const formatTokensAddress = (tokenList: TokenList) => {
  tokenList.tokens.forEach((token: any) => {
    token.address = getFormattedAddress(token.chainId, token.address)
  })
}
