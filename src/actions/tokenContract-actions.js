import {
  UNI_TOKEN_CONTRACT_READY,
  SWT_TOKEN_CONTRACT_READY
} from '../constants';

export const uniTokenContractReady = (contract) => ({
  type: UNI_TOKEN_CONTRACT_READY,
  contract
});

export const swtTokenContractReady = (contract) => ({
  type: SWT_TOKEN_CONTRACT_READY,
  contract
});