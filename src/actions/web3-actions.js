import {
  WEB3_CONNECTION_SUCCESSFUL,
  WEB3_CONNECTION_UNSUCCESSFUL,
  SET_CURRENT_MASK_ADDRESS,
  METAMASK_LOCKED,
  METAMASK_UNLOCKED,
  SET_INTERACTION_STATE,
  FACTORY_CONTRACT_READY,
  SET_NETWORK_MESSAGE,
  SET_BLOCK_TIMESTAMP,
  SET_EXCHANGE_TYPE,
  INITIALIZE_GLOBAL_WEB3
} from '../constants';

// this actions folder is actually full of action creators
// your asynchronous calls are going to be in redux-thunk style action creators

export const web3ConnectionSuccessful = () => ({
  type: WEB3_CONNECTION_SUCCESSFUL,
  connected: true
});

export const web3ConnectionUnsuccessful = () => ({
  type: WEB3_CONNECTION_UNSUCCESSFUL,
  connected: false
});

export const setCurrentMaskAddress = (currentMaskAddress) => ({
  type: SET_CURRENT_MASK_ADDRESS,
  currentMaskAddress
});

export const metamaskLocked = () => ({
  type: METAMASK_LOCKED,
  metamaskLocked: true
});

export const metamaskUnlocked = () => ({
  type: METAMASK_UNLOCKED,
  metamaskLocked: false
});

export const setInteractionState = (interaction) => ({
  type: SET_INTERACTION_STATE,
  interaction
});

export const factoryContractReady = (factoryContract) => ({
  type: FACTORY_CONTRACT_READY,
  factoryContract
});

export const setNetworkMessage = (networkMessage) => ({
  type: SET_NETWORK_MESSAGE,
  networkMessage
});

export const setBlockTimestamp = () => {
  return async (dispatch, getState) => {
    const { globalWeb3 } = getState().web3Store
    await globalWeb3.eth.getBlock('latest', (error, blockInfo) => {
      console.log(blockInfo.timestamp, 'BLOCKTIMESTAMP');
      dispatch({
        type: SET_BLOCK_TIMESTAMP,
        timestamp: blockInfo.timestamp
      })
    });
  }
}

export const setExchangeType = (exchangeType) => ({
  type: SET_EXCHANGE_TYPE,
  exchangeType
});

export const initializeGlobalWeb3 = (globalWeb3) => ({
  type: INITIALIZE_GLOBAL_WEB3,
  globalWeb3
})
