import { INITIALIZE_GLOBAL_WEB3 } from '../constants';

export const initializeGlobalWeb3 = (globalWeb3) => ({
  type: INITIALIZE_GLOBAL_WEB3,
  globalWeb3
})
  