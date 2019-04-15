const ADD_APPROVAL_TX = 'app/send/addApprovalTx'

const getInitialState = () => {
  return {
    approvals: {}
  }
}

export const addApprovalTx = ({ tokenAddress, txId }) => ({
  type: ADD_APPROVAL_TX,
  payload: { tokenAddress, txId }
})

export default function sendReducer(state = getInitialState(), { type, payload }) {
  switch (type) {
    case ADD_APPROVAL_TX:
      return {
        approvals: {
          ...state.approvals,
          [payload.tokenAddress]: payload.txId
        }
      }
    default:
      return state
  }
}
