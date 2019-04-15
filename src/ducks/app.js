const DISMISS_BETA_MESSAGE = 'app/app/dismissBetaMessage'

const initialState = {
  showBetaMessage: true
}

export const dismissBetaMessage = () => ({ type: DISMISS_BETA_MESSAGE })

export default function appReducer(state = initialState, { type, payload }) {
  switch (type) {
    case DISMISS_BETA_MESSAGE:
      return { ...state, showBetaMessage: false }
    default:
      return state
  }
}
