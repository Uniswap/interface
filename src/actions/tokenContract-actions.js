import {
  TOKEN_CONTRACT_READY
} from '../constants';

// again, needs to be redux thunk
export const tokenContractReady = (symbol, tokenContract) => ({
  type: TOKEN_CONTRACT_READY,
  payload: { [symbol]: tokenContract }
});
