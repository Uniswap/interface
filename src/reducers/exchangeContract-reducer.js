import {
  UNI_EXCHANGE_CONTRACT_READY,
  SWT_EXCHANGE_CONTRACT_READY
} from '../constants'

export default (state = {}, action) => {
  const { contract } = action;
  switch(action.type) {
    case UNI_EXCHANGE_CONTRACT_READY:
      return Object.assign({}, state, { UNI: contract });
    case SWT_EXCHANGE_CONTRACT_READY: 
      return Object.assign({}, state, { SWT: contract });
    default: return state;
  }
}