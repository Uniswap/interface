export const SAMPLE_ERROR_MESSAGE = 'An error occurred';
export const USER_DENIED_REQUEST_ERROR_CODE = 4001;
// This might happen in different situations
export const GENERIC_ERROR_CODE = -32603;
export const GENERIC_ERROR_CODE_2 = -320000;
export const getInsufficientFundTransactionError = (address: string) => ({
  code: GENERIC_ERROR_CODE_2,
  message: `err: insufficient funds for gas * price + value: address ${address} have 2000 want 10000000000000000000000000 (supplied gas 14995852)`,
});
export const getInsufficientFundGasEstimateError = (address: string) => ({
  code: GENERIC_ERROR_CODE,
  message: 'Internal JSON-RPC error.',
  data: {
    code: GENERIC_ERROR_CODE_2,
    message: `insufficient funds for transfer: address ${address}`,
  },
});
export const userDeniedTransactionError = {
  code: USER_DENIED_REQUEST_ERROR_CODE,
  message: 'MetaMask Tx Signature: User denied transaction signature.',
  stack:
    '{\n  "code": 4001,\n  "message": "MetaMask Tx Signature: User denied transaction signature.",\n  "stack": "Error: MetaMask Tx Signature: User denied transaction signature.\\n...',
};