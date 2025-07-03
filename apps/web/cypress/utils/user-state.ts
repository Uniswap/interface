import { UserState } from '../../src/state/user/reducer'

/**
 * This sets the initial value of the "user" slice in localStorage.
 * Other persisted slices are not set, so they will be filled with their respective initial values
 * when the app runs.
 */
export function setInitialUserState(win: Cypress.AUTWindow, state: UserState) {
  // We want to test from a clean state, so we clear the local storage (which clears redux).
  win.localStorage.clear()

  // Set initial user state.
  win.localStorage.setItem(
    'redux/persist:interface',
    JSON.stringify({
      user: state,
    })
  )
}
