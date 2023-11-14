import { DEFAULT_LOCALE } from 'constants/locales'
import { PersistState } from 'redux-persist'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV4 = {
  _persist: PersistState
} & { user?: UserState }

/**
 * Migration to set german locale to default locale, after
 * the german locale was removed from supported locales.
 */
export const migration4 = (state: PersistAppStateV4 | undefined) => {
  if (state?.user) {
    if (state.user.userLocale === 'de-DE') {
      state.user.userLocale = DEFAULT_LOCALE
    }

    return {
      ...state,
      _persist: {
        ...state._persist,
        version: 4,
      },
    }
  }
  return state
}
