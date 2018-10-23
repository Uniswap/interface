const UPDATE_FIELD = 'app/send/updateField';
const ADD_ERROR = 'app/send/addError';
const REMOVE_ERROR = 'app/send/removeError';
const RESET_SEND = 'app/send/resetSend';

const getInitialState = () => {
  return {
    input: '',
    output: '',
    inputCurrency: '',
    outputCurrency: '',
    recipient: '',
    lastEditedField: '',
    inputErrors: [],
    outputErrors: [],
  };
};

export const isValidSend = (state) => {
  const { send } = state;

  return send.outputCurrency !== '' &&
    send.inputCurrency !== '' &&
    send.input !== '' &&
    send.output !== '' &&
    send.recipient !== '' &&
    send.inputErrors.length === 0 &&
    send.outputErrors.length === 0;
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

export const resetSend = () => ({
  type: RESET_SEND,
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

export default function sendReducer(state = getInitialState(), { type, payload }) {
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
    case RESET_SEND:
      return getInitialState();
    default:
      return state;
  }
}
