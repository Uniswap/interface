const initialState = {
  web3: null,
  arkaneConnect: null,
  provider: '',
  networkId: 0,
  initialized: false,
  account: '',
  balances: {
    vechain: {},
  },
  approvals: {
    '0x0': {
      TOKEN_OWNER: {
        SPENDER: {},
      },
    },
  },
  transactions: {
    pending: [],
    confirmed: [],
  },
  watched: {
    balances: {
      vechain: [],
    },
    approvals: {},
  },
  contracts: {},
};

export default initialState;
