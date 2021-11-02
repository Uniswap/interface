// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/getTokenList.ts
// But with the ENS resolutions simplified using latest Ethers utils

import { TokenList } from '@uniswap/token-lists'
import type { ValidateFunction } from 'ajv'
import { parseENSAddress } from 'src/features/ens/parseENSAddress'
import { logger } from 'src/utils/logger'
import { uriToHttp } from 'src/utils/uriToHttp'

// lazily get the validator the first time it is used
// TODO(Rossy): Looks into replacing AJV without something lighter. It's only used here
const getTokenListValidator = (() => {
  let tokenListValidator: Promise<ValidateFunction>
  return () => {
    if (!tokenListValidator) {
      tokenListValidator = new Promise<ValidateFunction>(async (resolve) => {
        const [ajv, formats, schema] = await Promise.all([
          import('ajv'),
          import('ajv-formats'),
          import('@uniswap/token-lists/dist/tokenlist.schema.json'),
        ])
        const ajvInstance = new ajv.default({ allErrors: true })
        formats.default(ajvInstance)
        const validator = ajvInstance.compile(schema)
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
export async function getTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>
): Promise<TokenList> {
  logger.debug('getTokenList', 'getTokenList', 'Fetching list for:', listUrl)
  const tokenListValidator = getTokenListValidator()
  const parsedENS = parseENSAddress(listUrl)
  let urls: string[]
  if (parsedENS) {
    let contentHashUri
    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName)
      if (!contentHashUri) throw new Error('No content hash resolved')
    } catch (error) {
      logger.error(
        'getTokenList',
        'getTokenList',
        `Failed to resolve ENS name: ${parsedENS.ensName}`,
        error
      )
      throw new Error(`Failed to resolve ENS name: ${parsedENS.ensName}`)
    }
    urls = uriToHttp(`${contentHashUri}${parsedENS.ensPath ?? ''}`)
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
      logger.error('getTokenList', 'getTokenList', 'Failed to fetch list', listUrl, error)
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    if (!response.ok) {
      if (isLast) throw new Error(`Failed to download list ${listUrl}`)
      continue
    }

    const [json, validator] = await Promise.all([response.json(), tokenListValidator])
    if (!validator(json)) {
      const validationErrors: string =
        validator.errors?.reduce<string>((memo, error) => {
          const add = `${error.instancePath} ${error.message ?? ''}`
          return memo.length > 0 ? `${memo}; ${add}` : `${add}`
        }, '') ?? 'unknown error'
      throw new Error(`Token list failed validation: ${validationErrors}`)
    }
    return json as TokenList
  }
  throw new Error('Unrecognized list URL protocol.')
}
