const DISMISS_BETA_MESSAGE = 'app/app/dismissBetaMessage';
const DISMISS_DISABLED_MESSAGE = 'app/app/dismissDisabledMessage';

const initialState = {
  showBetaMessage: true,
  showDisabledMessage: true,
};

export const dismissBetaMessage = () => ({ type: DISMISS_BETA_MESSAGE });
export const dismissDisabledMessage = () => ({ type: DISMISS_DISABLED_MESSAGE });

export default function appReducer(state = initialState, { type }) {
  switch (type) {
    case DISMISS_BETA_MESSAGE:
      return { ...state, showBetaMessage: false };
    case DISMISS_DISABLED_MESSAGE:
      return { ...state, showDisabledMessage: false };
    default:
      return state;
  }
}
