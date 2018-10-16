import {BigNumber as BN} from "bignumber.js";

export const calculateExchangeRateFromInput = async opts => {
  const { inputCurrency, outputCurrency } = opts;
  if (inputCurrency === outputCurrency) {
    console.error(`Input and Output currency cannot be the same`);
    return;
  }

  if (inputCurrency === 'ETH' && outputCurrency !== 'ETH') {
    return ETH_TO_ERC20.calculateOutput(opts);
  }

  if (outputCurrency === 'ETH' && inputCurrency !== 'ETH') {
    return ERC20_TO_ETH.calculateOutput(opts);
  }
};

export const calculateExchangeRateFromOutput = async opts => {
  const { inputCurrency, outputCurrency } = opts;
  if (inputCurrency === outputCurrency) {
    console.error(`Input and Output currency cannot be the same`);
    return;
  }

  if (inputCurrency === 'ETH' && outputCurrency !== 'ETH') {
    return ETH_TO_ERC20.calculateInput(opts);
  }

  if (outputCurrency === 'ETH' && inputCurrency !== 'ETH') {
    return ERC20_TO_ETH.calculateInput(opts);
  }
};

const ETH_TO_ERC20 = {
  calculateOutput: async ({drizzleCtx, contractStore, input, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (inputCurrency !== 'ETH') {
      console.error('Input Currency should be ETH');
      return;
    }

    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[outputCurrency];

    if (!exchangeAddress) {
      console.error(`Cannot find Exchange Address for ${outputCurrency}`);
      return;
    }

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

    const inputAmount = BN(input).multipliedBy(BN(10 ** 18));
    const numerator = inputAmount.multipliedBy(BN(outputReserve).multipliedBy(997));
    const denominator = BN(inputReserve).multipliedBy(1000).plus(BN(inputAmount).multipliedBy(997));
    const outputAmount = numerator.dividedBy(denominator);
    const exchangeRate = outputAmount.dividedBy(inputAmount);

    if (exchangeRate.isNaN()) {
      return;
    }

    return exchangeRate;
  },
  calculateInput: async ({drizzleCtx, contractStore, output, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (inputCurrency !== 'ETH') {
      console.error('Input Currency should be ETH');
      return;
    }

    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[outputCurrency];

    if (!exchangeAddress) {
      console.error(`Cannot find Exchange Address for ${outputCurrency}`);
      return;
    }

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

    const outputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const outputAmount = BN(output).multipliedBy(10 ** outputDecimals);
    const numerator = outputAmount .multipliedBy(BN(inputReserve).multipliedBy(1000));
    const denominator = BN(outputReserve).minus(outputAmount).multipliedBy(997);
    const inputAmount = numerator.dividedBy(denominator.plus(1));
    const exchangeRate = outputAmount.dividedBy(inputAmount);

    if (exchangeRate.isNaN()) {
      return;
    }

    return exchangeRate;
  },
};

const ERC20_TO_ETH = {
  calculateOutput: async ({drizzleCtx, contractStore, input, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (outputCurrency !== 'ETH') {
      console.error('Output Currency should be ETH');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Input Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];

    if (!exchangeAddress) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

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

    const inputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const inputAmount = BN(input).multipliedBy(BN(10 ** inputDecimals));
    const numerator = inputAmount.multipliedBy(BN(outputReserve).multipliedBy(997));
    const denominator = BN(inputReserve).multipliedBy(1000).plus(BN(inputAmount).multipliedBy(997));
    const outputAmount = numerator.dividedBy(denominator);
    const exchangeRate = outputAmount.dividedBy(inputAmount);

    if (exchangeRate.isNaN()) {
      return;
    }

    return exchangeRate;
  },
  calculateInput: async ({drizzleCtx, contractStore, output, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (outputCurrency !== 'ETH') {
      console.error('Output Currency should be ETH');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];

    if (!exchangeAddress) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

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

    // const outputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const outputAmount = BN(output).multipliedBy(10 ** 18);
    const numerator = outputAmount .multipliedBy(BN(inputReserve).multipliedBy(1000));
    const denominator = BN(outputReserve).minus(outputAmount).multipliedBy(997);
    const inputAmount = numerator.dividedBy(denominator.plus(1));
    const exchangeRate = outputAmount.dividedBy(inputAmount);

    if (exchangeRate.isNaN()) {
      return;
    }

    return exchangeRate;
  },
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
