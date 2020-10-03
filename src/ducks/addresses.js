const TESTNET = {
    "tokenAddresses": {
        "addresses": [
            [
                "ENGL",
                "0x7743fb03Fb248c2ef473e9f6985d12D6db953C79"
            ],
            [
                "CLIM",
                "0x685FE8Cb568C76714e57CaB27790e0f77c264C46"
            ]
        ]
    },
    "exchangeAddresses": {
        "addresses": [
            [
                "ENGL",
                "0x5AeC86734172C5C257Eb2a86e705EF375207c5c8"
            ],
            [
                "CLIM",
                "0x92570E6E10fa2196952B039c4A59b5e617Eb9A50"
            ]
        ],
        "fromToken": {
            "0x7743fb03Fb248c2ef473e9f6985d12D6db953C79": "0x5AeC86734172C5C257Eb2a86e705EF375207c5c8",
            "0x685FE8Cb568C76714e57CaB27790e0f77c264C46": "0x92570E6E10fa2196952B039c4A59b5e617Eb9A50"
        }
    },
    "factoryAddress": "0xa80171aB64F9913C5d0Df5b06D00030B4febDD6A"
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
    // Oasis MAIN Net
    case 70:
    case '70':
      return {
        type: SET_ADDRESSES,
        payload: MAIN,
      };
    // OASIS TEST Net
    case 69:
    case '69':
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
