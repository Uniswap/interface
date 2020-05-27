import { createAction } from '@reduxjs/toolkit'
import { RouteComponentProps } from 'react-router-dom'

export enum Field {
  TOKEN_A = 'TOKEN_A',
  TOKEN_B = 'TOKEN_B'
}

export const setDefaultsFromURLMatchParams = createAction<{
  chainId: number
  params: RouteComponentProps<{ [k: string]: string }>['match']['params']
}>('setDefaultsFromMatch')
export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>('typeInputMint')
