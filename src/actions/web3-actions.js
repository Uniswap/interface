import {
  INITIALIZE_GLOBAL_WEB3,
  SET_WEB3_CONNECTION_STATUS,
  SET_CURRENT_MASK_ADDRESS,
  METAMASK_LOCKED,
  METAMASK_UNLOCKED,
  SET_INTERACTION_STATE,
  FACTORY_CONTRACT_READY,
  SET_NETWORK_MESSAGE,
  SET_BLOCK_TIMESTAMP,
  SET_EXCHANGE_TYPE,
  TOGGLE_ABOUT,
  TOGGLE_INVEST
} from '../constants';

// this actions folder is actually full of action creators
// your asynchronous calls are going to be in redux-thunk style action creators

export const setWeb3ConnectionStatus = (connected) => ({
  type: SET_WEB3_CONNECTION_STATUS,
  connected
})

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
})

export const factoryContractReady = (factoryContract) => ({
  type: FACTORY_CONTRACT_READY,
  factoryContract
});

export const setNetworkMessage = (networkMessage) => {
  return async (dispatch) => {
    let networkName;
    switch (networkMessage) {
      case "main":
        networkName = 'Ethereum Mainet'
        break;
      case "morden":
        networkName = 'Morden testnet'
        break;
      case "ropsten":
        networkName = 'Ropsten testnet'
        break;
      case "rinkeby":
        networkName = 'Rinkeby testnet'
        break;
      case "kovan":
        networkName = 'Kovan testnet'
        break;
      default:
        networkName = 'an unknown network'
    }
    dispatch ({
      type: SET_NETWORK_MESSAGE,
      networkMessage: networkName
    })
  }
};

export const setBlockTimestamp = () => {
  return async (dispatch, getState) => {
    const { web3 } = getState().web3Store;
    await web3.eth.getBlock('latest', (error, blockInfo) => {
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

export const toggleAbout = (toggle) => ({
  type: TOGGLE_ABOUT,
  aboutToggle: toggle
});

export const toggleInvest = (toggle) => ({
  type: TOGGLE_INVEST,
  investToggle: toggle
});

export const initializeGlobalWeb3 = (web3) => ({
  type: INITIALIZE_GLOBAL_WEB3,
  web3
});
