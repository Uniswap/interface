import { 
  UNI_EXCHANGE_CONTRACT_READY,
  SWT_EXCHANGE_CONTRACT_READY,
  EXCHANGE_CONTRACT_READY
} from '../constants';

export const uniExchangeContractReady = (contract) => ({
  type: UNI_EXCHANGE_CONTRACT_READY,
  contract
});

export const swtExchangeContractReady = (contract) => ({
  type: SWT_EXCHANGE_CONTRACT_READY,
  contract
});
// definitely needs to be redux thunk 
export const exchangeContractReady = (symbol, exchangeContract) => ({
  type: EXCHANGE_CONTRACT_READY,
  payload: { [symbol]: exchangeContract } 
});


