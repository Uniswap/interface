import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { TokenList, Version } from '@uniswap/token-lists'
import schema from '@uniswap/token-lists/src/tokenlist.schema.json'
import Ajv from 'ajv'
import uriToHttp from '../../utils/uriToHttp'

const tokenListValidator = new Ajv({ allErrors: true }).compile(schema)

/**
 * Contains the logic for resolving a URL to a valid token list
 * @param listUrl list url
 */
async function getTokenList(listUrl: string): Promise<TokenList> {
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

const fetchCache: { [url: string]: Promise<TokenList> } = {}
export const fetchTokenList = createAsyncThunk<TokenList, string>(
  'lists/fetchTokenList',
  (url: string) =>
    // this makes it so we only ever fetch a list a single time concurrently
    (fetchCache[url] =
      fetchCache[url] ??
      getTokenList(url).catch(error => {
        delete fetchCache[url]
        throw error
      }))
)

export const acceptListUpdate = createAction<string>('lists/acceptListUpdate')
export const addList = createAction<string>('lists/addList')
export const rejectVersionUpdate = createAction<Version>('lists/rejectVersionUpdate')
