import { BigNumber } from '@ethersproject/bignumber';
import { Protocol } from '@teleswap/router-sdk';
import { Pair } from '@teleswap/v2-sdk/dist/entities';
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core';
import { FeeAmount, MethodParameters, Pool } from '@uniswap/v3-sdk';
import _ from 'lodash';

import { IV2PoolProvider } from '../providers';
import {
  ArbitrumGasData,
  OptimismGasData,
} from '../providers/v3/gas-data-provider';
import { IV3PoolProvider } from '../providers/v3/pool-provider';
import {
  MixedRouteWithValidQuote,
  SwapRoute,
  usdGasTokensByChain,
  V2RouteWithValidQuote,
  V3RouteWithValidQuote,
} from '../routers';
import { ChainId, log, WRAPPED_NATIVE_CURRENCY } from '../util';

import { buildTrade } from './methodParameters';

export async function getV2NativePool(
  token: Token,
  poolProvider: IV2PoolProvider
): Promise<Pair | null> {
  const chainId = token.chainId as ChainId;
  const weth = WRAPPED_NATIVE_CURRENCY[chainId]!;

  // TODO: debug joy, fix
  const poolAccessor = await poolProvider.getPools([[weth, token, false]]);
  const pool = poolAccessor.getPool(weth, token, false);

  if (!pool || pool.reserve0.equalTo(0) || pool.reserve1.equalTo(0)) {
    log.error(
      {
        weth,
        token,
        reserve0: pool?.reserve0.toExact(),
        reserve1: pool?.reserve1.toExact(),
      },
      `Could not find a valid WETH pool with ${token.symbol} for computing gas costs.`
    );

    return null;
  }

  return pool;
}

export async function getHighestLiquidityV3NativePool(
  token: Token,
  poolProvider: IV3PoolProvider
): Promise<Pool | null> {
  const nativeCurrency = WRAPPED_NATIVE_CURRENCY[token.chainId as ChainId]!;

  const nativePools = _([FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW])
    .map<[Token, Token, FeeAmount]>((feeAmount) => {
      return [nativeCurrency, token, feeAmount];
    })
    .value();

  const poolAccessor = await poolProvider.getPools(nativePools);

  const pools = _([FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW])
    .map((feeAmount) => {
      return poolAccessor.getPool(nativeCurrency, token, feeAmount);
    })
    .compact()
    .value();

  if (pools.length == 0) {
    log.error(
      { pools },
      `Could not find a ${nativeCurrency.symbol} pool with ${token.symbol} for computing gas costs.`
    );

    return null;
  }

  const maxPool = _.maxBy(pools, (pool) => pool.liquidity) as Pool;

  return maxPool;
}

export async function getHighestLiquidityV3USDPool(
  chainId: ChainId,
  poolProvider: IV3PoolProvider
): Promise<Pool> {
  const usdTokens = usdGasTokensByChain[chainId];
  const wrappedCurrency = WRAPPED_NATIVE_CURRENCY[chainId]!;

  if (!usdTokens) {
    throw new Error(
      `Could not find a USD token for computing gas costs on ${chainId}`
    );
  }

  const usdPools = _([
    FeeAmount.HIGH,
    FeeAmount.MEDIUM,
    FeeAmount.LOW,
    FeeAmount.LOWEST,
  ])
    .flatMap((feeAmount) => {
      return _.map<Token, [Token, Token, FeeAmount]>(usdTokens, (usdToken) => [
        wrappedCurrency,
        usdToken,
        feeAmount,
      ]);
    })
    .value();

  const poolAccessor = await poolProvider.getPools(usdPools);

  const pools = _([
    FeeAmount.HIGH,
    FeeAmount.MEDIUM,
    FeeAmount.LOW,
    FeeAmount.LOWEST,
  ])
    .flatMap((feeAmount) => {
      const pools = [];

      for (const usdToken of usdTokens) {
        const pool = poolAccessor.getPool(wrappedCurrency, usdToken, feeAmount);
        if (pool) {
          pools.push(pool);
        }
      }

      return pools;
    })
    .compact()
    .value();

  if (pools.length == 0) {
    const message = `Could not find a USD/${wrappedCurrency.symbol} pool for computing gas costs.`;
    log.error({ pools }, message);
    throw new Error(message);
  }

  const maxPool = _.maxBy(pools, (pool) => pool.liquidity) as Pool;

  return maxPool;
}

export function getGasCostInUSD(
  usdPool: Pool,
  costNativeCurrency: CurrencyAmount<Token>
) {
  const nativeCurrency = costNativeCurrency.currency;
  // convert fee into usd
  const nativeTokenPrice =
    usdPool.token0.address == nativeCurrency.address
      ? usdPool.token0Price
      : usdPool.token1Price;

  const gasCostUSD = nativeTokenPrice.quote(costNativeCurrency);
  return gasCostUSD;
}

export function getGasCostInNativeCurrency(
  nativeCurrency: Token,
  gasCostInWei: BigNumber
) {
  // wrap fee to native currency
  const costNativeCurrency = CurrencyAmount.fromRawAmount(
    nativeCurrency,
    gasCostInWei.toString()
  );
  return costNativeCurrency;
}

export async function getGasCostInQuoteToken(
  quoteToken: Token,
  nativePool: Pool | Pair,
  costNativeCurrency: CurrencyAmount<Token>
) {
  const nativeTokenPrice =
    nativePool.token0.address == quoteToken.address
      ? nativePool.token1Price
      : nativePool.token0Price;
  const gasCostQuoteToken = nativeTokenPrice.quote(costNativeCurrency);
  return gasCostQuoteToken;
}

export function calculateArbitrumToL1FeeFromCalldata(
  calldata: string,
  gasData: ArbitrumGasData
): [BigNumber, BigNumber] {
  const { perL2TxFee, perL1CalldataFee } = gasData;
  // calculates gas amounts based on bytes of calldata, use 0 as overhead.
  const l1GasUsed = getL2ToL1GasUsed(calldata, BigNumber.from(0));
  // multiply by the fee per calldata and add the flat l2 fee
  let l1Fee = l1GasUsed.mul(perL1CalldataFee);
  l1Fee = l1Fee.add(perL2TxFee);
  return [l1GasUsed, l1Fee];
}

export function calculateOptimismToL1FeeFromCalldata(
  calldata: string,
  gasData: OptimismGasData
): [BigNumber, BigNumber] {
  const { l1BaseFee, scalar, decimals, overhead } = gasData;

  const l1GasUsed = getL2ToL1GasUsed(calldata, overhead);
  // l1BaseFee is L1 Gas Price on etherscan
  const l1Fee = l1GasUsed.mul(l1BaseFee);
  const unscaled = l1Fee.mul(scalar);
  // scaled = unscaled / (10 ** decimals)
  const scaledConversion = BigNumber.from(10).pow(decimals);
  const scaled = unscaled.div(scaledConversion);
  return [l1GasUsed, scaled];
}

// based on the code from the optimism OVM_GasPriceOracle contract
export function getL2ToL1GasUsed(data: string, overhead: BigNumber): BigNumber {
  // data is hex encoded
  const dataArr: string[] = data.slice(2).match(/.{1,2}/g)!;
  const numBytes = dataArr.length;
  let count = 0;
  for (let i = 0; i < numBytes; i += 1) {
    const byte = parseInt(dataArr[i]!, 16);
    if (byte == 0) {
      count += 4;
    } else {
      count += 16;
    }
  }
  const unsigned = overhead.add(count);
  const signedConversion = 68 * 16;
  return unsigned.add(signedConversion);
}

export async function calculateGasUsed(
  chainId: ChainId,
  route: SwapRoute,
  simulatedGasUsed: BigNumber,
  v2PoolProvider: IV2PoolProvider,
  v3PoolProvider: IV3PoolProvider,
  l2GasData?: ArbitrumGasData | OptimismGasData
) {
  const quoteToken = route.quote.currency.wrapped;
  const gasPriceWei = route.gasPriceWei;
  // calculate L2 to L1 security fee if relevant
  let l2toL1FeeInWei = BigNumber.from(0);
  if ([ChainId.ARBITRUM_ONE, ChainId.ARBITRUM_RINKEBY].includes(chainId)) {
    l2toL1FeeInWei = calculateArbitrumToL1FeeFromCalldata(
      route.methodParameters!.calldata,
      l2GasData as ArbitrumGasData
    )[1];
  } else if ([ChainId.OPTIMISM, ChainId.OPTIMISTIC_KOVAN].includes(chainId)) {
    l2toL1FeeInWei = calculateOptimismToL1FeeFromCalldata(
      route.methodParameters!.calldata,
      l2GasData as OptimismGasData
    )[1];
  }

  // add l2 to l1 fee and wrap fee to native currency
  const gasCostInWei = gasPriceWei.mul(simulatedGasUsed).add(l2toL1FeeInWei);
  const nativeCurrency = WRAPPED_NATIVE_CURRENCY[chainId];
  const costNativeCurrency = getGasCostInNativeCurrency(
    nativeCurrency,
    gasCostInWei
  );

  const usdPool: Pool = await getHighestLiquidityV3USDPool(
    chainId,
    v3PoolProvider
  );

  const gasCostUSD = await getGasCostInUSD(usdPool, costNativeCurrency);

  let gasCostQuoteToken = costNativeCurrency;
  // get fee in terms of quote token
  if (!quoteToken.equals(nativeCurrency)) {
    const nativePools = await Promise.all([
      getHighestLiquidityV3NativePool(quoteToken, v3PoolProvider),
      getV2NativePool(quoteToken, v2PoolProvider),
    ]);
    const nativePool = nativePools.find((pool) => pool !== null);

    if (!nativePool) {
      log.info(
        'Could not find any V2 or V3 pools to convert the cost into the quote token'
      );
      gasCostQuoteToken = CurrencyAmount.fromRawAmount(quoteToken, 0);
    } else {
      gasCostQuoteToken = await getGasCostInQuoteToken(
        quoteToken,
        nativePool,
        costNativeCurrency
      );
    }
  }

  // Adjust quote for gas fees
  let quoteGasAdjusted;
  if (route.trade.tradeType == TradeType.EXACT_OUTPUT) {
    // Exact output - need more of tokenIn to get the desired amount of tokenOut
    quoteGasAdjusted = route.quote.add(gasCostQuoteToken);
  } else {
    // Exact input - can get less of tokenOut due to fees
    quoteGasAdjusted = route.quote.subtract(gasCostQuoteToken);
  }

  return {
    estimatedGasUsedUSD: gasCostUSD,
    estimatedGasUsedQuoteToken: gasCostQuoteToken,
    quoteGasAdjusted: quoteGasAdjusted,
  };
}

export function initSwapRouteFromExisting(
  swapRoute: SwapRoute,
  v2PoolProvider: IV2PoolProvider,
  v3PoolProvider: IV3PoolProvider,
  quoteGasAdjusted: CurrencyAmount<Currency>,
  estimatedGasUsed: BigNumber,
  estimatedGasUsedQuoteToken: CurrencyAmount<Currency>,
  estimatedGasUsedUSD: CurrencyAmount<Currency>
) {
  const currencyIn = swapRoute.trade.inputAmount.currency;
  const currencyOut = swapRoute.trade.outputAmount.currency;
  const tradeType = swapRoute.trade.tradeType.valueOf()
    ? TradeType.EXACT_OUTPUT
    : TradeType.EXACT_INPUT;
  const routesWithValidQuote = swapRoute.route.map((route) => {
    switch (route.protocol) {
      case Protocol.V3:
        return new V3RouteWithValidQuote({
          amount: CurrencyAmount.fromFractionalAmount(
            route.amount.currency,
            route.amount.numerator,
            route.amount.denominator
          ),
          rawQuote: BigNumber.from(route.rawQuote),
          sqrtPriceX96AfterList: route.sqrtPriceX96AfterList.map((num) =>
            BigNumber.from(num)
          ),
          initializedTicksCrossedList: [...route.initializedTicksCrossedList],
          quoterGasEstimate: BigNumber.from(route.gasEstimate),
          percent: route.percent,
          route: route.route,
          gasModel: route.gasModel,
          quoteToken: new Token(
            currencyIn.chainId,
            route.quoteToken.address,
            route.quoteToken.decimals,
            route.quoteToken.symbol,
            route.quoteToken.name
          ),
          tradeType: tradeType,
          v3PoolProvider: v3PoolProvider,
        });
      case Protocol.V2:
        return new V2RouteWithValidQuote({
          amount: CurrencyAmount.fromFractionalAmount(
            route.amount.currency,
            route.amount.numerator,
            route.amount.denominator
          ),
          rawQuote: BigNumber.from(route.rawQuote),
          percent: route.percent,
          route: route.route,
          gasModel: route.gasModel,
          quoteToken: new Token(
            currencyIn.chainId,
            route.quoteToken.address,
            route.quoteToken.decimals,
            route.quoteToken.symbol,
            route.quoteToken.name
          ),
          tradeType: tradeType,
          v2PoolProvider: v2PoolProvider,
        });
      case Protocol.MIXED:
        return new MixedRouteWithValidQuote({
          amount: CurrencyAmount.fromFractionalAmount(
            route.amount.currency,
            route.amount.numerator,
            route.amount.denominator
          ),
          rawQuote: BigNumber.from(route.rawQuote),
          sqrtPriceX96AfterList: route.sqrtPriceX96AfterList.map((num) =>
            BigNumber.from(num)
          ),
          initializedTicksCrossedList: [...route.initializedTicksCrossedList],
          quoterGasEstimate: BigNumber.from(route.gasEstimate),
          percent: route.percent,
          route: route.route,
          mixedRouteGasModel: route.gasModel,
          v2PoolProvider,
          quoteToken: new Token(
            currencyIn.chainId,
            route.quoteToken.address,
            route.quoteToken.decimals,
            route.quoteToken.symbol,
            route.quoteToken.name
          ),
          tradeType: tradeType,
          v3PoolProvider: v3PoolProvider,
        });
    }
  });
  const trade = buildTrade<typeof tradeType>(
    currencyIn,
    currencyOut,
    tradeType,
    routesWithValidQuote
  );
  return {
    quote: swapRoute.quote,
    quoteGasAdjusted,
    estimatedGasUsed,
    estimatedGasUsedQuoteToken,
    estimatedGasUsedUSD,
    gasPriceWei: BigNumber.from(swapRoute.gasPriceWei),
    trade,
    route: routesWithValidQuote,
    blockNumber: BigNumber.from(swapRoute.blockNumber),
    methodParameters: swapRoute.methodParameters
      ? ({
          calldata: swapRoute.methodParameters.calldata,
          value: swapRoute.methodParameters.value,
        } as MethodParameters)
      : undefined,
  } as SwapRoute;
}
