import Web3 from "web3";

const INITIALIZE = 'app/web3/initialize';
const UPDATE_CURRENT_ADDRESS = 'app/web3/updateCurrentAddress';

// export const setWeb3ConnectionStatus = (connected) => ({
//   type: SET_WEB3_CONNECTION_STATUS,
//   connected
// })
//
// export const setCurrentMaskAddress = (currentMaskAddress) => ({
//   type: SET_CURRENT_MASK_ADDRESS,
//   currentMaskAddress
// });
//
// export const metamaskLocked = () => ({
//   type: METAMASK_LOCKED,
//   metamaskLocked: true
// });
//
// export const metamaskUnlocked = () => ({
//   type: METAMASK_UNLOCKED,
//   metamaskLocked: false
// });
//
// export const setInteractionState = (interaction) => ({
//   type: SET_INTERACTION_STATE,
//   interaction
// })
//
// export const factoryContractReady = (factoryContract) => ({
//   type: FACTORY_CONTRACT_READY,
//   factoryContract
// });
//
// export const setNetworkMessage = (networkMessage) => {
//   return async (dispatch) => {
//     let networkName;
//     switch (networkMessage) {
//       case "main":
//         networkName = 'Ethereum Mainet'
//         break;
//       case "morden":
//         networkName = 'Morden testnet'
//         break;
//       case "ropsten":
//         networkName = 'Ropsten testnet'
//         break;
//       case "rinkeby":
//         networkName = 'Rinkeby testnet'
//         break;
//       case "kovan":
//         networkName = 'Kovan testnet'
//         break;
//       default:
//         networkName = 'an unknown network'
//     }
//     dispatch ({
//       type: SET_NETWORK_MESSAGE,
//       networkMessage: networkName
//     })
//   }
// };
//
// export const setBlockTimestamp = () => {
//   return async (dispatch, getState) => {
//     const { web3 } = getState().web3Store;
//     await web3.eth.getBlock('latest', (error, blockInfo) => {
//       dispatch({
//         type: SET_BLOCK_TIMESTAMP,
//         timestamp: blockInfo.timestamp
//       })
//     });
//   }
// }
//
// export const setExchangeType = (exchangeType) => ({
//   type: SET_EXCHANGE_TYPE,
//   exchangeType
// });
//
// export const toggleAbout = (toggle) => ({
//   type: TOGGLE_ABOUT,
//   aboutToggle: toggle
// });
//
// export const toggleInvest = (toggle) => ({
//   type: TOGGLE_INVEST,
//   investToggle: toggle
// });

export const initialize = () => dispatch => {
  if (typeof window.web3 !== 'undefined') {
    const web3 = new Web3(window.web3.currentProvider);
    dispatch({
      type: INITIALIZE,
      payload: web3,
    });
    dispatch(updateCurrentAddress());
  }
};

export const updateCurrentAddress = () => (dispatch, getState) => {
  const { web3: { web3 } } = getState();

  if (!web3) {
    return;
  }

  web3.eth.getAccounts((err, accounts) => {
    if (err) {
      return;
    }

    dispatch({
      type: UPDATE_CURRENT_ADDRESS,
      payload: accounts[0],
    });
  })
};


export default (state = {}, { type, payload }) => {
  switch (type) {
    case INITIALIZE:
      return { ...state, web3: payload };
    case UPDATE_CURRENT_ADDRESS:
      return { ...state, currentAddress: payload };
    // case SET_WEB3_CONNECTION_STATUS:
    //   return Object.assign({}, state, { connected: connected });
    // case SET_CURRENT_MASK_ADDRESS:
    //   return Object.assign({}, state, { currentMaskAddress: currentMaskAddress });
    // case METAMASK_LOCKED:
    //   return Object.assign({}, state, { metamaskLocked: metamaskLocked });
    // case METAMASK_UNLOCKED:
    //   return Object.assign({}, state, { metamaskLocked: metamaskLocked });
    // case SET_INTERACTION_STATE:
    //   return Object.assign({}, state, { interaction: interaction });
    // case FACTORY_CONTRACT_READY:
    //   return Object.assign({}, state, { factoryContract: factoryContract});
    // case SET_NETWORK_MESSAGE:
    //   return Object.assign({}, state, { networkMessage: networkMessage });
    // case SET_BLOCK_TIMESTAMP:
    //   return Object.assign({}, state, { blockTimestamp: timestamp });
    // case SET_EXCHANGE_TYPE:
    //   return Object.assign({}, state, { exchangeType: exchangeType });
    // case TOGGLE_ABOUT:
    //   return Object.assign({}, state, { aboutToggle: aboutToggle })
    // case TOGGLE_INVEST:
    //   return Object.assign({}, state, { investToggle: investToggle })
    default: return state;
  }
}
