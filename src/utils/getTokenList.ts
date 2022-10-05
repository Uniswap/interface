import { TokenList } from '@uniswap/token-lists'
import { ValidateFunction } from 'ajv'
import axios from 'axios'

import contenthashToUri from './contenthashToUri'
import { parseENSAddress } from './parseENSAddress'
import { getFormattedAddress } from './tokenInfo'
import uriToHttp from './uriToHttp'

// lazily get the validator the first time it is used
const getTokenListValidator = (() => {
  let tokenListValidator: Promise<ValidateFunction>
  return () => {
    if (!tokenListValidator) {
      tokenListValidator = new Promise<ValidateFunction>(async resolve => {
        const [ajv, schema] = await Promise.all([
          import('ajv'),
          import('@uniswap/token-lists/src/tokenlist.schema.json'),
        ])
        const validator = new ajv.default({ allErrors: true }).compile(schema)
        resolve(validator)
      })
    }
    return tokenListValidator
  }
})()

/**
 * Contains the logic for resolving a list URL to a validated token list
 * @param listUrl list url
 * @param resolveENSContentHash resolves an ens name to a contenthash
 */
export default async function getTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>,
): Promise<TokenList> {
  const tokenListValidator = getTokenListValidator()
  const parsedENS = parseENSAddress(listUrl)
  let urls: string[]

  if (parsedENS) {
    let contentHashUri
    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName)
    } catch (error) {
      console.debug(`Failed to resolve ENS name: ${parsedENS.ensName}`, error)
      throw new Error(`Failed to resolve ENS name: ${parsedENS.ensName}`)
    }
    let translatedUri
    try {
      translatedUri = contenthashToUri(contentHashUri)
    } catch (error) {
      console.debug('Failed to translate contenthash to URI', contentHashUri)
      throw new Error(`Failed to translate contenthash to URI: ${contentHashUri}`)
    }
    urls = uriToHttp(`${translatedUri}${parsedENS.ensPath ?? ''}`)
  } else {
    urls = uriToHttp(listUrl)
  }
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const isLast = i === urls.length - 1
    let response
    try {
      response = await fetch(url)
    } catch (error) {
      console.debug('Failed to fetch list', listUrl, error)
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    if (!response.ok) {
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    const [json] = await Promise.all([response.json(), tokenListValidator])
    const parsedData = !!json?.data?.tokens
      ? {
          tokens: json.data.tokens,
          name: 'KyberSwap Token List',
          logoURI: 'https://kyberswap.com/favicon.png',
          keywords: ['kyberswap', 'dmmexchange'],
          version: { major: 0, minor: 0, patch: 0 },
        }
      : json
    formatTokensAddress(parsedData)
    return parsedData
  }
  throw new Error('Unrecognized list URL protocol.')
}

// loop to fetch all whitelist token
export async function getTokenListV2(
  listUrl: string,
  resolveENSContentHash?: (ensName: string) => Promise<string>,
): Promise<TokenList> {
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
      logoURI: 'https://kyberswap.com/favicon.png',
      keywords: ['kyberswap', 'dmmexchange'],
      version: { major: 0, minor: 0, patch: 0 },
      timestamp: Date.now() + '',
    }
    formatTokensAddress(parsedData)
    resolve(parsedData)
  })
}

const formatTokensAddress = (tokenList: any) => {
  tokenList.tokens.forEach((token: any) => {
    token.address = getFormattedAddress(token.address)
  })
}
