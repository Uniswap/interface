import { 
  UNI_TOKEN_CONTRACT_READY,
  SWT_TOKEN_CONTRACT_READY,
  TOKEN_CONTRACT_READY
} from '../constants';

export default (state = {}, action) => {
  const { contract, payload } = action;
  switch(action.type) {
    case UNI_TOKEN_CONTRACT_READY:
      return Object.assign({}, state, { UNI: contract });
    case SWT_TOKEN_CONTRACT_READY: 
      return Object.assign({}, state, { SWT: contract });
    case TOKEN_CONTRACT_READY: 
      return Object.assign({}, state,  payload )
    default: return state;
  }
}