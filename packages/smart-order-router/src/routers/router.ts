import { BigNumber } from '@ethersproject/bignumber';
import {
  CondensedAddLiquidityOptions,
  MixedRouteSDK,
  Protocol,
  Trade,
} from '@teleswap/router-sdk';
import { Route as V2RouteRaw } from '@teleswap/v2-sdk';
import {
  Currency,
  Fraction,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';
import {
  MethodParameters,
  Pool,
  Position,
  Route as V3RouteRaw,
} from '@uniswap/v3-sdk';

import { CurrencyAmount } from '../util/amounts';

import { RouteWithValidQuote } from './alpha-router';

export class V3Route extends V3RouteRaw<Token, Token> {
  protocol: Protocol.V3 = Protocol.V3;
}
export class V2Route extends V2RouteRaw<Token, Token> {
  protocol: Protocol.V2 = Protocol.V2;
}
export class MixedRoute extends MixedRouteSDK<Token, Token> {
  protocol: Protocol.MIXED = Protocol.MIXED;
}

export type SwapRoute = {
  /**
   * The quote for the swap.
   * For EXACT_IN swaps this will be an amount of token out.
   * For EXACT_OUT this will be an amount of token in.
   */
  quote: CurrencyAmount;
  /**
   * The quote adjusted for the estimated gas used by the swap.
   * This is computed by estimating the amount of gas used by the swap, converting
   * this estimate to be in terms of the quote token, and subtracting that from the quote.
   * i.e. quoteGasAdjusted = quote - estimatedGasUsedQuoteToken
   */
  quoteGasAdjusted: CurrencyAmount;
  /**
   * The estimate of the gas used by the swap.
   */
  estimatedGasUsed: BigNumber;
  /**
   * The estimate of the gas used by the swap in terms of the quote token.
   */
  estimatedGasUsedQuoteToken: CurrencyAmount;
  /**
   * The estimate of the gas used by the swap in USD.
   */
  estimatedGasUsedUSD: CurrencyAmount;
  /**
   * The gas price used when computing quoteGasAdjusted, estimatedGasUsedQuoteToken, etc.
   */
  gasPriceWei: BigNumber;
  /**
   * The Trade object representing the swap.
   */
  trade: Trade<Currency, Currency, TradeType>;
  /**
   * The routes of the swap.
   */
  route: RouteWithValidQuote[];
  /**
   * The block number used when computing the swap.
   */
  blockNumber: BigNumber;
  /**
   * The calldata to execute the swap. Only returned if swapConfig was provided when calling the router.
   */
  methodParameters?: MethodParameters;
  /**
   * Flag that is true if and only if simulation is requested and simulation fails
   */
  simulationError?: boolean;
};

export type SwapToRatioRoute = SwapRoute & {
  optimalRatio: Fraction;
  postSwapTargetPool: Pool;
};

export enum SwapToRatioStatus {
  SUCCESS = 1,
  NO_ROUTE_FOUND = 2,
  NO_SWAP_NEEDED = 3,
}

export type SwapToRatioSuccess = {
  status: SwapToRatioStatus.SUCCESS;
  result: SwapToRatioRoute;
};

export type SwapToRatioFail = {
  status: SwapToRatioStatus.NO_ROUTE_FOUND;
  error: string;
};

export type SwapToRatioNoSwapNeeded = {
  status: SwapToRatioStatus.NO_SWAP_NEEDED;
};

export type SwapToRatioResponse =
  | SwapToRatioSuccess
  | SwapToRatioFail
  | SwapToRatioNoSwapNeeded;

export type SwapOptions = {
  recipient: string;
  slippageTolerance: Percent;
  deadline: number;
  simulate?: { fromAddress: string };
  inputTokenPermit?: {
    v: 0 | 1 | 27 | 28;
    r: string;
    s: string;
  } & (
    | {
        amount: string;
        deadline: string;
      }
    | {
        nonce: string;
        expiry: string;
      }
  );
};

// Config passed in to determine configurations on acceptable liquidity
// to add to a position and max iterations on the route-finding algorithm
export type SwapAndAddConfig = {
  maxIterations: number;
  ratioErrorTolerance: Fraction;
};

// Options for executing the swap and add.
// If provided, calldata for executing the swap and add will also be returned.
export type SwapAndAddOptions = {
  swapOptions: SwapOptions;
  addLiquidityOptions: CondensedAddLiquidityOptions;
};

// SwapAndAddOptions plus all other parameters needed to encode the
// on-chain swap-and-add process
export type SwapAndAddParameters = {
  // starting balance for tokenIn which will inform the tokenIn position amount
  initialBalanceTokenIn: CurrencyAmount;
  // starting balance for tokenOut which will inform the tokenOut position amount
  initialBalanceTokenOut: CurrencyAmount;
  // position details needed to create a new Position with the known liquidity amounts
  preLiquidityPosition: Position;
};

/**
 * Provides functionality for finding optimal swap routes on the Uniswap protocol.
 *
 * @export
 * @abstract
 * @class IRouter
 */
export abstract class IRouter<RoutingConfig> {
  /**
   * Finds the optimal way to swap tokens, and returns the route as well as a quote for the swap.
   * Considers split routes, multi-hop swaps, and gas costs.
   *
   * @abstract
   * @param amount The amount specified by the user. For EXACT_IN swaps, this is the input token amount. For EXACT_OUT swaps, this is the output token.
   * @param quoteCurrency The currency of the token we are returning a quote for. For EXACT_IN swaps, this is the output token. For EXACT_OUT, this is the input token.
   * @param tradeType The type of the trade, either exact in or exact out.
   * @param [swapOptions] Optional config for executing the swap. If provided, calldata for executing the swap will also be returned.
   * @param [partialRoutingConfig] Optional config for finding the optimal route.
   * @returns The swap route.
   */
  abstract route(
    amount: CurrencyAmount,
    quoteCurrency: Currency,
    swapType: TradeType,
    swapOptions?: SwapOptions,
    partialRoutingConfig?: Partial<RoutingConfig>
  ): Promise<SwapRoute | null>;
}

export abstract class ISwapToRatio<RoutingConfig, SwapAndAddConfig> {
  abstract routeToRatio(
    token0Balance: CurrencyAmount,
    token1Balance: CurrencyAmount,
    position: Position,
    swapAndAddConfig: SwapAndAddConfig,
    swapAndAddOptions?: SwapAndAddOptions,
    routingConfig?: RoutingConfig
  ): Promise<SwapToRatioResponse>;
}
