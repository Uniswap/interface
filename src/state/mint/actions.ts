import { createAction } from '@reduxjs/toolkit'

export enum Field {
  TOKEN_A = 'TOKEN_A',
  TOKEN_B = 'TOKEN_B'
}

export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>('typeInputMint')
export const resetMintState = createAction<void>('resetMintState')
