const UPDATE_FIELD = 'app/swap/updateField';

const initialState = {
  input: '',
  output: '',
  inputCurrency: '',
  outputCurrency: '',
  lastEditedField: '',
};

export const isValidSwap = (state) => {
  const { swap } = state;

  return swap.outputCurrency !== '' &&
    swap.inputCurrency !== '' &&
    swap.input !== '' &&
    swap.output !== '';
};

export const updateField = ({ name, value }) => ({
  type: UPDATE_FIELD,
  payload: { name, value },
})

export default function swapReducer(state = initialState, { type, payload }) {
  switch (type) {
    case UPDATE_FIELD:
      return {
        ...state,
        [payload.name]: payload.value,
      };
    default:
      return state;
  }
}
