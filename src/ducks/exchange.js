import {
  SET_INPUT_BALANCE,
  SET_OUTPUT_BALANCE,
  SET_INPUT_TOKEN,
  SET_OUTPUT_TOKEN,
  SET_ETH_POOL_1,
  SET_ETH_POOL_2,
  SET_TOKEN_POOL_1,
  SET_TOKEN_POOL_2,
  SET_ALLOWANCE_APPROVAL_STATE,
  SET_EXCHANGE_INPUT_VALUE,
  SET_EXCHANGE_OUTPUT_VALUE,
  SET_EXCHANGE_RATE,
  SET_EXCHANGE_FEE,
  SET_INVEST_TOKEN,
  SET_INVEST_ETH_POOL,
  SET_INVEST_TOKEN_POOL,
  SET_INVEST_TOKEN_ALLOWANCE,
  SET_INVEST_SHARES,
  SET_USER_SHARES,
  SET_INVEST_ETH_BALANCE,
  SET_INVEST_TOKEN_BALANCE,
  SET_INVEST_SHARES_INPUT,
  SET_INVEST_ETH_REQUIRED,
  SET_INVEST_TOKENS_REQUIRED,
  SET_INVEST_CHECKED
} from '../constants/actionTypes';


export const setInputBalance = (inputBalance) => ({
  type: SET_INPUT_BALANCE,
  inputBalance
});

export const setOutputBalance = (outputBalance) => ({
  type: SET_OUTPUT_BALANCE,
  outputBalance
})

export const setInputToken = (inputToken) => ({
  type: SET_INPUT_TOKEN,
  inputToken
});

export const setOutputToken = (outputToken) => ({
  type: SET_OUTPUT_TOKEN,
  outputToken
});

export const setEthPool1 = (ethPool1) => ({
  type: SET_ETH_POOL_1,
  ethPool1
});

export const setEthPool2 = (ethPool2) => ({
  type: SET_ETH_POOL_2,
  ethPool2
});

export const setTokenPool1 = (tokenPool1) => ({
  type: SET_TOKEN_POOL_1,
  tokenPool1
});

export const setTokenPool2 = (tokenPool2) => ({
  type: SET_TOKEN_POOL_2,
  tokenPool2
});

export const setAllowanceApprovalState = (allowanceApproved) => ({
  type: SET_ALLOWANCE_APPROVAL_STATE,
  allowanceApproved
});

export const setExchangeInputValue = (inputValue) => ({
  type: SET_EXCHANGE_INPUT_VALUE,
  inputValue
});

export const setExchangeOutputValue = (outputValue) => ({
  type: SET_EXCHANGE_OUTPUT_VALUE,
  outputValue
});

export const setExchangeRate = (rate) => ({
  type: SET_EXCHANGE_RATE,
  rate
});

export const setExchangeFee = (fee) => ({
  type: SET_EXCHANGE_FEE,
  fee
});

export const setInvestToken = (investToken) => ({
  type: SET_INVEST_TOKEN,
  investToken
});

export const setInvestEthPool = (investEthPool) => ({
  type: SET_INVEST_ETH_POOL,
  investEthPool
});

export const setInvestTokenPool = (investTokenPool) => ({
  type: SET_INVEST_TOKEN_POOL,
  investTokenPool
});

export const setInvestShares = (investShares) => ({
  type: SET_INVEST_SHARES,
  investShares
});

export const setUserShares = (userShares) => ({
  type: SET_USER_SHARES,
  userShares
});

export const setInvestTokenBalance = (investTokenBalance) => ({
  type: SET_INVEST_TOKEN_BALANCE,
  investTokenBalance
});

export const setInvestEthBalance = (investEthBalance) => ({
  type: SET_INVEST_ETH_BALANCE,
  investEthBalance
});

export const setInvestTokenAllowance = (investTokenAllowance) => ({
  type: SET_INVEST_TOKEN_ALLOWANCE,
  investTokenAllowance
});

export const setInvestSharesInput = (investSharesInput) => ({
  type: SET_INVEST_SHARES_INPUT,
  investSharesInput
});

export const setInvestEthRequired = (investEthRequired) => ({
  type: SET_INVEST_ETH_REQUIRED,
  investEthRequired
});

export const setInvestTokensRequired = (investTokensRequired) => ({
  type: SET_INVEST_TOKENS_REQUIRED,
  investTokensRequired
});

export const setInvestChecked = (investChecked) => ({
  type: SET_INVEST_CHECKED,
  investChecked
});

export default (state = {}, action) => {
  const {
    inputBalance,
    outputBalance,
    inputToken,
    outputToken,
    ethPool1,
    ethPool2,
    tokenPool1,
    tokenPool2,
    allowanceApproved,
    inputValue,
    outputValue,
    rate,
    fee,
    investToken,
    investEthPool,
    investTokenPool,
    investShares,
    userShares,
    investEthBalance,
    investTokenBalance,
    investTokenAllowance,
    investSharesInput,
    investEthRequired,
    investTokensRequired,
    investChecked
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
    case SET_ETH_POOL_1:
      return Object.assign({}, state, { ethPool1: ethPool1 });
    case SET_ETH_POOL_2:
      return Object.assign({}, state, { ethPool2: ethPool2 });
    case SET_TOKEN_POOL_1:
      return Object.assign({}, state, { tokenPool1: tokenPool1 });
    case SET_TOKEN_POOL_2:
      return Object.assign({}, state, { tokenPool2: tokenPool2 });
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
    case SET_INVEST_TOKEN_ALLOWANCE:
      return Object.assign({}, state, { investTokenAllowance: investTokenAllowance });
    case SET_INVEST_SHARES_INPUT:
      return Object.assign({}, state, { investSharesInput: investSharesInput });
    case SET_INVEST_ETH_REQUIRED:
      return Object.assign({}, state, { investEthRequired: investEthRequired });
    case SET_INVEST_TOKENS_REQUIRED:
      return Object.assign({}, state, { investTokensRequired: investTokensRequired });
    case SET_INVEST_CHECKED:
      return Object.assign({}, state, { investChecked: investChecked });
    default: return state;
  }
}
