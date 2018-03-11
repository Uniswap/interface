import { 
  UNI_EXCHANGE_CONTRACT_READY,
  SWT_EXCHANGE_CONTRACT_READY
} from '../constants';

export const uniExchangeContractReady = (contract) => ({
  type: UNI_EXCHANGE_CONTRACT_READY,
  contract
});

export const swtExchangeContractReady = (contract) => ({
  type: SWT_EXCHANGE_CONTRACT_READY,
  contract
});