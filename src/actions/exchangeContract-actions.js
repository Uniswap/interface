import {
  EXCHANGE_CONTRACT_READY
} from '../constants';

// definitely needs to be redux thunk
export const exchangeContractReady = (symbol, exchangeContract) => ({
  type: EXCHANGE_CONTRACT_READY,
  payload: { [symbol]: exchangeContract }
});
