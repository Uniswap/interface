import {
  UNI_EXCHANGE_CONTRACT_READY,
  SWT_EXCHANGE_CONTRACT_READY,
  EXCHANGE_CONTRACT_READY
} from '../constants'

export default (state = {}, action) => {
  const { contract, payload } = action;
  switch(action.type) {
    case UNI_EXCHANGE_CONTRACT_READY:
      return Object.assign({}, state, { UNI: contract });
    case SWT_EXCHANGE_CONTRACT_READY: 
      return Object.assign({}, state, { SWT: contract });
    case EXCHANGE_CONTRACT_READY: 
      return Object.assign({}, state,  payload )
    default: return state;
  }
}