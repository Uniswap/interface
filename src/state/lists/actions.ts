import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList, Version } from '@uniswap/token-lists'

export type PathNameType = 'uniswap' | 'sushiswap'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string; pathName: string }>
  fulfilled: ActionCreatorWithPayload<{ url: string; tokenList: TokenList; requestId: string; pathName: string }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string; pathName: string }>
}> = {
  pending: createAction('lists/fetchTokenList/pending'),
  fulfilled: createAction('lists/fetchTokenList/fulfilled'),
  rejected: createAction('lists/fetchTokenList/rejected')
}

export const acceptListUpdate = createAction<{ url: string; pathName: PathNameType }>('lists/acceptListUpdate')
export const addList = createAction<{ url: string; pathName: PathNameType }>('lists/addList')
export const removeList = createAction<{ url: string; pathName: PathNameType }>('lists/removeList')
export const selectList = createAction<{ url: string; pathName: PathNameType }>('lists/selectList')
export const rejectVersionUpdate = createAction<Version>('lists/rejectVersionUpdate')
