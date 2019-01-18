import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { BigNumber as BN } from 'bignumber.js';
import initialState from './initialState';
import ERC20_ABI from "../abi/erc20";
import ERC20_WITH_BYTES_ABI from "../abi/erc20_symbol_bytes32";

import {
  INITIALIZE,
  UPDATE_ACCOUNT,
  WATCH_ETH_BALANCE,
  WATCH_TOKEN_BALANCE,
  UPDATE_ETH_BALANCE,
  UPDATE_TOKEN_BALANCE,
  WATCH_APPROVALS,
  UPDATE_APPROVALS,
  ADD_CONTRACT,
  UPDATE_NETWORK_ID,
  ADD_PENDING_TX,
  REMOVE_PENDING_TX,
  ADD_CONFIRMED_TX,
  UPDATE_WALLET,
} from './creators';

import thor from './thor';
import arkane from './arkane';

const convertArrayToMap = (array, key) => {
  return array.reduce((obj, item) => {
    obj[item[key]] = item;
    return obj;
  }, {});
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
      console.warn('No token address found - return VET balance');
    }

    if (!tokenAddress || tokenAddress === 'VET') {
      const balance = state.balances.vechain[address];
      if (!balance) {
        dispatch(watchBalance({ balanceOf: address }));
        return Balance(0, 'VET');
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

const Balance = (value, label = '', decimals = 0) => ({
  value: BN(value),
  label: label.toUpperCase(),
  decimals: +decimals,
});

export const initialize = (initializeArkane = false) => async (dispatch, getState) => {
  const { provider } = getState().web3connect;

  if (initializeArkane || provider === 'arkane') {
    return arkane(dispatch, getState)
  }

  return thor(dispatch, getState);
};

export const watchBalance = ({ balanceOf, tokenAddress }) => (dispatch, getState) => {
  if (!balanceOf) {
    return;
  }

  const { web3connect } = getState();
  const { watched } = web3connect;

  if (!tokenAddress) {
    if (watched.balances.vechain.includes(balanceOf)) {
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

export const addPendingTx = txId => ({
  type: ADD_PENDING_TX,
  payload: txId,
});

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
    networkId,
    arkaneConnect,
    transactions: { pending, confirmed },
  } = getState().web3connect;

  // Sync Account
  try {
    if (window.arkaneConnect) {
      const wallets = await window.arkaneConnect.api.getWallets();
      const walletsMap = convertArrayToMap(wallets, 'id'); 
      localStorage.setItem('wallets', JSON.stringify(walletsMap));

      if (account !== wallets[0].address) {
        dispatch({ type: UPDATE_ACCOUNT, payload: wallets[0].address });
        dispatch({ type: UPDATE_WALLET, payload: wallets[0].id });
        dispatch(watchBalance({ balanceOf: wallets[0].address }));
      }

    } else {
      const accounts = await web3.eth.getAccounts();
      if (account !== accounts[0]) {
        dispatch({ type: UPDATE_ACCOUNT, payload: accounts[0] });
        dispatch(watchBalance({ balanceOf: accounts[0] }));
      }
    }

  } catch(error) {
    return;
  }

  if (!networkId) {
    const chainTagHex = await web3.eth.getChainTag();

    dispatch({
      type: UPDATE_NETWORK_ID,
      payload: parseInt(chainTagHex, 16),
    });
  }

  // Sync VeChain Balances
  watched.balances.vechain.forEach(async address => {
    const balance = await web3.eth.getBalance(address);
    const { value } = getBalance(address);

    if (value.isEqualTo(BN(balance))) {
      return;
    }

    dispatch({
      type: UPDATE_ETH_BALANCE,
      payload: {
        balance: Balance(balance, 'VET', 18),
        balanceOf: address,
      },
    })
  });

  // Sync Token Balances
  Object.keys(watched.balances)
    .forEach(tokenAddress => {

      if (tokenAddress === 'vechain') {
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
      const contractBytes32 = contracts[tokenAddress] || new web3.eth.Contract(ERC20_WITH_BYTES_ABI, tokenAddress);

      Object.entries(token)
        .forEach(([ tokenOwnerAddress, tokenOwner ]) => {
          tokenOwner.forEach(async spenderAddress => {
            const approvalBalance = getApprovals(tokenAddress, tokenOwnerAddress, spenderAddress);
            const balance = await contract.methods.allowance(tokenOwnerAddress, spenderAddress).call();
            const decimals = approvalBalance.decimals || await contract.methods.decimals().call();
            let symbol = approvalBalance.label;
            try {
              symbol = symbol || await contract.methods.symbol().call();
            } catch (e) {
              try {
                symbol = symbol || web3.utils.hexToString(await contractBytes32.methods.symbol().call());
              } catch (err) {
              }
            }

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

  pending.forEach(async txId => {
    try {
      const data = await web3.eth.getTransactionReceipt(txId) || {};

      // If data is an empty obj, then it's still pending.
      if (!('status' in data)) {
        return;
      }

      dispatch({
        type: REMOVE_PENDING_TX,
        payload: txId,
      });

      if (data.status) {
        dispatch({
          type: ADD_CONFIRMED_TX,
          payload: txId,
        });
      } else {
        // TODO: dispatch ADD_REJECTED_TX
      }
    } catch (err) {
      dispatch({
        type: REMOVE_PENDING_TX,
        payload: txId,
      });
      // TODO: dispatch ADD_REJECTED_TX
    }

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

export default function web3connectReducer(state = initialState, { type, payload, meta }) {
  switch (type) {
    case INITIALIZE:
      return {
        ...state,
        web3: payload,
        arkaneConnect: (meta || {}).arkaneConnect,
        provider: (meta || {}).provider,
        initialized: true,
      };
    case UPDATE_WALLET:
      return {
        ...state,
        wallet: payload,
      }
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
            vechain: [ ...state.watched.balances.vechain, payload ],
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
          vechain: {
            ...state.balances.vechain,
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
    case UPDATE_NETWORK_ID:
      return { ...state, networkId: payload };
    case ADD_PENDING_TX:
      return {
        ...state,
        transactions: {
          ...state.transactions,
          pending: [ ...state.transactions.pending, payload ],
        },
      };
    case REMOVE_PENDING_TX:
      return {
        ...state,
        transactions: {
          ...state.transactions,
          pending: state.transactions.pending.filter(id => id !== payload),
        },
      };
    case ADD_CONFIRMED_TX:
      if (state.transactions.confirmed.includes(payload)) {
        return state;
      }

      return {
        ...state,
        transactions: {
          ...state.transactions,
          confirmed: [ ...state.transactions.confirmed, payload ],
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

  componentDidMount() {
    const { initialize, startWatching } = this.props;
    initialize().then(startWatching());
  }

  componentWillReceiveProps(nextProps) {
    const { initialize, startWatching } = this.props;

    if (typeof window.thor !== 'undefined') {
      initialize().then(startWatching);
    } else {
      initialize(true).then(startWatching);
    }
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
