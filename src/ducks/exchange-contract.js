import {
  EXCHANGE_CONTRACT_READY
} from '../constants'

// definitely needs to be redux thunk
export const exchangeContractReady = (symbol, exchangeContract) => ({
  type: EXCHANGE_CONTRACT_READY,
  payload: { [symbol]: exchangeContract }
});

export default (state = {}, action) => {
  const { payload } = action;
  switch(action.type) {
    case EXCHANGE_CONTRACT_READY:
      return Object.assign({}, state,  payload )
    default: return state;
  }
}
