import { createAction } from '@reduxjs/toolkit'
import { TokenList } from 'dxswap-sdk'

export const setTokenList = createAction<TokenList>('setTokenList')
