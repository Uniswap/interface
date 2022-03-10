import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { Palette } from 'src/styles/color'

type DynamicPalette = Pick<Palette, 'primary1' | 'secondary1' | 'background1' | 'textColor'>

export interface UserState {
  palette: DynamicPalette | null
  localPfp: string | null
}

const initialState: UserState = {
  palette: null,
  localPfp: null,
}

export const slice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserPalette: (
      state,
      { payload: { newPalette } }: PayloadAction<{ newPalette: DynamicPalette }>
    ) => {
      state.palette = newPalette
    },
    setUserPfp: (state, { payload: { newPfp } }: PayloadAction<{ newPfp: string }>) => {
      state.localPfp = newPfp
    },
  },
})

export const selectUserPalette = (state: RootState) => state.user.palette
export const selectUserLocalPfp = (state: RootState) => state.user.localPfp

export const { setUserPalette, setUserPfp } = slice.actions
export const { reducer: userReducer, actions: userActions } = slice
