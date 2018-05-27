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
  SET_INVEST_SHARES,
  SET_USER_SHARES,
  SET_INVEST_TOKEN_BALANCE,
  SET_INVEST_ETH_BALANCE,
  SET_INVEST_TOKEN_ALLOWANCE,
  SET_INVEST_SHARES_INPUT,
  SET_INVEST_ETH_REQUIRED,
  SET_INVEST_TOKENS_REQUIRED,
  SET_INVEST_CHECKED
} from '../constants';

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
