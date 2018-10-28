import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {BigNumber as BN} from 'bignumber.js';
import Web3 from 'web3';
import ERC20_ABI from "../abi/erc20";
import ERC20_WITH_BYTES_ABI from "../abi/erc20_symbol_bytes32";

export const INITIALIZE = 'we3connect/initialize';
export const UPDATE_ACCOUNT = 'we3connect/updateAccount';
export const WATCH_ETH_BALANCE = 'web3connect/watchEthBalance';
export const WATCH_TOKEN_BALANCE = 'web3connect/watchTokenBalance';
export const UPDATE_ETH_BALANCE = 'web3connect/updateEthBalance';
export const UPDATE_TOKEN_BALANCE = 'web3connect/updateTokenBalance';
export const WATCH_APPROVALS = 'web3connect/watchApprovals';
export const UPDATE_APPROVALS = 'web3connect/updateApprovals';
export const ADD_CONTRACT = 'web3connect/addContract';

const initialState = {
  web3: null,
  initialized: false,
  account: '',
  balances: {
    ethereum: {},
  },
  approvals: {
    '0x0': {
      TOKEN_OWNER: {
        SPENDER: {},
      },
    },
  },
  pendingTransactions: [],
  transactions: {},
  watched: {
    balances: {
      ethereum: [],
    },
    approvals: {},
  },
  contracts: {},
};

const TOKEN_LABEL_FALLBACK = {
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359': 'DAI',
  '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2': 'MKR',
  '0x9B913956036a3462330B0642B20D3879ce68b450': 'BAT + ETH'
};

// selectors
export const selectors = () => (dispatch, getState) => {
  const state = getState().web3connect;

  const getTokenBalance = (tokenAddress, address) => {
    const tokenBalances = state.balances[tokenAddress] || {};
    const balance = tokenBalances[address];
    if (!balance) {
      dispatch(watchBalance({ balanceOf: address, tokenAddress }));
      return Balance(0);
    }
    return balance;
  };

  const getBalance = (address, tokenAddress) => {
    if (process.env.NODE_ENV !== 'production' && !tokenAddress) {
      console.warn('No token address found - return ETH balance');
    }

    if (!tokenAddress || tokenAddress === 'ETH') {
      const balance = state.balances.ethereum[address];
      if (!balance) {
        dispatch(watchBalance({ balanceOf: address }));
        return Balance(0, 'ETH');
      }
      return balance;
    } else if (tokenAddress) {
      return getTokenBalance(tokenAddress, address);
    }

    return Balance(NaN);
  };

  const getApprovals = (tokenAddress, tokenOwner, spender) => {
    const token = state.approvals[tokenAddress] || {};
    const owner = token[tokenOwner] || {};

    if (!owner[spender]) {
      dispatch(watchApprovals({ tokenAddress, tokenOwner, spender }));
      return Balance(0);
    }

    return owner[spender];
  };

  return {
    getBalance,
    getTokenBalance,
    getApprovals,
  };
};

const Balance = (value, label = '', decimals = 18) => ({
  value: BN(value),
  label: label.toUpperCase(),
  decimals: +decimals,
});

export const initialize = () => (dispatch, getState) => {
  const { web3connect } = getState();

  return new Promise(async (resolve, reject) => {
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
        dispatch({ type: INITIALIZE });
        reject();
        return;
      }
    }

    if (typeof window.web3 !== 'undefined') {
      const web3 = new Web3(window.web3.currentProvider);
      dispatch({
        type: INITIALIZE,
        payload: web3,
      });
      resolve(web3);
    }

    dispatch({ type: INITIALIZE });
    reject();
  })
};

export const watchBalance = ({ balanceOf, tokenAddress }) => (dispatch, getState) => {
  if (!balanceOf) {
    return;
  }

  const { web3connect } = getState();
  const { watched } = web3connect;

  if (!tokenAddress) {
    if (watched.balances.ethereum.includes(balanceOf)) {
      return;
    }
    dispatch({
      type: WATCH_ETH_BALANCE,
      payload: balanceOf,
    });
    setTimeout(() => dispatch(sync()), 0);
  } else if (tokenAddress) {
    if (watched.balances[tokenAddress] && watched.balances[tokenAddress].includes(balanceOf)) {
      return;
    }
    dispatch({
      type: WATCH_TOKEN_BALANCE,
      payload: {
        tokenAddress,
        balanceOf,
      },
    });
    setTimeout(() => dispatch(sync()), 0);
  }
};

export const watchApprovals = ({ tokenAddress, tokenOwner, spender }) => (dispatch, getState) => {
  const { web3connect: { watched } } = getState();
  const token = watched.approvals[tokenAddress] || {};
  const owner = token[tokenOwner] || [];
  if (owner.includes(spender)) {
    return;
  }
  return dispatch({
    type: WATCH_APPROVALS,
    payload: {
      tokenAddress,
      tokenOwner,
      spender,
    },
  });
};

export const updateApprovals = ({ tokenAddress, tokenOwner, spender, balance }) => ({
  type: UPDATE_APPROVALS,
  payload: {
    tokenAddress,
    tokenOwner,
    spender,
    balance,
  },
});

export const sync = () => async (dispatch, getState) => {
  const { getBalance, getApprovals } = dispatch(selectors());
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
  }

  // Sync Ethereum Balances
  watched.balances.ethereum.forEach(async address => {
    const balance = await web3.eth.getBalance(address);
    const { value } = getBalance(address);

    if (value.isEqualTo(BN(balance))) {
      return;
    }

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
      const contractBytes32 = contracts[tokenAddress] || new web3.eth.Contract(ERC20_WITH_BYTES_ABI, tokenAddress);

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
        const tokenBalance = getBalance(address, tokenAddress);
        const balance = await contract.methods.balanceOf(address).call();
        const decimals = tokenBalance.decimals || await contract.methods.decimals().call();
        let symbol = tokenBalance.symbol;

        try {
          symbol = symbol || await contract.methods.symbol().call().catch();
        } catch (e) {
          try {
            symbol = symbol || web3.utils.hexToString(await contractBytes32.methods.symbol().call().catch());
          } catch (err) {

          }
        }

        if (tokenBalance.value.isEqualTo(BN(balance)) && tokenBalance.label && tokenBalance.decimals) {
          return;
        }

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

    // Update Approvals
    Object.entries(watched.approvals)
      .forEach(([tokenAddress, token]) => {
        const contract = contracts[tokenAddress] || new web3.eth.Contract(ERC20_ABI, tokenAddress);
        Object.entries(token)
          .forEach(([ tokenOwnerAddress, tokenOwner ]) => {
            tokenOwner.forEach(async spenderAddress => {
              const approvalBalance = getApprovals(tokenAddress, tokenOwnerAddress, spenderAddress);
              const balance = await contract.methods.allowance(tokenOwnerAddress, spenderAddress).call();
              const decimals = approvalBalance.decimals || await contract.methods.decimals().call();
              const symbol = TOKEN_LABEL_FALLBACK[tokenAddress] || approvalBalance.label || await contract.methods.symbol().call();

              if (approvalBalance.label && approvalBalance.value.isEqualTo(BN(balance))) {
                return;
              }

              dispatch(updateApprovals({
                tokenAddress,
                tokenOwner: tokenOwnerAddress,
                spender: spenderAddress,
                balance: Balance(balance, symbol, decimals),
              }));
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
      return {
        ...state,
        web3: payload,
        initialized: true,
      };
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
    case WATCH_APPROVALS:
      const token = state.watched.approvals[payload.tokenAddress] || {};
      const tokenOwner = token[payload.tokenOwner] || [];

      return {
        ...state,
        watched: {
          ...state.watched,
          approvals: {
            ...state.watched.approvals,
            [payload.tokenAddress]: {
              ...token,
              [payload.tokenOwner]: [ ...tokenOwner, payload.spender ],
            },
          },
        },
      };
    case UPDATE_APPROVALS:
      const erc20 = state.approvals[payload.tokenAddress] || {};
      const erc20Owner = erc20[payload.tokenOwner] || {};

      return {
        ...state,
        approvals: {
          ...state.approvals,
          [payload.tokenAddress]: {
            ...erc20,
            [payload.tokenOwner]: {
              ...erc20Owner,
              [payload.spender]: payload.balance,
            },
          },
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

export const Web3Connect = connect(
  ({ web3connect }) => ({
    web3: web3connect.web3,
  }),
  dispatch => ({
    initialize: () => dispatch(initialize()),
    startWatching: () => dispatch(startWatching()),
  }),
)(_Web3Connect);
