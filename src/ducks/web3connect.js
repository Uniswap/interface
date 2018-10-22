import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
import { drizzleConnect } from 'drizzle-react';
import {BigNumber as BN} from 'bignumber.js';
import Web3 from 'web3';
import ERC20_ABI from "../abi/erc20";

export const INITIALIZE = 'we3connect/initialize';
export const UPDATE_ACCOUNT = 'we3connect/updateAccount';
export const WATCH_ETH_BALANCE = 'web3connect/watchEthBalance';
export const WATCH_TOKEN_BALANCE = 'web3connect/watchTokenBalance';
export const UPDATE_ETH_BALANCE = 'web3connect/updateEthBalance';
export const UPDATE_TOKEN_BALANCE = 'web3connect/updateTokenBalance';
export const ADD_CONTRACT = 'web3connect/addContract';


const initialState = {
  web3: null,
  account: '',
  balances: {
    ethereum: {},
  },
  pendingTransactions: [],
  transactions: {},
  errorMessage: '',
  watched: {
    balances: {
      ethereum: [],
    },
  },
  contracts: {},
};

// selectors
export const selectors = () => (dispatch, getState) => {
  const state = getState().web3connect;

  return {
    getBalance: address => {
      const balance = state.balances.ethereum[address];
      console.log({balance})
      if (!balance) {
        dispatch(watchBalance({ balanceOf: address }));
        return Balance(0, 'ETH');
      }
      return balance;
    },

    getTokenBalance: (tokenAddress, address) => {
      const tokenBalances = state.balances[tokenAddress];

      if (!tokenBalances) {
        dispatch(watchBalance({ balanceOf: address, tokenAddress }));
        return Balance(0);
      }

      const balance = tokenBalances[address];
      if (!balance) {
        dispatch(watchBalance({ balanceOf: address, tokenAddress }));
        return Balance(0);
      }
      return balance;
    },
  }
};

const Balance = (value, label = '', decimals = 18) => ({
  value: BN(value),
  label: label.toUpperCase(),
  decimals: +decimals,
});

export const initialize = () => (dispatch, getState) => {
  const { web3connect } = getState();

  return new Promise(async resolve => {
    if (web3connect.web3) {
      resolve(web3connect.web3);
      return;
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        dispatch({
          type: INITIALIZE,
          payload: web3,
        });
        resolve(web3);
        return;
      } catch (error) {
        console.error('User denied access.');
        return;
      }
    }

    if (typeof window.web3 !== 'undefined') {
      const web3 = new Web3(window.web3.currentProvider);
      await window.ethereum.enable();
      dispatch({
        type: INITIALIZE,
        payload: web3,
      });
      resolve(web3);
    }
  })
};

export const watchBalance = ({ balanceOf, tokenAddress }) => {
  if (!balanceOf) {
    return { type: '' };
  }

  if (!tokenAddress) {
    return {
      type: WATCH_ETH_BALANCE,
      payload: balanceOf,
    };
  } else if (tokenAddress) {
    return {
      type: WATCH_TOKEN_BALANCE,
      payload: {
        tokenAddress,
        balanceOf,
      },
    };
  }
}

export const sync = () => async (dispatch, getState) => {
  const web3 = await dispatch(initialize());
  const {
    account,
    watched,
    contracts,
  } = getState().web3connect;

  // Sync Account
  const accounts = await web3.eth.getAccounts();
  if (account !== accounts[0]) {
    dispatch({ type: UPDATE_ACCOUNT, payload: accounts[0] });
    dispatch(watchBalance({ balanceOf: accounts[0] }));
    // dispatch(watchBalance({ balanceOf: accounts[0], tokenAddress: '0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B' }));
  }

  // Sync Ethereum Balances
  watched.balances.ethereum.forEach(async address => {
    const balance = await web3.eth.getBalance(address);
    dispatch({
      type: UPDATE_ETH_BALANCE,
      payload: {
        balance: Balance(balance, 'ETH', 18),
        balanceOf: address,
      },
    })
  });

  // Sync Token Balances
  Object.keys(watched.balances)
    .forEach(tokenAddress => {
      if (tokenAddress === 'ethereum') {
        return;
      }

      const contract = contracts[tokenAddress] || new web3.eth.Contract(ERC20_ABI, tokenAddress);

      if (!contracts[tokenAddress]) {
        dispatch({
          type: ADD_CONTRACT,
          payload: {
            address: tokenAddress,
            contract: contract,
          },
        });
      }

      const watchlist = watched.balances[tokenAddress] || [];
      watchlist.forEach(async address => {
        const balance = await contract.methods.balanceOf(address).call();
        const decimals = await contract.methods.decimals().call();
        const symbol = await contract.methods.symbol().call();
        dispatch({
          type: UPDATE_TOKEN_BALANCE,
          payload: {
            tokenAddress,
            balanceOf: address,
            balance: Balance(balance, symbol, decimals),
          },
        });
      });
    });
};

export const startWatching = () => async (dispatch, getState) => {
  const { account } = getState().web3connect;
  const timeout = !account
    ? 1000
    : 5000;

  dispatch(sync());

  setTimeout(() => dispatch(startWatching()), timeout);
};

export default function web3connectReducer(state = initialState, { type, payload }) {
  switch (type) {
    case INITIALIZE:
      return { ...state, web3: payload };
    case UPDATE_ACCOUNT:
      return {
        ...state,
        account: payload,
      };
    case WATCH_ETH_BALANCE:
      return {
        ...state,
        watched: {
          ...state.watched,
          balances: {
            ...state.watched.balances,
            ethereum: [ ...state.watched.balances.ethereum, payload ],
          },
        },
      };
    case WATCH_TOKEN_BALANCE:
      const { watched } = state;
      const { balances } = watched;
      const watchlist = balances[payload.tokenAddress] || [];

      return {
        ...state,
        watched: {
          ...watched,
          balances: {
            ...balances,
            [payload.tokenAddress]: [ ...watchlist, payload.balanceOf ],
          },
        },
      };
    case UPDATE_ETH_BALANCE:
      return {
        ...state,
        balances: {
          ...state.balances,
          ethereum: {
            ...state.balances.ethereum,
            [payload.balanceOf]: payload.balance,
          },
        },
      };
    case UPDATE_TOKEN_BALANCE:
      const tokenBalances = state.balances[payload.tokenAddress] || {};
      return {
        ...state,
        balances: {
          ...state.balances,
          [payload.tokenAddress]: {
            ...tokenBalances,
            [payload.balanceOf]: payload.balance,
          },
        },
      };
    case ADD_CONTRACT:
      return {
        ...state,
        contracts: {
          ...state.contracts,
          [payload.address]: payload.contract,
        },
      };
    default:
      return state;
  }
}

// Connect Component
export class _Web3Connect extends Component {
  static propTypes = {
    initialize: PropTypes.func.isRequired,
  };

  static defaultProps = {
    initialize() {}
  };

  componentWillMount() {
    this.props.initialize()
      .then(this.props.startWatching());
  }

  render() {
    return <noscript />;
  }
}

export const Web3Connect = drizzleConnect(
  _Web3Connect,
  ({ web3connect }) => ({
    web3: web3connect.web3,
  }),
  dispatch => ({
    initialize: () => dispatch(initialize()),
    startWatching: () => dispatch(startWatching()),
  }),
);
