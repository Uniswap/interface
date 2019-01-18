const TESTNET = {
  factoryAddress: '0x280ce9843Fb642cFff5E58d8fCE6b4Af83612319',
  exchangeAddresses: {
    addresses: [
      ['VTHO','0xB74C4EBd95F70Dd9794d8c49053a297689950b63'],
      ['SHA','0xFD283067E64c0f0fa2543FaFc4A155Bc15dE473C'],
      //['MKR','0x93bB63aFe1E0180d0eF100D774B473034fd60C36'],
      //['OMG','0x26C226EBb6104676E593F8A070aD6f25cDa60F8D'],
      // ['ZRX','0xaBD44a1D1b9Fb0F39fE1D1ee6b1e2a14916D067D'],
    ],
    fromToken: {
      '0x0000000000000000000000000000456e65726779': '0xB74C4EBd95F70Dd9794d8c49053a297689950b63',
      '0x9c6e62B3334294D70c8e410941f52D482557955B': '0xFD283067E64c0f0fa2543FaFc4A155Bc15dE473C',
      //'0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85': '0x93bB63aFe1E0180d0eF100D774B473034fd60C36',
      //'0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0': '0x26C226EBb6104676E593F8A070aD6f25cDa60F8D',
      // '0xF22e3F33768354c9805d046af3C0926f27741B43': '0xaBD44a1D1b9Fb0F39fE1D1ee6b1e2a14916D067D',
    },
  },
  tokenAddresses: {
    addresses: [
      ['VTHO','0x0000000000000000000000000000456e65726779'],
      ['SHA','0x9c6e62B3334294D70c8e410941f52D482557955B'],
      //['MKR','0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85'],
      //['OMG','0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0'],
      // ['ZRX','0xF22e3F33768354c9805d046af3C0926f27741B43'],
    ],
  },
};

const MAIN = {
  factoryAddress: '0x343c948A8B0571242669F2DAA6552Cbc152Dc5D5',
  exchangeAddresses: {
    addresses: [
      ['VTHO', '0xD1FfE4DF50BC951C3828e85A029555acAd0B00Cd'],
      ['PLA', '0x96E3D34EeAF99938295d4F0435bf38a5a9DB934d'],
      ['DBET', '0xFee7514feA4f530fBB18301bBF16d99859ac0473'],
      ['SHA', '0x4a68353A8De5E5f4Be38792AbE1C03Ee76bF2954']
    ],
    fromToken: {
      '0x0000000000000000000000000000456e65726779': '0xD1FfE4DF50BC951C3828e85A029555acAd0B00Cd',
      '0x89827F7bB951Fd8A56f8eF13C5bFEE38522F2E1F': '0x96E3D34EeAF99938295d4F0435bf38a5a9DB934d',
      '0x1b8EC6C2A45ccA481Da6F243Df0d7A5744aFc1f8': '0xFee7514feA4f530fBB18301bBF16d99859ac0473',
      '0x5db3C8A942333f6468176a870dB36eEf120a34DC': '0x4a68353A8De5E5f4Be38792AbE1C03Ee76bF2954',
    },
  },
  tokenAddresses: {
    addresses: [
      ['VTHO', '0x0000000000000000000000000000456e65726779'],
      // ['OCE', '0x0CE6661b4ba86a0EA7cA2Bd86a0De87b0B860F14'],
      ['PLA', '0x89827F7bB951Fd8A56f8eF13C5bFEE38522F2E1F'],
      ['DBET', '0x1b8EC6C2A45ccA481Da6F243Df0d7A5744aFc1f8'],
      ['SHA', '0x5db3C8A942333f6468176a870dB36eEf120a34DC'],
      // ['TIC', '0xa94A33f776073423E163088a5078feac31373990']
    ],
  },
};

const SET_ADDRESSES = 'app/addresses/setAddresses';
const ADD_EXCHANGE = 'app/addresses/addExchange';

const initialState = TESTNET;

export const addExchange = ({label, exchangeAddress, tokenAddress}) => (dispatch, getState) => {
  const { addresses: { tokenAddresses, exchangeAddresses } } = getState();

  if (tokenAddresses.addresses.filter(([ symbol ]) => symbol === label).length) {
    return;
  }

  if (exchangeAddresses.fromToken[tokenAddresses]) {
    return;
  }

  dispatch({
    type: ADD_EXCHANGE,
      payload: {
      label,
        exchangeAddress,
        tokenAddress,
    },
  });
};

export const setAddresses = networkId => {
  switch(networkId) {
    // Main Net
    case 74:
    case '74':
      return {
        type: SET_ADDRESSES,
        payload: MAIN,
      };
    // Testnet
    case 39:
    case '39':
    default:
      return {
        type: SET_ADDRESSES,
        payload: TESTNET,
      };
  }
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case SET_ADDRESSES:
      return payload;
    case ADD_EXCHANGE:
      return handleAddExchange(state, { payload });
    default:
      return state;
  }
}

function handleAddExchange(state, { payload }) {
  const { label, tokenAddress, exchangeAddress } = payload;

  if (!label || !tokenAddress || !exchangeAddress) {
    return state;
  }

  return {
    ...state,
    exchangeAddresses: {
      ...state.exchangeAddresses,
      addresses: [
        ...state.exchangeAddresses.addresses,
        [label, exchangeAddress]
      ],
      fromToken: {
        ...state.exchangeAddresses.fromToken,
        [tokenAddress]: exchangeAddress,
      },
    },
    tokenAddresses: {
      ...state.tokenAddresses,
      addresses: [
        ...state.tokenAddresses.addresses,
        [label, tokenAddress]
      ],
    },
  };
}
