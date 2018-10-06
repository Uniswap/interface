import {
  TOKEN_CONTRACT_READY
} from '../constants';

// again, needs to be redux thunk
export const tokenContractReady = (symbol, tokenContract) => ({
  type: TOKEN_CONTRACT_READY,
  payload: { [symbol]: tokenContract }
});

export default (state = {}, action) => {
  const { payload } = action;
  switch(action.type) {
    case TOKEN_CONTRACT_READY:
      return Object.assign({}, state,  payload )
    default: return state;
  }
}
