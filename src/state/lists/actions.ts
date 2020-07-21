import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import schema from '@uniswap/token-lists/src/tokenlist.schema.json'
import Ajv from 'ajv'

const validator = new Ajv({ allErrors: true }).compile(schema)

/**
 * Contains the logic for resolving a list to a URL
 * @param url list url
 */
async function getTokenList(url: string): Promise<TokenList> {
  const parsed = new URL(url)
  if (parsed.protocol === 'https:') {
    const response = await fetch(url)
    const json = await response.json()
    if (!validator(json)) {
      throw new Error('Failed token list schema validation.')
    }
    return json
  } else {
    throw new Error('Unrecognized list URL protocol.')
  }
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
