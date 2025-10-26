import { PersistState } from 'redux-persist'
import { PreV16UserState } from 'state/migrations/oldTypes'

export type PersistAppStateV7 = {
  _persist: PersistState
} & { user?: PreV16UserState & { hideAndroidAnnouncementBanner?: boolean; hideAppPromoBanner: boolean } }

/**
 * Migration to rename hideAndroidAnnouncementBanner to hideAppPromoBanner.
 */
export const migration7 = (state: PersistAppStateV7 | undefined) => {
  if (!state) {
    return state
  }
  const userHidAndroidAnnouncementBanner = state.user?.hideAndroidAnnouncementBanner
  if (state.user && 'hideAndroidAnnouncementBanner' in state.user) {
    delete state.user.hideAndroidAnnouncementBanner
  }
  // If the the user has previously hidden the Android announcement banner, we respect that preference.
  if (state.user && userHidAndroidAnnouncementBanner) {
    return {
      ...state,
      user: {
        ...state.user,
        hideAppPromoBanner: userHidAndroidAnnouncementBanner,
      },
      _persist: {
        ...state._persist,
        version: 7,
      },
    }
  }
  return {
    ...state,
    _persist: {
      ...state._persist,
      version: 7,
    },
  }
}
