import { 
  SET_INPUT_BALANCE,
  SET_OUTPUT_BALANCE,
  SET_INPUT_TOKEN,
  SET_OUTPUT_TOKEN,
  SET_INVARIANT_1,
  SET_INVARIANT_2,
  SET_MARKET_ETH_1,
  SET_MARKET_ETH_2,
  SET_MARKET_TOKENS_1,
  SET_MARKET_TOKENS_2,
  SET_ALLOWANCE_APPROVAL_STATE,
  SET_EXCHANGE_INPUT_VALUE,
  SET_EXCHANGE_OUTPUT_VALUE,
  SET_EXCHANGE_RATE,
  SET_EXCHANGE_FEE
  
} from '../constants';

export default (state = {}, action) => {
  const { 
    inputBalance, 
    outputBalance, 
    inputToken, 
    outputToken, 
    invariant1, 
    invariant2, 
    marketEth1, 
    marketEth2, 
    marketTokens1, 
    marketTokens2, 
    allowanceApproved, 
    inputValue, 
    outputValue, 
    rate, 
    fee
   } = action;

  switch(action.type) {
    case SET_INPUT_BALANCE: 
      return Object.assign({}, state, { inputBalance: inputBalance });
    case SET_OUTPUT_BALANCE:
      return Object.assign({}, state, { outputBalance: outputBalance });
    case SET_INPUT_TOKEN: 
      return Object.assign({}, state, { inputToken: inputToken });
    case SET_OUTPUT_TOKEN:
      return Object.assign({}, state, { outputToken: outputToken });
    case SET_INVARIANT_1: 
      return Object.assign({}, state, { invariant1: invariant1 });
    case SET_INVARIANT_2:
      return Object.assign({}, state, { invariant2: invariant2 });
    case SET_MARKET_ETH_1: 
      return Object.assign({}, state, { marketEth1: marketEth1 });
    case SET_MARKET_ETH_2:
      return Object.assign({}, state, { marketEth2: marketEth2 });
    case SET_MARKET_TOKENS_1: 
      return Object.assign({}, state, { marketTokens1: marketTokens1 });
    case SET_MARKET_TOKENS_2: 
      return Object.assign({}, state, { marketTokens2: marketTokens2 });
    case SET_ALLOWANCE_APPROVAL_STATE: 
      return Object.assign({}, state, { allowanceApproved: allowanceApproved });
    case SET_EXCHANGE_INPUT_VALUE: 
      return Object.assign({}, state, { inputValue: inputValue });
    case SET_EXCHANGE_OUTPUT_VALUE: 
      return Object.assign({}, state, { outputValue: outputValue });
    case SET_EXCHANGE_RATE:
      return Object.assign({}, state, { rate: rate });
    case SET_EXCHANGE_FEE:
      return Object.assign({}, state, { fee: fee });
    default: return state; 
  }
}