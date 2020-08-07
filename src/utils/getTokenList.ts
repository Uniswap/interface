import { TokenList } from '@uniswap/token-lists'
import schema from '@uniswap/token-lists/src/tokenlist.schema.json'
import Ajv from 'ajv'
import uriToHttp from './uriToHttp'

const tokenListValidator = new Ajv({ allErrors: true }).compile(schema)

/**
 * Contains the logic for resolving a URL to a valid token list
 * @param listUrl list url
 */
export async function getTokenList(listUrl: string): Promise<TokenList> {
  const urls = uriToHttp(listUrl)
  for (const url of urls) {
    let response
    try {
      response = await fetch(url)
      if (!response.ok) continue
    } catch (error) {
      console.error(`failed to fetch list ${listUrl} at uri ${url}`)
      continue
    }

    const json = await response.json()
    if (!tokenListValidator(json)) {
      throw new Error(
        tokenListValidator.errors?.reduce<string>((memo, error) => {
          const add = `${error.dataPath} ${error.message ?? ''}`
          return memo.length > 0 ? `${memo}; ${add}` : `${add}`
        }, '') ?? 'Token list failed validation'
      )
    }
    return json
  }
  throw new Error('Unrecognized list URL protocol.')
}
