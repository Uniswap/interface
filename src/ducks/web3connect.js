import { BigNumber as BN } from 'bignumber.js'
import Web3 from 'web3'
import ERC20_ABI from '../abi/erc20'
import ERC20_WITH_BYTES_ABI from '../abi/erc20_symbol_bytes32'

export const INITIALIZE = 'web3connect/initialize'
export const INITIALIZE_WEB3 = 'web3connect/initializeWeb3'
export const UPDATE_ACCOUNT = 'web3connect/updateAccount'
export const WATCH_ETH_BALANCE = 'web3connect/watchEthBalance'
export const WATCH_TOKEN_BALANCE = 'web3connect/watchTokenBalance'
export const UPDATE_ETH_BALANCE = 'web3connect/updateEthBalance'
export const UPDATE_TOKEN_BALANCE = 'web3connect/updateTokenBalance'
export const WATCH_APPROVALS = 'web3connect/watchApprovals'
export const UPDATE_APPROVALS = 'web3connect/updateApprovals'
export const ADD_CONTRACT = 'web3connect/addContract'
export const UPDATE_NETWORK_ID = 'web3connect/updateNetworkId'
export const ADD_PENDING_TX = 'web3connect/addPendingTx'
export const REMOVE_PENDING_TX = 'web3connect/removePendingTx'
export const ADD_CONFIRMED_TX = 'web3connect/addConfirmedTx'

const initialState = {
  web3: null,
  networkId: 0,
  initialized: false,
  account: null,
  balances: {
    ethereum: {}
  },
  approvals: {
    '0x0': {
      TOKEN_OWNER: {
        SPENDER: {}
      }
    }
  },
  transactions: {
    pending: [],
    confirmed: []
  },
  watched: {
    balances: {
      ethereum: []
    },
    approvals: {}
  },
  contracts: {}
}

// selectors
export const selectors = () => (dispatch, getState) => {
  const state = getState().web3connect

  const getTokenBalance = (tokenAddress, address) => {
    const tokenBalances = state.balances[tokenAddress] || {}
    const balance = tokenBalances[address]
    if (!balance) {
      dispatch(watchBalance({ balanceOf: address, tokenAddress }))
      return Balance(0)
    }
    return balance
  }

  const getBalance = (address, tokenAddress) => {
    if (!tokenAddress || tokenAddress === 'ETH') {
      const balance = state.balances.ethereum[address]
      if (!balance) {
        dispatch(watchBalance({ balanceOf: address }))
        return Balance(0, 'ETH')
      }
      return balance
    } else if (tokenAddress) {
      return getTokenBalance(tokenAddress, address)
    }

    return Balance(NaN)
  }

  const getApprovals = (tokenAddress, tokenOwner, spender) => {
    const token = state.approvals[tokenAddress] || {}
    const owner = token[tokenOwner] || {}

    if (!owner[spender]) {
      dispatch(watchApprovals({ tokenAddress, tokenOwner, spender }))
      return Balance(0)
    }

    return owner[spender]
  }

  return {
    getBalance,
    getTokenBalance,
    getApprovals
  }
}

const Balance = (value, label = '', decimals = 0) => ({
  value: BN(value),
  label: label.toUpperCase(),
  decimals: +decimals
})

export const initialize = () => async dispatch => {
  await dispatch({ type: INITIALIZE })
}

export const updateNetwork = (passedProvider, networkId) => async dispatch => {
  const web3 = new Web3(passedProvider)

  const dispatches = [
    dispatch({ type: INITIALIZE_WEB3, payload: web3 }),
    dispatch({ type: UPDATE_NETWORK_ID, payload: networkId })
  ]

  await Promise.all(dispatches)
}

export const updateAccount = account => async dispatch => {
  if (account !== null) {
    const dispatches = [
      dispatch({ type: UPDATE_ACCOUNT, payload: account }),
      dispatch(watchBalance({ balanceOf: account }))
    ]

    await Promise.all(dispatches)
  }
}

export const watchBalance = ({ balanceOf, tokenAddress }) => (dispatch, getState) => {
  if (!balanceOf) {
    return
  }

  const { web3connect } = getState()
  const { watched } = web3connect

  if (!tokenAddress) {
    if (watched.balances.ethereum.includes(balanceOf)) {
      return
    }
    dispatch({
      type: WATCH_ETH_BALANCE,
      payload: balanceOf
    })
    setTimeout(() => dispatch(sync()), 0)
  } else if (tokenAddress) {
    if (watched.balances[tokenAddress] && watched.balances[tokenAddress].includes(balanceOf)) {
      return
    }
    dispatch({
      type: WATCH_TOKEN_BALANCE,
      payload: {
        tokenAddress,
        balanceOf
      }
    })
    setTimeout(() => dispatch(sync()), 0)
  }
}

export const watchApprovals = ({ tokenAddress, tokenOwner, spender }) => (dispatch, getState) => {
  const {
    web3connect: { watched }
  } = getState()
  const token = watched.approvals[tokenAddress] || {}
  const owner = token[tokenOwner] || []
  if (owner.includes(spender)) {
    return
  }
  return dispatch({
    type: WATCH_APPROVALS,
    payload: {
      tokenAddress,
      tokenOwner,
      spender
    }
  })
}

export const addPendingTx = txId => ({
  type: ADD_PENDING_TX,
  payload: txId
})

export const updateApprovals = ({ tokenAddress, tokenOwner, spender, balance }) => ({
  type: UPDATE_APPROVALS,
  payload: {
    tokenAddress,
    tokenOwner,
    spender,
    balance
  }
})

export const sync = () => async (dispatch, getState) => {
  const { getBalance, getApprovals } = dispatch(selectors())

  const {
    web3,
    watched,
    contracts,
    transactions: { pending }
  } = getState().web3connect

  // Sync Ethereum Balances
  watched.balances.ethereum.forEach(async address => {
    const balance = await web3.eth.getBalance(address)
    const { value } = getBalance(address)

    if (value.isEqualTo(BN(balance))) {
      return
    }

    dispatch({
      type: UPDATE_ETH_BALANCE,
      payload: {
        balance: Balance(balance, 'ETH', 18),
        balanceOf: address
      }
    })
  })

  // Sync Token Balances
  Object.keys(watched.balances).forEach(tokenAddress => {
    if (tokenAddress === 'ethereum') {
      return
    }

    const contract = contracts[tokenAddress] || new web3.eth.Contract(ERC20_ABI, tokenAddress)

    if (!contracts[tokenAddress]) {
      dispatch({
        type: ADD_CONTRACT,
        payload: {
          address: tokenAddress,
          contract: contract
        }
      })
    }

    const watchlist = watched.balances[tokenAddress] || []
    watchlist.forEach(async address => {
      const tokenBalance = getBalance(address, tokenAddress)
      const balance = await contract.methods.balanceOf(address).call()
      const decimals = tokenBalance.decimals || (await contract.methods.decimals().call())
      let symbol = tokenBalance.symbol
      try {
        symbol =
          symbol ||
          (await contract.methods
            .symbol()
            .call()
            .catch())
      } catch (e) {
        try {
          const contractBytes32 = new web3.eth.Contract(ERC20_WITH_BYTES_ABI, tokenAddress)
          symbol =
            symbol ||
            web3.utils.hexToString(
              await contractBytes32.methods
                .symbol()
                .call()
                .catch()
            )
        } catch (err) {}
      }

      if (tokenBalance.value.isEqualTo(BN(balance)) && tokenBalance.label && tokenBalance.decimals) {
        return
      }

      dispatch({
        type: UPDATE_TOKEN_BALANCE,
        payload: {
          tokenAddress,
          balanceOf: address,
          balance: Balance(balance, symbol, decimals)
        }
      })
    })
  })

  // Update Approvals
  Object.entries(watched.approvals).forEach(([tokenAddress, token]) => {
    const contract = contracts[tokenAddress] || new web3.eth.Contract(ERC20_ABI, tokenAddress)

    Object.entries(token).forEach(([tokenOwnerAddress, tokenOwner]) => {
      tokenOwner.forEach(async spenderAddress => {
        if (tokenOwnerAddress !== null && tokenOwnerAddress !== 'null') {
          const approvalBalance = getApprovals(tokenAddress, tokenOwnerAddress, spenderAddress)
          const balance = await contract.methods.allowance(tokenOwnerAddress, spenderAddress).call()
          const decimals = approvalBalance.decimals || (await contract.methods.decimals().call())
          let symbol = approvalBalance.label
          try {
            symbol = symbol || (await contract.methods.symbol().call())
          } catch (e) {
            try {
              const contractBytes32 = new web3.eth.Contract(ERC20_WITH_BYTES_ABI, tokenAddress)
              symbol = symbol || web3.utils.hexToString(await contractBytes32.methods.symbol().call())
            } catch (err) {}
          }
          if (approvalBalance.label && approvalBalance.value.isEqualTo(BN(balance))) {
            return
          }
          dispatch(
            updateApprovals({
              tokenAddress,
              tokenOwner: tokenOwnerAddress,
              spender: spenderAddress,
              balance: Balance(balance, symbol, decimals)
            })
          )
        }
      })
    })
  })

  pending.forEach(async txId => {
    try {
      const data = (await web3.eth.getTransactionReceipt(txId)) || {}

      // If data is an empty obj, then it's still pending.
      if (!('status' in data)) {
        return
      }

      dispatch({
        type: REMOVE_PENDING_TX,
        payload: txId
      })

      if (data.status) {
        dispatch({
          type: ADD_CONFIRMED_TX,
          payload: txId
        })
      } else {
        // TODO: dispatch ADD_REJECTED_TX
      }
    } catch (err) {
      dispatch({
        type: REMOVE_PENDING_TX,
        payload: txId
      })
      // TODO: dispatch ADD_REJECTED_TX
    }
  })
}

export const startWatching = () => async dispatch => {
  await dispatch(sync())
  setTimeout(() => dispatch(startWatching()), 5000)
}

export default function web3connectReducer(state = initialState, { type, payload }) {
  switch (type) {
    case INITIALIZE_WEB3:
      return {
        ...state,
        web3: payload
      }
    case INITIALIZE:
      return {
        ...state,
        initialized: true
      }
    case UPDATE_NETWORK_ID:
      return { ...state, networkId: payload }
    case UPDATE_ACCOUNT:
      return {
        ...state,
        account: payload
      }
    case WATCH_ETH_BALANCE:
      return {
        ...state,
        watched: {
          ...state.watched,
          balances: {
            ...state.watched.balances,
            ethereum: [...state.watched.balances.ethereum, payload]
          }
        }
      }
    case WATCH_TOKEN_BALANCE:
      const { watched } = state
      const { balances } = watched
      const watchlist = balances[payload.tokenAddress] || []

      return {
        ...state,
        watched: {
          ...watched,
          balances: {
            ...balances,
            [payload.tokenAddress]: [...watchlist, payload.balanceOf]
          }
        }
      }
    case UPDATE_ETH_BALANCE:
      return {
        ...state,
        balances: {
          ...state.balances,
          ethereum: {
            ...state.balances.ethereum,
            [payload.balanceOf]: payload.balance
          }
        }
      }
    case UPDATE_TOKEN_BALANCE:
      const tokenBalances = state.balances[payload.tokenAddress] || {}
      return {
        ...state,
        balances: {
          ...state.balances,
          [payload.tokenAddress]: {
            ...tokenBalances,
            [payload.balanceOf]: payload.balance
          }
        }
      }
    case ADD_CONTRACT:
      return {
        ...state,
        contracts: {
          ...state.contracts,
          [payload.address]: payload.contract
        }
      }
    case WATCH_APPROVALS:
      const token = state.watched.approvals[payload.tokenAddress] || {}
      const tokenOwner = token[payload.tokenOwner] || []

      return {
        ...state,
        watched: {
          ...state.watched,
          approvals: {
            ...state.watched.approvals,
            [payload.tokenAddress]: {
              ...token,
              [payload.tokenOwner]: [...tokenOwner, payload.spender]
            }
          }
        }
      }
    case UPDATE_APPROVALS:
      const erc20 = state.approvals[payload.tokenAddress] || {}
      const erc20Owner = erc20[payload.tokenOwner] || {}

      return {
        ...state,
        approvals: {
          ...state.approvals,
          [payload.tokenAddress]: {
            ...erc20,
            [payload.tokenOwner]: {
              ...erc20Owner,
              [payload.spender]: payload.balance
            }
          }
        }
      }
    case ADD_PENDING_TX:
      return {
        ...state,
        transactions: {
          ...state.transactions,
          pending: [...state.transactions.pending, payload]
        }
      }
    case REMOVE_PENDING_TX:
      return {
        ...state,
        transactions: {
          ...state.transactions,
          pending: state.transactions.pending.filter(id => id !== payload)
        }
      }
    case ADD_CONFIRMED_TX:
      if (state.transactions.confirmed.includes(payload)) {
        return state
      }

      return {
        ...state,
        transactions: {
          ...state.transactions,
          confirmed: [...state.transactions.confirmed, payload]
        }
      }
    default:
      return state
  }
}
