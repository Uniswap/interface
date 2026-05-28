import type { TokenList } from '@uniswap/token-lists'
import { LEGACY_ARRAY_TOKEN_LIST_CHAIN_IDS } from 'constants/lists'
import contenthashToUri from 'lib/utils/contenthashToUri'
import parseENSAddress from 'lib/utils/parseENSAddress'
import { uriToHttpUrls } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { validateTokenList, validateTokens } from 'utils/validateTokenList'

const listCache = new Map<string, TokenList>()

type LegacyTokenEntry = {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  chainId?: number
}

function getLegacyListVersion(lastModifiedHeader: string | null): TokenList['version'] {
  const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : undefined
  if (!lastModified || Number.isNaN(lastModified.getTime())) {
    return { major: 1, minor: 0, patch: 0 }
  }

  return {
    major: lastModified.getUTCFullYear(),
    minor: lastModified.getUTCMonth() + 1,
    patch: lastModified.getUTCDate() * 10000 + lastModified.getUTCHours() * 100 + lastModified.getUTCMinutes(),
  }
}

async function normalizeLegacyTokenArray(
  listUrl: string,
  json: LegacyTokenEntry[],
  lastModifiedHeader: string | null,
  skipValidation?: boolean,
): Promise<TokenList | null> {
  const fallbackChainId = LEGACY_ARRAY_TOKEN_LIST_CHAIN_IDS[listUrl]
  const normalizedTokens = json.map((token) => ({
    ...token,
    chainId: token.chainId ?? fallbackChainId,
  }))

  if (normalizedTokens.some((token) => token.chainId === undefined)) {
    return null
  }

  if (!skipValidation) {
    await validateTokens(normalizedTokens)
  }

  const fileName = listUrl.split('/').pop()?.replace('.tokenlist.json', '') ?? 'legacy'

  return {
    name: `Ring ${fileName} token list`,
    timestamp: new Date().toISOString(),
    version: getLegacyListVersion(lastModifiedHeader),
    tokens: normalizedTokens,
  }
}

/**
 * Fetches and validates a token list.
 * For a given token list URL, we try to fetch the list from all the possible HTTP URLs.
 * For example, IPFS URLs can be fetched through multiple gateways.
 */
export default async function fetchTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>,
  skipValidation?: boolean,
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
      const list = Array.isArray(json)
        ? await normalizeLegacyTokenArray(listUrl, json, response.headers.get('last-modified'), skipValidation)
        : skipValidation
          ? json
          : await validateTokenList(json)

      if (!list) {
        throw new Error(`legacy token array from ${listUrl} is missing chain IDs`)
      }

      listCache?.set(listUrl, list)
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
