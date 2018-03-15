// here is where we put the string literals for the actions
// maybe there's an action to see if you've been connected to web3

// web3 actions, all set from action creator to reducer to app
export const CHECK_WEB3_CONNECTION = 'CHECK_WEB3_CONNECTION';
export const WEB3_CONNECTION_SUCCESSFUL = 'WEB3_CONNECTION_SUCCESSFUL';
export const WEB3_CONNECTION_UNSUCCESSFUL = 'WEB3_CONNECTION_UNSUCCESSFUL';
export const SET_CURRENT_MASK_ADDRESS = 'SET_CURRENT_MASK_ADDRESS';

export const METAMASK_LOCKED = 'METAMASK_LOCKED';
export const METAMASK_UNLOCKED = 'METAMASK_UNLOCKED';
export const SET_INTERACTION_STATE = 'SET_INTERACTION_STATE';
export const SET_NETWORK_MESSAGE = 'SET_NETWORK_MESSAGE';

export const SET_BLOCK_TIMESTAMP = 'SET_BLOCK_TIMESTAMP';
export const SET_EXCHANGE_TYPE = 'SET_EXCHANGE_TYPE';

// factory contract action, also set
export const FACTORY_CONTRACT_READY = 'FACTORY_CONTRACT_READY';

// token EXCHANGE contract actions, in action creator, reducer, and app
export const UNI_EXCHANGE_CONTRACT_READY = 'UNI_EXCHANGE_CONTRACT_READY';
export const SWT_EXCHANGE_CONTRACT_READY = 'SWT_EXCHANGE_CONTRACT_READY';

// token CONTRACT actions in actions, action creator, reducer
export const UNI_TOKEN_CONTRACT_READY = 'UNI_TOKEN_CONTRACT_READY';
export const SWT_TOKEN_CONTRACT_READY = 'SWT_TOKEN_CONTRACT_READY';

// actions for the exchange, all in one place
export const SET_INPUT_BALANCE = 'SET_INPUT_BALANCE';
export const SET_OUTPUT_BALANCE = 'SET_OUTPUT_BALANCE';
export const SET_INPUT_TOKEN = 'SET_INPUT_TOKEN';
export const SET_OUTPUT_TOKEN = 'SET_OUTPUT_TOKEN';
export const SET_INVARIANT_1 = 'SET_INVARIANT_1';
export const SET_INVARIANT_2 = 'SET_INVARIANT_2';
export const SET_MARKET_ETH_1 = 'SET_MARKET_ETH_1';
export const SET_MARKET_ETH_2 = 'SET_MARKET_ETH_2';
export const SET_MARKET_TOKENS_1 = 'SET_MARKET_TOKENS_1';
export const SET_MARKET_TOKENS_2 = 'SET_MARKET_TOKENS_2';
export const SET_ALLOWANCE_APPROVAL_STATE = 'SET_ALLOWANCE_APPROVAL_STATE';
export const SET_EXCHANGE_INPUT_VALUE = 'SET_EXCHANGE_INPUT_VALUE';
export const SET_EXCHANGE_OUTPUT_VALUE = 'SET_EXCHANGE_OUTPUT_VALUE';
export const SET_EXCHANGE_RATE = 'SET_EXCHANGE_RATE';
export const SET_EXCHANGE_FEE = 'SET_EXCHANGE_FEE';

// test setInteractionState
export const PUT_WEB3_IN_STORE = 'PUT_WEB3_IN_STORE';
