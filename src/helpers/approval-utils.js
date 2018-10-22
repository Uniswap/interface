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

  const allowanceKey = drizzleCtx.contracts[currency].methods.allowance.cacheCall(account, inputExchange);

  if (!contractStore[currency]) {
    return false;
  }

  const allowance = contractStore[currency].allowance[allowanceKey];

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
  const approvals = BN(10 ** decimals).multipliedBy(BN(10 ** 8)).toFixed(0);
  return drizzleCtx.contracts[currency].methods
    .approve(inputExchange, web3.utils.toHex(approvals))
    .send({ from: account })
    // .then((e, d) => console.log(e, d));
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
