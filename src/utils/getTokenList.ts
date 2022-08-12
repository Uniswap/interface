import { TokenList } from '@uniswap/token-lists'
import { ValidateFunction } from 'ajv'

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

const formatTokensAddress = (tokenList: any) => {
  tokenList.tokens.forEach((token: any) => {
    token.address = getFormattedAddress(token.address)
  })
}
