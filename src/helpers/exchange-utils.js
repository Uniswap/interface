import EXCHANGE_ABI from "../abi/exchange";
import {BigNumber as BN} from "bignumber.js";

export const calculateExchangeRate = async ({drizzleCtx, contractStore, input, inputCurrency, outputCurrency, exchangeAddresses }) => {
  if (!inputCurrency || !outputCurrency || !input) {
    return 0;
  }

  if (inputCurrency === outputCurrency) {
    console.error(`Input and Output currency cannot be the same`);
    return 0;
  }

  const currencies = [ inputCurrency, outputCurrency ];
  const exchangeAddress = exchangeAddresses.fromToken[currencies.filter(d => d !== 'ETH')[0]];

  if (!exchangeAddress) {
    return 0;
  }

  if (currencies.includes('ETH')) {
    const inputReserve = await getBalance({
      currency: inputCurrency,
      address: exchangeAddress,
      drizzleCtx,
      contractStore,
    });

    const outputReserve = await getBalance({
      currency: outputCurrency,
      address: exchangeAddress,
      drizzleCtx,
      contractStore,
    });

    const inputDecimals = await getDecimals({ address: inputCurrency, drizzleCtx, contractStore });
    const outputDecimals = await getDecimals({ address: outputCurrency, drizzleCtx, contractStore });
    const inputAmount = BN(input).multipliedBy(BN(10 ** inputDecimals));
    const numerator = inputAmount.multipliedBy(BN(outputReserve).multipliedBy(997));
    const denominator = BN(inputReserve).multipliedBy(1000).plus(BN(inputAmount).multipliedBy(997));
    const outputAmount = numerator.dividedBy(denominator);
    const exchangeRate = outputAmount.dividedBy(inputAmount);

    if (exchangeRate.isNaN()) {
      return 0;
    }

    return exchangeRate.toFixed(7);
  } else {
    return 0;
  }
};

function getDecimals({ address, drizzleCtx, contractStore }) {
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

function getBalance({ currency, address, drizzleCtx, contractStore }) {
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
      const balanceKey = token.methods.balanceOf.cacheCall(address);
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
