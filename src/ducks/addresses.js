const TESTNET = {
    "tokenAddresses": {
        "addresses": [
            [
                "YUAN",
                "0xc4c97929301eb30ff5c9c3150bbbe553768ffbbe"
            ],
            [
                "TIM",
                "0x0aafb9299daafc32a051086e92847fab1ef85b50"
            ]
        ]
    },
    "exchangeAddresses": {
        "addresses": [
            [
                "YUAN",
                "0xaf1a51fdca46190e7703b6cf97470efc92ec6498"
            ],
            [
                "TIM",
                "0x33eda5a874732ee81a0364611d81fd34faf6eccf"
            ]
        ],
        "fromToken": {
            "0xc4c97929301eb30ff5c9c3150bbbe553768ffbbe": "0xaf1a51fdca46190e7703b6cf97470efc92ec6498",
            "0x0aafb9299daafc32a051086e92847fab1ef85b50": "0x33eda5a874732ee81a0364611d81fd34faf6eccf"
        }
    },
    "factoryAddress": "0x7753d7fb5d93ff9af0cffcd578f7c3bbc3d303ba"
};

const MAIN = {
  "tokenAddresses": {
    "addresses": []
  },
  "exchangeAddresses": {
    "addresses": [],
    "fromToken": {}
  },
  "factoryAddress": ""
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
    // CyberMiles Main Net
    case 18:
    case '18':
      return {
        type: SET_ADDRESSES,
        payload: MAIN,
      };
    // CyberMiles Test Net
    case 19:
    case '19':
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
