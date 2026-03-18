import { createSlice } from '@reduxjs/toolkit'

//------------------------------------------------------------------------------------------------
// Splash Screen
//------------------------------------------------------------------------------------------------

enum SplashScreenVisibility {
  INIT = 'init',
  HIDDEN = 'hidden',
}

// eslint-disable-next-line import/no-unused-modules
export interface SplashScreenState {
  visibility: SplashScreenVisibility
  dismissRequested: boolean
}

const initialState: SplashScreenState = {
  visibility: SplashScreenVisibility.INIT,
  dismissRequested: false,
}

const splashScreenSlice = createSlice({
  name: 'splashScreen',
  initialState,
  reducers: {
    dismissSplashScreen: (state) => {
      state.dismissRequested = true
    },
    onSplashScreenHidden: (state) => {
      state.visibility = SplashScreenVisibility.HIDDEN
    },
  },
})

export const { dismissSplashScreen, onSplashScreenHidden } = splashScreenSlice.actions
export const splashScreenReducer = splashScreenSlice.reducer

//------------------------------
// Splash Screen selectors
//------------------------------

const selectSplashScreen = (state: { splashScreen: SplashScreenState }): SplashScreenState['visibility'] =>
  state.splashScreen.visibility

export const selectSplashScreenIsHidden = (state: { splashScreen: SplashScreenState }): boolean =>
  selectSplashScreen(state) === SplashScreenVisibility.HIDDEN

export const selectSplashScreenDismissRequested = (state: { splashScreen: SplashScreenState }): boolean =>
  state.splashScreen.dismissRequested
