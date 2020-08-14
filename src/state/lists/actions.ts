import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { TokenList, Version } from '@uniswap/token-lists'
import { getTokenList } from '../../utils/getTokenList'

const fetchCache: { [url: string]: Promise<TokenList> } = {}
export const fetchTokenList = createAsyncThunk<TokenList, string>(
  'lists/fetchTokenList',
  (url: string) =>
    // this makes it so we only ever fetch a list a single time concurrently
    (fetchCache[url] =
      fetchCache[url] ??
      getTokenList(url, async () => {
        throw new Error('not yet implemented')
      }).catch(error => {
        delete fetchCache[url]
        throw error
      }))
)

export const acceptListUpdate = createAction<string>('lists/acceptListUpdate')
export const addList = createAction<string>('lists/addList')
export const removeList = createAction<string>('lists/removeList')
export const selectList = createAction<string>('lists/selectList')
export const rejectVersionUpdate = createAction<Version>('lists/rejectVersionUpdate')
