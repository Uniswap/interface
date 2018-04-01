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
  SET_EXCHANGE_FEE,
  SET_INVEST_TOKEN,
  SET_INVEST_INVARIANT,
  SET_INVEST_ETH_POOL,
  SET_INVEST_TOKEN_POOL,
  SET_INVEST_SHARES,
  SET_USER_SHARES,
  SET_INVEST_ETH_BALANCE,
  SET_INVEST_TOKEN_BALANCE,
  SET_INVEST_SHARES_INPUT,
  SET_INVEST_ETH_REQUIRED,
  SET_INVEST_TOKENS_REQUIRED
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
    fee,
    investToken,
    investInvariant,
    investEthPool,
    investTokenPool,
    investShares,
    userShares,
    investEthBalance,
    investTokenBalance,
    investSharesInput,
    investEthRequired,
    investTokensRequired
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
    case SET_INVEST_TOKEN:
      return Object.assign({}, state, { investToken: investToken });
    case SET_INVEST_INVARIANT:
      return Object.assign({}, state, { investInvariant: investInvariant });
    case SET_INVEST_ETH_POOL:
      return Object.assign({}, state, { investEthPool: investEthPool });
    case SET_INVEST_TOKEN_POOL:
      return Object.assign({}, state, { investTokenPool: investTokenPool });
    case SET_INVEST_SHARES:
      return Object.assign({}, state, { investShares: investShares });
    case SET_USER_SHARES:
      return Object.assign({}, state, { userShares: userShares });
    case SET_INVEST_ETH_BALANCE:
      return Object.assign({}, state, { investEthBalance: investEthBalance });
    case SET_INVEST_TOKEN_BALANCE:
      return Object.assign({}, state, { investTokenBalance: investTokenBalance });
    case SET_INVEST_SHARES_INPUT:
      return Object.assign({}, state, { investSharesInput: investSharesInput });
    case SET_INVEST_ETH_REQUIRED:
      return Object.assign({}, state, { investEthRequired: investEthRequired });
    case SET_INVEST_TOKENS_REQUIRED:
      return Object.assign({}, state, { investTokensRequired: investTokensRequired });
    default: return state;
  }
}
