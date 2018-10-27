const RINKEBY = {
  factoryAddress: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36',
  exchangeAddresses: {
    addresses: [
      ['BAT','0x9B913956036a3462330B0642B20D3879ce68b450'],
      ['DAI','0x77dB9C915809e7BE439D2AB21032B1b8B58F6891'],
      ['MKR','0x93bB63aFe1E0180d0eF100D774B473034fd60C36'],
      ['OMG','0x26C226EBb6104676E593F8A070aD6f25cDa60F8D'],
      // ['ZRX','0xaBD44a1D1b9Fb0F39fE1D1ee6b1e2a14916D067D'],
    ],
    fromToken: {
      '0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B': '0x9B913956036a3462330B0642B20D3879ce68b450',
      '0x2448eE2641d78CC42D7AD76498917359D961A783': '0x77dB9C915809e7BE439D2AB21032B1b8B58F6891',
      '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85': '0x93bB63aFe1E0180d0eF100D774B473034fd60C36',
      '0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0': '0x26C226EBb6104676E593F8A070aD6f25cDa60F8D',
      // '0xF22e3F33768354c9805d046af3C0926f27741B43': '0xaBD44a1D1b9Fb0F39fE1D1ee6b1e2a14916D067D',
    },
  },
  tokenAddresses: {
    addresses: [
      ['BAT','0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B'],
      ['DAI','0x2448eE2641d78CC42D7AD76498917359D961A783'],
      ['MKR','0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85'],
      ['OMG','0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0'],
      // ['ZRX','0xF22e3F33768354c9805d046af3C0926f27741B43'],
    ],
  },
};

const MAIN = {
  factoryAddress: '0xbe87b46515ab488713daA155D92abbd0E5964F6A',
  exchangeAddresses: {
    addresses: [
      ['BAT', '0x31684EB08E0d86AE970F4C2f9110afBce9C4C984'],
      ['DAI', '0xB23601D1E65002fA3173A0982b8E4AD5B46C7863'],
      ['MKR', '0x405f6187BeE030B1DF486968C673907F0fd58BE1'],
      ['ANT', '0x264B884Df87fBB97997994181d054e8657eB5c78'],
      ['REP', '0x997C2c6b08E33313C5512Fd3C6eF235BF0139Ca3'],
      ['ZRX', '0xE9674e73887bDCCd8fd46861a4f5b1E6485789BE'],
      ['SNT', '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'],
    ],
    fromToken: {
      '0x0D8775F648430679A709E98d2b0Cb6250d2887EF': '0x31684EB08E0d86AE970F4C2f9110afBce9C4C984',
      '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359': '0xB23601D1E65002fA3173A0982b8E4AD5B46C7863',
      '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2': '0x405f6187BeE030B1DF486968C673907F0fd58BE1',
      '0x960b236A07cf122663c4303350609A66A7B288C0': '0x264B884Df87fBB97997994181d054e8657eB5c78',
      '0x1985365e9f78359a9B6AD760e32412f4a445E862': '0x997C2c6b08E33313C5512Fd3C6eF235BF0139Ca3',
      '0xE41d2489571d322189246DaFA5ebDe1F4699F498': '0xE9674e73887bDCCd8fd46861a4f5b1E6485789BE',
      '0x744d70FDBE2Ba4CF95131626614a1763DF805B9E': '0x63d4b39137dF65ebEad4E15456c291284fCB537C',
    },
  },
  tokenAddresses: {
    addresses: [
      ['BAT', '0x0D8775F648430679A709E98d2b0Cb6250d2887EF'],
      ['DAI', '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'],
      ['MKR', '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'],
      ['ANT', '0x960b236A07cf122663c4303350609A66A7B288C0'],
      ['REP', '0x1985365e9f78359a9B6AD760e32412f4a445E862'],
      ['ZRX', '0xE41d2489571d322189246DaFA5ebDe1F4699F498'],
      ['SNT', '0x744d70FDBE2Ba4CF95131626614a1763DF805B9E'],
    ],
  },
};

const SET_ADDRESSES = 'app/addresses/setAddresses';
const ADD_EXCHANGE = 'app/addresses/addExchange';

const initialState = RINKEBY;

export const addExchange = ({label, exchangeAddress, tokenAddress}) => ({
  type: ADD_EXCHANGE,
  payload: {
    label,
    exchangeAddress,
    tokenAddress,
  },
});

export const setAddresses = networkId => {
  switch(networkId) {
    // Main Net
    case 1:
    case '1':
      return {
        type: SET_ADDRESSES,
        payload: MAIN,
      };
    // Rinkeby
    case 4:
    case '4':
      return {
        type: SET_ADDRESSES,
        payload: RINKEBY,
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
        [label,exchangeAddress]
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
