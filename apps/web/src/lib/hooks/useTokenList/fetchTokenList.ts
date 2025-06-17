import type { TokenList } from '@uniswap/token-lists'
import contenthashToUri from 'lib/utils/contenthashToUri'
import parseENSAddress from 'lib/utils/parseENSAddress'
import { uriToHttpUrls } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { validateTokenList } from 'utils/validateTokenList'

const listCache = new Map<string, TokenList>()

/**
 * Fetches and validates a token list.
 * For a given token list URL, we try to fetch the list from all the possible HTTP URLs.
 * For example, IPFS URLs can be fetched through multiple gateways.
 */
export default async function fetchTokenList({
  listUrl,
  resolveENSContentHash,
  skipValidation,
}: {
  listUrl: string
  resolveENSContentHash: (ensName: string) => Promise<string>
  skipValidation?: boolean
}): Promise<TokenList> {
  const cached = listCache.get(listUrl) // avoid spurious re-fetches
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
      logger.debug('fetchTokenList', 'fetchTokenList', message, error)
      throw new Error(message)
    }
    let translatedUri
    try {
      translatedUri = contenthashToUri(contentHashUri)
    } catch (error) {
      const message = `failed to translate contenthash to URI: ${contentHashUri}`
      logger.debug('fetchTokenList', 'fetchTokenList', message, error)
      throw new Error(message)
    }
    urls = uriToHttpUrls(`${translatedUri}${parsedENS.ensPath ?? ''}`)
  } else {
    urls = uriToHttpUrls(listUrl)
  }

  if (urls.length === 0) {
    throw new Error('Unrecognized list URL protocol.')
  }

  // Try each of the derived URLs until one succeeds.
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    let response
    try {
      response = await fetch(url, { credentials: 'omit' })
    } catch (error) {
      logger.debug('fetchTokenList', 'fetchTokenList', `failed to fetch list: ${listUrl} (${url})`, error)
      continue
    }

    if (!response.ok) {
      logger.debug('fetchTokenList', 'fetchTokenList', `failed to fetch list ${listUrl} (${url})`, response.statusText)
      continue
    }

    try {
      // The content of the result is sometimes invalid even with a 200 status code.
      // A response can be invalid if it's not a valid JSON or if it doesn't match the TokenList schema.
      const json = await response.json()
      const list = skipValidation ? json : await validateTokenList(json)
      listCache.set(listUrl, list)
      return list
    } catch (error) {
      logger.debug(
        'fetchTokenList',
        'fetchTokenList',
        `failed to parse and validate list response: ${listUrl} (${url})`,
        error,
      )
      continue
    }
  }

  throw new Error(`No valid token list found at any URLs derived from ${listUrl}.`)
}
