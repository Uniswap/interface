import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList, Version } from '@uniswap/token-lists'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>
  fulfilled: ActionCreatorWithPayload<{ url: string; tokenList: TokenList; requestId: string }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string }>
}> = {
  pending: createAction('lists/fetchTokenList/pending'),
  fulfilled: createAction('lists/fetchTokenList/fulfilled'),
  rejected: createAction('lists/fetchTokenList/rejected'),
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

    const OBJ = {
      name: 'Roll Default List',
      timestamp: '2020-07-28T20:33:38+00:00',
      version: {
        major: 1,
        minor: 0,
        patch: 2
      },
      tags: {},
      logoURI: '',
      keywords: ['roll', 'default'],
      tokens: json
    }
    return OBJ

    // if (!tokenListValidator(json)) {
    //   throw new Error(
    //     tokenListValidator.errors?.reduce<string>((memo, error) => {
    //       const add = `${error.dataPath} ${error.message ?? ''}`
    //       return memo.length > 0 ? `${memo}; ${add}` : `${add}`
    //     }, '') ?? 'Token list failed validation'
    //   )
    // }

    // return json
  }
  throw new Error('Unrecognized list URL protocol.')
}
// add and remove from list options
export const addList = createAction<string>('lists/addList')
export const removeList = createAction<string>('lists/removeList')

// select which lists to search across from loaded lists
export const enableList = createAction<string>('lists/enableList')
export const disableList = createAction<string>('lists/disableList')
const fetchCache: { [url: string]: Promise<TokenList> } = {}
export const fetchTokenList = createAsyncThunk<TokenList, string>('lists/fetchTokenList', (url: string) => {
  // this makes it so we only ever fetch a list a single time concurrently
  const value = (fetchCache[url] =
    fetchCache[url] ??
    getTokenList(url).catch(error => {
      delete fetchCache[url]
      throw error
    }))

  return value
})

// versioning
export const acceptListUpdate = createAction<string>('lists/acceptListUpdate')
export const rejectVersionUpdate = createAction<Version>('lists/rejectVersionUpdate')
