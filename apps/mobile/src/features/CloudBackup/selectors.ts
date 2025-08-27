import { MobileState } from 'src/app/mobileReducer'

export const selectPasswordAttempts = (state: MobileState): number => {
  return state.passwordLockout.passwordAttempts
}

export const selectLockoutEndTime = (state: MobileState): number | undefined => {
  return state.passwordLockout.endTime
}
