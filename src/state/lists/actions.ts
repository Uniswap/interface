import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList, Version } from '@fuseio/token-lists'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string; listType: CurrencyListType }>
  fulfilled: ActionCreatorWithPayload<{
    url: string
    tokenList: TokenList
    requestId: string
    listType: CurrencyListType
  }>
  rejected: ActionCreatorWithPayload<{
    url: string
    errorMessage: string
    requestId: string
    listType: CurrencyListType
  }>
}> = {
  pending: createAction('lists/fetchTokenList/pending'),
  fulfilled: createAction('lists/fetchTokenList/fulfilled'),
  rejected: createAction('lists/fetchTokenList/rejected')
}

export const acceptListUpdate = createAction<{ url: string; listType: CurrencyListType }>('lists/acceptListUpdate')
export const addList = createAction<{ url: string; listType: CurrencyListType }>('lists/addList')
export const removeList = createAction<{ url: string; listType: CurrencyListType }>('lists/removeList')
export const selectList = createAction<{ url: string; listType: CurrencyListType }>('lists/selectList')
export const rejectVersionUpdate = createAction<{ Version: Version; listType: CurrencyListType }>(
  'lists/rejectVersionUpdate'
)
