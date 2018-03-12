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

export const setInvariant1 = (invariant1) => ({
  type: SET_INVARIANT_1,
  invariant1
});

export const setInvariant2 = (invariant2) => ({
  type: SET_INVARIANT_2,
  invariant2 
});

export const setMarketEth1 = (marketEth1) => ({
  type: SET_MARKET_ETH_1,
  marketEth1
});

export const setMarketEth2 = (marketEth2) => ({
  type: SET_MARKET_ETH_2,
  marketEth2
});

export const setMarketTokens1 = (marketTokens1) => ({
  type: SET_MARKET_TOKENS_1,
  marketTokens1
});

export const setMarketTokens2 = (marketTokens2) => ({
  type: SET_MARKET_TOKENS_2,
  marketTokens2
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
})

export const setExchangeFee = (fee) => ({
  type: SET_EXCHANGE_FEE,
  fee 
})