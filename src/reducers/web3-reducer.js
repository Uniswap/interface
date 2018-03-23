// these will take in an action, have a default state set in the arguments and return a new state
import {
  SET_WEB3_CONNECTION_STATUS,
  SET_CURRENT_MASK_ADDRESS,
  METAMASK_LOCKED,
  METAMASK_UNLOCKED,
  SET_INTERACTION_STATE,
  FACTORY_CONTRACT_READY,
  SET_NETWORK_MESSAGE,
  SET_BLOCK_TIMESTAMP,
  SET_EXCHANGE_TYPE,
  INITIALIZE_GLOBAL_WEB3,
  TOGGLE_ABOUT
} from '../constants';

export default (state = {}, action) => {
  const { connected, currentMaskAddress, metamaskLocked, interaction, factoryContract, networkMessage, timestamp, exchangeType, web3, aboutToggle } = action
  switch (action.type) {
    case INITIALIZE_GLOBAL_WEB3:
      return Object.assign({}, state, { web3: web3 });
    case SET_WEB3_CONNECTION_STATUS:
      return Object.assign({}, state, { connected: connected });
    case SET_CURRENT_MASK_ADDRESS:
      return Object.assign({}, state, { currentMaskAddress: currentMaskAddress });
    case METAMASK_LOCKED:
      return Object.assign({}, state, { metamaskLocked: metamaskLocked });
    case METAMASK_UNLOCKED:
      return Object.assign({}, state, { metamaskLocked: metamaskLocked });
    case SET_INTERACTION_STATE:
      return Object.assign({}, state, { interaction: interaction });
    case FACTORY_CONTRACT_READY:
      return Object.assign({}, state, { factoryContract: factoryContract});
    case SET_NETWORK_MESSAGE:
      return Object.assign({}, state, { networkMessage: networkMessage });
    case SET_BLOCK_TIMESTAMP:
      return Object.assign({}, state, { blockTimestamp: timestamp });
    case SET_EXCHANGE_TYPE: 
      return Object.assign({}, state, { exchangeType: exchangeType });
    case TOGGLE_ABOUT: 
      return Object.assign({}, state, { aboutToggle: aboutToggle })
    default: return state;
  }
}
