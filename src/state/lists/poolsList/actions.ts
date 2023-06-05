import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>
  fulfilled: ActionCreatorWithPayload<{ url: string; tokenList: TokenList; requestId: string }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string }>
}> = {
  pending: createAction('poolslist/fetchTokenList/pending'),
  fulfilled: createAction('poolslist/fetchTokenList/fulfilled'),
  rejected: createAction('poolslist/fetchTokenList/rejected'),
}
// add and remove from list options
export const addList = createAction<string>('poolslist/addList')
export const removeList = createAction<string>('poolslist/removeList')

// versioning
export const acceptListUpdate = createAction<string>('poolslist/acceptListUpdate')
