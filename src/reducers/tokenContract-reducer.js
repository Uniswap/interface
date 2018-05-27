import {
  TOKEN_CONTRACT_READY
} from '../constants';

export default (state = {}, action) => {
  const { payload } = action;
  switch(action.type) {
    case TOKEN_CONTRACT_READY:
      return Object.assign({}, state,  payload )
    default: return state;
  }
}
