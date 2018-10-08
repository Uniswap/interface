import Web3 from "web3";

const INITIALIZE = 'app/web3/initialize';
const UPDATE_CURRENT_ADDRESS = 'app/web3/updateCurrentAddress';
const UPDATE_BALANCE = 'app/web3/updateBalance';

const initialState = {
  web3: {},
  currentAddress: '',
  balance: {},
  exchangeAddresses: {
    addresses: [
      ['BAT','0x80f5C1beA2Ea4a9C21E4c6D7831ae2Dbce45674d'],
      ['DAI','0x9eb0461bcc20229bE61319372cCA84d782823FCb'],
      ['MKR','0x4c86a3b3cf926de3644f60658071ca604949609f'],
      ['OMG','0x1033f09e293200de63AF16041e83000aFBBfF5c0'],
      ['ZRX','0x42E109452F4055c82a513A527690F2D73251367e']
    ]
  },
  tokenAddresses: {
    addresses: [
      ['BAT','0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B'],
      ['DAI','0x2448eE2641d78CC42D7AD76498917359D961A783'],
      ['MKR','0xf9ba5210f91d0474bd1e1dcdaec4c58e359aad85'],
      ['OMG','0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0'],
      ['ZRX','0xF22e3F33768354c9805d046af3C0926f27741B43']
    ]
  },
};

export const initialize = () => dispatch => {
  if (typeof window.web3 !== 'undefined') {
    const web3 = new Web3(window.web3.currentProvider);
    dispatch({
      type: INITIALIZE,
      payload: web3,
    });
    dispatch(updateCurrentAddress());
  }
};

export const updateCurrentAddress = () => (dispatch, getState) => {
  const { web3: { web3 } } = getState();

  if (!web3) {
    return;
  }

  web3.eth.getAccounts((err, accounts) => {
    if (err) {
      return;
    }

    dispatch({
      type: UPDATE_CURRENT_ADDRESS,
      payload: accounts[0],
    });
  })
};

export const updateBalance = () => (dispatch, getState) => {
  const { web3: { web3, currentAddress } } = getState();

  if (!web3 || !currentAddress) {
    return;
  }

  web3.eth.getBalance(currentAddress, (e, data) => {
    if (e) {
      return;
    }

    dispatch({
      type: UPDATE_BALANCE,
      payload: {
        address: 'ETH',
        balance: data,
      }
    })
  });
};


export default (state = initialState, { type, payload }) => {
  switch (type) {
    case INITIALIZE:
      return { ...state, web3: payload };
    case UPDATE_CURRENT_ADDRESS:
      return { ...state, currentAddress: payload };
    case UPDATE_BALANCE:
      return {
        ...state,
        balance: {
          ...state.balance,
          [payload.address]: payload.balance,
        },
      };
    default: return state;
  }
}
