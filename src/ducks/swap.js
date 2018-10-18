const UPDATE_FIELD = 'app/swap/updateField';
const ADD_ERROR = 'app/swap/addError';
const REMOVE_ERROR = 'app/swap/removeError';

const initialState = {
  input: '',
  output: '',
  inputCurrency: '',
  outputCurrency: '',
  lastEditedField: '',
  inputErrors: [],
  outputErrors: [],
};

export const isValidSwap = (state) => {
  const { swap } = state;

  return swap.outputCurrency !== '' &&
    swap.inputCurrency !== '' &&
    swap.input !== '' &&
    swap.output !== '' &&
    swap.inputErrors.length === 0 &&
    swap.outputErrors.length === 0;
};

export const updateField = ({ name, value }) => ({
  type: UPDATE_FIELD,
  payload: { name, value },
});

export const addError = ({ name, value }) => ({
  type: ADD_ERROR,
  payload: { name, value },
});

export const removeError = ({ name, value }) => ({
  type: REMOVE_ERROR,
  payload: { name, value },
});

function reduceAddError(state, payload) {
  const { name, value } = payload;
  let nextErrors = state[name];
  if (nextErrors.indexOf(value) === -1) {
    nextErrors = [...nextErrors, value];
  }

  return {
    ...state,
    [name]: nextErrors,
  };
}

function reduceRemoveError(state, payload) {
  const { name, value } = payload;

  return {
    ...state,
    [name]: state[name].filter(error => error !== value),
  };
}

export default function swapReducer(state = initialState, { type, payload }) {
  switch (type) {
    case UPDATE_FIELD:
      return {
        ...state,
        [payload.name]: payload.value,
      };
    case ADD_ERROR:
      return reduceAddError(state, payload);
    case REMOVE_ERROR:
      return reduceRemoveError(state, payload);
    default:
      return state;
  }
}
