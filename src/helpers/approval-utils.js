import {BigNumber as BN} from "bignumber.js";

export const isExchangeUnapproved = opts => {
  const {
    value,
    currency,
    drizzleCtx,
    account,
    contractStore,
    exchangeAddresses,
  } = opts;
  if (!currency || currency === 'ETH') {
    return false;
  }
  const inputExchange = exchangeAddresses.fromToken[currency];
  if (!inputExchange) {
    return false;
  }

  const allowanceKey = drizzleCtx.contracts[inputExchange].methods.allowance.cacheCall(account, inputExchange);
  const allowance = contractStore[inputExchange].allowance[allowanceKey];
  if (!allowance) {
    return false;
  }

  return BN(value).isGreaterThan(BN(allowance.value));
};

export const approveExchange = opts => {
  const {
    currency,
    drizzleCtx,
    account,
    exchangeAddresses,
  } = opts;
  const inputExchange = exchangeAddresses.fromToken[currency];
  console.log(inputExchange);
  if (!inputExchange) {
    return;
  }

  return drizzleCtx.contracts[inputExchange].methods.approve.cacheSend(
    inputExchange,
    300, // TODO: what is this number?
    { from: account }
  );
};

export const getApprovalTxStatus = opts => {
  const {
    drizzleCtx,
    txId
  } = opts;
  const st = drizzleCtx.store.getState();
  const tx = st.transactionStack[txId];
  const status = st.transactions[tx] && st.transactions[tx].status;
  return status;
};
