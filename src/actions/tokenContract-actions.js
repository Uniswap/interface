import {
  UNI_TOKEN_CONTRACT_READY,
  SWT_TOKEN_CONTRACT_READY,
  TOKEN_CONTRACT_READY
} from '../constants';

export const uniTokenContractReady = (contract) => ({
  type: UNI_TOKEN_CONTRACT_READY,
  contract
});

export const swtTokenContractReady = (contract) => ({
  type: SWT_TOKEN_CONTRACT_READY,
  contract
});
// again, needs to be redux thunk 
export const tokenContractReady = (symbol, tokenContract) => ({
  type: TOKEN_CONTRACT_READY,
  payload: { [symbol]: tokenContract }
});