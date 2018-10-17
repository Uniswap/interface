import {BigNumber as BN} from "bignumber.js";
import promisify from "./web3-promisfy";

export const calculateExchangeRateFromInput = async opts => {
  const { inputCurrency, outputCurrency } = opts;

  if (!inputCurrency || !outputCurrency) {
    return;
  }

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

  return ERC20_TO_ERC20.calculateOutput(opts);

};

export const calculateExchangeRateFromOutput = async opts => {
  const { inputCurrency, outputCurrency } = opts;

  if (!inputCurrency || !outputCurrency) {
    return;
  }

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

  return ERC20_TO_ERC20.calculateInput(opts);
};

export const swapInput = async opts => {
  const { inputCurrency, outputCurrency } = opts;

  if (!inputCurrency || !outputCurrency) {
    return;
  }

  if (inputCurrency === outputCurrency) {
    console.error(`Input and Output currency cannot be the same`);
    return;
  }

  if (inputCurrency === 'ETH' && outputCurrency !== 'ETH') {
    return ETH_TO_ERC20.swapInput(opts);
  }

  if (outputCurrency === 'ETH' && inputCurrency !== 'ETH') {
    return ERC20_TO_ETH.swapInput(opts);
  }

  return ERC20_TO_ERC20.swapInput(opts);
};

export const swapOutput = async opts => {
  const { inputCurrency, outputCurrency } = opts;

  if (!inputCurrency || !outputCurrency) {
    return;
  }

  if (inputCurrency === outputCurrency) {
    console.error(`Input and Output currency cannot be the same`);
    return;
  }

  if (inputCurrency === 'ETH' && outputCurrency !== 'ETH') {
    return ETH_TO_ERC20.swapOutput(opts);
  }

  if (outputCurrency === 'ETH' && inputCurrency !== 'ETH') {
    return ERC20_TO_ETH.swapOutput(opts);
  }

  return ERC20_TO_ERC20.swapOutput(opts);
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
  swapInput: async ({drizzleCtx, contractStore, input, output, account, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (inputCurrency !== 'ETH') {
      console.error('Input Currency should be ETH');
      return;
    }

    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[outputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${outputCurrency}`);
      return;

    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.025);
    const outputDecimals = await getDecimals({ address: outputCurrency, contractStore, drizzleCtx });
    const minOutput = BN(output).multipliedBy(10 ** outputDecimals).multipliedBy(BN(1).minus(ALLOWED_SLIPPAGE));
    exchange.methods.ethToTokenSwapInput.cacheSend(minOutput.toFixed(0), deadline, {
      from: account,
      value: BN(input).multipliedBy(10 ** 18).toFixed(0),
    });
  },
  swapOutput: async ({drizzleCtx, contractStore, input, output, account, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (inputCurrency !== 'ETH') {
      console.error('Input Currency should be ETH');
      return;
    }

    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[outputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${outputCurrency}`);
      return;

    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.025);
    const outputDecimals = await getDecimals({ address: outputCurrency, contractStore, drizzleCtx });
    const outputAmount = BN(output).multipliedBy(BN(10 ** outputDecimals));
    const maxInput = BN(input).multipliedBy(10 ** 18).multipliedBy(BN(1).plus(ALLOWED_SLIPPAGE));
    exchange.methods.ethToTokenSwapOutput.cacheSend(outputAmount.toFixed(0), deadline, {
      from: account,
      value: maxInput.toFixed(0),
    });
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
  swapInput: async ({drizzleCtx, contractStore, input, output, account, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (outputCurrency !== 'ETH') {
      console.error('Output Currency should be ETH');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Input Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.025);
    const inputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const minOutput = BN(output).multipliedBy(10 ** 18).multipliedBy(BN(1).minus(ALLOWED_SLIPPAGE));
    const inputAmount = BN(input).multipliedBy(10 ** inputDecimals);

    exchange.methods.tokenToEthSwapInput.cacheSend(
      inputAmount.toFixed(0),
      minOutput.toFixed(0),
      deadline,
      { from: account, value: '0x0' },
    );
  },
  swapOutput: async ({drizzleCtx, contractStore, input, output, account, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (outputCurrency !== 'ETH') {
      console.error('Output Currency should be ETH');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.025);
    const inputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const maxInput = BN(input).multipliedBy(10 ** inputDecimals).multipliedBy(BN(1).plus(ALLOWED_SLIPPAGE));
    const outputAmount = BN(output).multipliedBy(10 ** 18);

    exchange.methods.tokenToEthSwapOutput.cacheSend(
      outputAmount.toFixed(0),
      maxInput.toFixed(0),
      deadline,
      { from: account },
    );
  },
};

const ERC20_TO_ERC20 = {
  calculateOutput: async opts => {
    const inputDecimals = await getDecimals({
      address: opts.inputCurrency,
      contractStore: opts.contractStore,
      drizzleCtx: opts.drizzleCtx
    });
    const inputAmountA = BN(opts.input).multipliedBy(BN(10 ** inputDecimals));
    const exchangeRateA = await ERC20_TO_ETH.calculateOutput({ ...opts, outputCurrency: 'ETH' });
    const inputAmountB = inputAmountA.multipliedBy(exchangeRateA);
    const exchangeRateB = await ETH_TO_ERC20.calculateOutput({
      ...opts,
      input: inputAmountB.dividedBy(BN(10 ** 18)),
      inputCurrency: 'ETH',
    });

    if (!exchangeRateA || !exchangeRateB) {
      return;
    }

    return exchangeRateA.multipliedBy(exchangeRateB);
  },
  calculateInput: async opts => {
    const outputDecimals = await getDecimals({
      address: opts.outputCurrency,
      contractStore: opts.contractStore,
      drizzleCtx: opts.drizzleCtx
    });
    const outputAmountA = BN(opts.output).multipliedBy(BN(10 ** outputDecimals))
    const exchangeRateA = await ETH_TO_ERC20.calculateInput({ ...opts, inputCurrency: 'ETH' });
    if (!exchangeRateA) {
      return;
    }

    const inputAmountB = outputAmountA.dividedBy(exchangeRateA).dividedBy(10 ** 18);
    const exchangeRateB = await ERC20_TO_ETH.calculateInput({
      ...opts,
      outputCurrency: 'ETH',
      output: inputAmountB,
    });

    if (!exchangeRateB) {
      return;
    }

    return exchangeRateA.multipliedBy(exchangeRateB);
  },
  swapInput: async ({drizzleCtx, contractStore, input, output, account, inputCurrency, outputCurrency, exchangeAddresses }) => {
    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Input Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.04);
    const inputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const outputDecimals = await getDecimals({ address: outputCurrency, contractStore, drizzleCtx });
    const inputAmount = BN(input).multipliedBy(BN(10 ** inputDecimals));
    const outputAmount = BN(input).multipliedBy(BN(10 ** outputDecimals));

    const tokenAddress = outputCurrency;
    const tokensSold = inputAmount.toFixed(0);
    const minTokensBought = outputAmount.multipliedBy(BN(1).plus(ALLOWED_SLIPPAGE)).toFixed(0);
    const minEthBought = 1;

    exchange.methods.tokenToTokenSwapInput.cacheSend(
      tokensSold,
      minTokensBought,
      minEthBought,
      deadline,
      tokenAddress,
      { from: account },
    );
  },
  swapOutput: async opts => {
    const {
      drizzleCtx,
      contractStore,
      input,
      output,
      account,
      inputCurrency,
      outputCurrency,
      exchangeAddresses
    } = opts;
    const exchangeRateA = await ETH_TO_ERC20.calculateInput({ ...opts, inputCurrency: 'ETH' });
    if (!exchangeRateA) {
      return;
    }

    if (!outputCurrency || outputCurrency === 'ETH') {
      console.error('Output Currency should be ERC20');
      return;
    }

    if (!inputCurrency || inputCurrency === 'ETH') {
      console.error('Input Currency should be ERC20');
      return;
    }

    const exchangeAddress = exchangeAddresses.fromToken[inputCurrency];
    const exchange = drizzleCtx.contracts[exchangeAddress];
    if (!exchangeAddress || !exchange) {
      console.error(`Cannot find Exchange Address for ${inputCurrency}`);
      return;
    }

    const { web3 } = drizzleCtx;
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);


    const deadline = block.timestamp + 300;
    const ALLOWED_SLIPPAGE = BN(0.04);
    const inputDecimals = await getDecimals({ address: inputCurrency, contractStore, drizzleCtx });
    const outputDecimals = await getDecimals({ address: outputCurrency, contractStore, drizzleCtx });
    const inputAmount = BN(input).multipliedBy(BN(10 ** inputDecimals));
    const outputAmount = BN(output).multipliedBy(BN(10 ** outputDecimals));
    const inputAmountB = BN(output).dividedBy(exchangeRateA).multipliedBy(BN(10 ** 18));

    const tokenAddress = outputCurrency;
    const tokensBought = outputAmount.toFixed(0);
    const maxTokensSold = inputAmount.multipliedBy(BN(1).plus(ALLOWED_SLIPPAGE)).toFixed(0);
    const maxEthSold = inputAmountB.multipliedBy(1.2).toFixed(0);

    exchange.methods.tokenToTokenSwapOutput.cacheSend(
      tokensBought,
      maxTokensSold,
      maxEthSold,
      deadline,
      tokenAddress,
      { from: account },
    );
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

const BALANCE_KEY = {};

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
