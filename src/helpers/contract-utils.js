export function getDecimals({ address, drizzleCtx, contractStore }) {
  return new Promise(async (resolve, reject) => {
    if (address === 'ETH') {
      resolve('18');
      return;
    }

    const decimalsKey = drizzleCtx.contracts[address].methods.decimals.cacheCall();
    const decimals = contractStore[address].decimals[decimalsKey];
    resolve(decimals && decimals.value);
  });
}

const BALANCE_KEY = {};

export function getBalance({ currency, address, drizzleCtx, contractStore }) {
  return new Promise(async (resolve, reject) => {
    if (currency === 'ETH') {
      drizzleCtx.web3.eth.getBalance(address, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    } else {
      const token = drizzleCtx.contracts[currency];
      if (!token) {
        return;
      }

      let balanceKey = BALANCE_KEY[address];

      if (!balanceKey) {
        balanceKey = token.methods.balanceOf.cacheCall(address);
        BALANCE_KEY[address] = balanceKey;
      }

      const tokenStore = contractStore[currency];

      if (!tokenStore) {
        reject(new Error(`Cannot find ${currency} in contract store`));
        return;
      }

      let balance = tokenStore.balanceOf[balanceKey];
      resolve(balance && balance.value);
    }
  });
}

export const getTxStatus = opts => {
  const {
    drizzleCtx,
    txId
  } = opts;
  const st = drizzleCtx.store.getState();
  const tx = st.transactionStack[txId];
  const status = st.transactions[tx] && st.transactions[tx].status;
  return status;
};
