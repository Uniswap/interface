import type { TokenList } from '@uniswap/token-lists'
import { validateTokenList } from '@uniswap/widgets'
import contenthashToUri from 'lib/utils/contenthashToUri'
import parseENSAddress from 'lib/utils/parseENSAddress'
import uriToHttp from 'lib/utils/uriToHttp'

export const DEFAULT_TOKEN_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

const listCache = new Map<string, TokenList>()

/** Fetches and validates a token list. */
export default async function fetchTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>,
  skipValidation?: boolean
): Promise<TokenList> {
  const cached = listCache?.get(listUrl) // avoid spurious re-fetches
  if (cached) {
    return cached
  }

  let urls: string[]
  const parsedENS = parseENSAddress(listUrl)
  if (parsedENS) {
    let contentHashUri
    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName)
    } catch (error) {
      const message = `failed to resolve ENS name: ${parsedENS.ensName}`
      console.debug(message, error)
      throw new Error(message)
    }
    let translatedUri
    try {
      translatedUri = contenthashToUri(contentHashUri)
    } catch (error) {
      const message = `failed to translate contenthash to URI: ${contentHashUri}`
      console.debug(message, error)
      throw new Error(message)
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
      response = await fetch(url, { credentials: 'omit' })
    } catch (error) {
      const message = `failed to fetch list: ${listUrl}`
      console.debug(message, error)
      if (isLast) throw new Error(message)
      continue
    }

    if (!response.ok) {
      const message = `failed to fetch list: ${listUrl}`
      console.debug(message, response.statusText)
      if (isLast) throw new Error(message)
      continue
    }

    const json = await response.json()
    const list = skipValidation ? json : await validateTokenList(json)
    listCache?.set(listUrl, list)
    return list
  }

  throw new Error('Unrecognized list URL protocol.')
}
