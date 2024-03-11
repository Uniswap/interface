import { TokenList } from '@uniswap/token-lists'
import schema from '@uniswap/token-lists/src/tokenlist.schema.json'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import uriToHttp from './uriToHttp'

const tokenListValidator = addFormats(new Ajv({ allErrors: true })).compile(schema)

/**
 * Contains the logic for resolving a list URL to a validated token list
 * @param listUrl list url
 * @param resolveENSContentHash resolves an ens name to a contenthash
 */
export default async function getTokenList(listUrl: string): Promise<TokenList> {
  const urls = uriToHttp(listUrl)
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

    const json: TokenList = await response.json()
    if (!tokenListValidator(json)) {
      const validationErrors: string =
        tokenListValidator.errors?.reduce<string>((memo, error) => {
          const add = `${error.instancePath} ${error.message ?? ''}`
          return memo.length > 0 ? `${memo}; ${add}` : `${add}`
        }, '') ?? 'unknown error'
      throw new Error(`Token list failed validation: ${validationErrors}`)
    }
    if (json.name == 'Ubeswap') {
      json.tokens.splice(
        json.tokens.findIndex(
          (t) => t.address.toLocaleLowerCase() == '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC'.toLocaleLowerCase()
        ),
        1,
        {
          address: '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC',
          name: 'Ubeswap Old',
          symbol: 'old-UBE',
          chainId: 42220,
          decimals: 18,
          logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_UBE.png',
        }
      )
      json.tokens.unshift({
        address: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
        name: 'Ubeswap',
        symbol: 'UBE',
        chainId: 42220,
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_UBE.png',
      })
    }
    return json
  }
  throw new Error('Unrecognized list URL protocol.')
}
