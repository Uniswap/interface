import {BigNumber as BN} from "bignumber.js";
import { getDecimals } from './contract-utils';

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

export const approveExchange = async opts => {
  const {
    currency,
    contractStore,
    drizzleCtx,
    account,
    exchangeAddresses,
  } = opts;
  const { web3 } = drizzleCtx;
  const inputExchange = exchangeAddresses.fromToken[currency];
  if (!inputExchange) {
    return;
  }

  const decimals = await getDecimals({ address: currency, drizzleCtx, contractStore });

  return drizzleCtx.contracts[inputExchange].methods.approve.cacheSend(
    inputExchange,
    web3.utils.toHex(decimals*10**18),
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
