import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>
  fulfilled: ActionCreatorWithPayload<{ url: string; tokenList: TokenList; requestId: string }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string }>
}> = {
  pending: createAction('poolsList/fetchTokenList/pending'),
  fulfilled: createAction('poolsList/fetchTokenList/fulfilled'),
  rejected: createAction('poolsList/fetchTokenList/rejected'),
}
// add and remove from list options
export const addList = createAction<string>('poolsList/addList')
export const removeList = createAction<string>('poolsList/removeList')

// versioning
export const acceptListUpdate = createAction<string>('poolsList/acceptListUpdate')
