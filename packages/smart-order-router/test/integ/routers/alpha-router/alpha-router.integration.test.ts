/**
 * @jest-environment hardhat
 */

import {
  Currency,
  CurrencyAmount,
  Ether,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';
import {
  AlphaRouter,
  AlphaRouterConfig,
  CachingV3PoolProvider,
  CEUR_CELO,
  CEUR_CELO_ALFAJORES,
  ChainId,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI_MAINNET,
  DAI_ON,
  FallbackTenderlySimulator,
  ID_TO_NETWORK_NAME,
  ID_TO_PROVIDER,
  MixedRoute,
  nativeOnChain,
  NATIVE_CURRENCY,
  NodeJSCache,
  OnChainQuoteProvider,
  parseAmount,
  SUPPORTED_CHAINS,
  UniswapMulticallProvider,
  UNI_GÖRLI,
  UNI_MAINNET,
  USDC_ETHEREUM_GNOSIS,
  USDC_MAINNET,
  USDC_ON,
  USDT_MAINNET,
  V2PoolProvider,
  V2Route,
  V2_SUPPORTED,
  V3PoolProvider,
  V3Route,
  WBTC_GNOSIS,
  WBTC_MOONBEAM,
  WETH9,
  WNATIVE_ON,
} from '../../../../src';
import { WHALES } from '../../../test-util/whales';

import 'jest-environment-hardhat';

import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';
import { Protocol } from '@uniswap/router-sdk';
import { Pair } from '@teleswap/v2-sdk';
import {
  encodeSqrtRatioX96,
  FeeAmount,
  MethodParameters,
  Pool,
} from '@uniswap/v3-sdk';
import { BigNumber, providers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import _ from 'lodash';
import { StaticGasPriceProvider } from '../../../../src/providers/static-gas-price-provider';
import { DEFAULT_ROUTING_CONFIG_BY_CHAIN } from '../../../../src/routers/alpha-router/config';
import { getBalanceAndApprove } from '../../../test-util/getBalanceAndApprove';
import NodeCache from 'node-cache';

const SWAP_ROUTER_V2 = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const SLIPPAGE = new Percent(5, 100); // 5% or 10_000?

const checkQuoteToken = (
  before: CurrencyAmount<Currency>,
  after: CurrencyAmount<Currency>,
  tokensQuoted: CurrencyAmount<Currency>
) => {
  // Check which is bigger to support exactIn and exactOut
  const tokensSwapped = after.greaterThan(before)
    ? after.subtract(before)
    : before.subtract(after);
  const tokensDiff = tokensQuoted.greaterThan(tokensSwapped)
    ? tokensQuoted.subtract(tokensSwapped)
    : tokensSwapped.subtract(tokensQuoted);
  const percentDiff = tokensDiff.asFraction.divide(tokensQuoted.asFraction);
  expect(percentDiff.lessThan(SLIPPAGE)).toBe(true);
};

const getQuoteToken = (
  tokenIn: Currency,
  tokenOut: Currency,
  tradeType: TradeType
): Currency => {
  return tradeType == TradeType.EXACT_INPUT ? tokenOut : tokenIn;
};

export function parseDeadline(deadline: number): number {
  return Math.floor(Date.now() / 1000) + deadline;
}

const expandDecimals = (currency: Currency, amount: number): number => {
  return amount * 10 ** currency.decimals;
};

describe('alpha router integration', () => {
  let alice: JsonRpcSigner;
  jest.setTimeout(500 * 1000); // 500s

  let alphaRouter: AlphaRouter;
  const multicall2Provider = new UniswapMulticallProvider(
    ChainId.MAINNET,
    hardhat.provider
  );

  const ROUTING_CONFIG: AlphaRouterConfig = {
    // @ts-ignore[TS7053] - complaining about switch being non exhaustive
    ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[ChainId.MAINNET],
    protocols: [Protocol.V3, Protocol.V2],
  };

  const executeSwap = async (
    methodParameters: MethodParameters,
    tokenIn: Currency,
    tokenOut: Currency,
    gasLimit?: BigNumber,
  ): Promise<{
    tokenInAfter: CurrencyAmount<Currency>;
    tokenInBefore: CurrencyAmount<Currency>;
    tokenOutAfter: CurrencyAmount<Currency>;
    tokenOutBefore: CurrencyAmount<Currency>;
  }> => {
    expect(tokenIn.symbol).not.toBe(tokenOut.symbol);
    // We use this helper function for approving rather than hardhat.provider.approve
    // because there is custom logic built in for handling USDT and other checks
    const tokenInBefore = await getBalanceAndApprove(
      alice,
      SWAP_ROUTER_V2,
      tokenIn
    );
    const tokenOutBefore = await hardhat.getBalance(alice._address, tokenOut);

    const transaction = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_V2,
      value: BigNumber.from(methodParameters.value),
      from: alice._address,
      gasPrice: BigNumber.from(2000000000000),
      type: 1,
    };

    let transactionResponse: providers.TransactionResponse
    if(gasLimit) {
      transactionResponse = await alice.sendTransaction({...transaction, gasLimit: gasLimit});
    } else {
      transactionResponse = await alice.sendTransaction(transaction)
    }


    const receipt = await transactionResponse.wait();
    expect(receipt.status == 1).toBe(true); // Check for txn success

    const tokenInAfter = await hardhat.getBalance(alice._address, tokenIn);
    const tokenOutAfter = await hardhat.getBalance(alice._address, tokenOut);

    return {
      tokenInAfter,
      tokenInBefore,
      tokenOutAfter,
      tokenOutBefore,
    };
  };

  /**
   * Function to validate swapRoute data.
   * @param quote: CurrencyAmount<Currency>
   * @param quoteGasAdjusted: CurrencyAmount<Currency>
   * @param tradeType: TradeType
   * @param targetQuoteDecimalsAmount?: number - if defined, checks that the quoteDecimals is within the range of this +/- acceptableDifference (non inclusive bounds)
   * @param acceptableDifference?: number - see above
   */
  const validateSwapRoute = async (
    quote: CurrencyAmount<Currency>,
    quoteGasAdjusted: CurrencyAmount<Currency>,
    tradeType: TradeType,
    targetQuoteDecimalsAmount?: number,
    acceptableDifference?: number
  ) => {
    // strict undefined checks here to avoid confusion with 0 being a falsy value
    if (targetQuoteDecimalsAmount !== undefined) {
      acceptableDifference =
        acceptableDifference !== undefined ? acceptableDifference : 0;
      expect(
        quote.greaterThan(
          CurrencyAmount.fromRawAmount(
            quote.currency,
            expandDecimals(
              quote.currency,
              targetQuoteDecimalsAmount - acceptableDifference
            )
          )
        )
      ).toBe(true);
      expect(
        quote.lessThan(
          CurrencyAmount.fromRawAmount(
            quote.currency,
            expandDecimals(
              quote.currency,
              targetQuoteDecimalsAmount + acceptableDifference
            )
          )
        )
      ).toBe(true);
    }

    if (tradeType == TradeType.EXACT_INPUT) {
      // == lessThanOrEqualTo
      expect(!quoteGasAdjusted.greaterThan(quote)).toBe(true);
    } else {
      // == greaterThanOrEqual
      expect(!quoteGasAdjusted.lessThan(quote)).toBe(true);
    }
  };

  /**
   * Function to perform a call to executeSwap and validate the response
   * @param quote: CurrencyAmount<Currency>
   * @param tokenIn: Currency
   * @param tokenOut: Currency
   * @param methodParameters: MethodParameters
   * @param tradeType: TradeType
   * @param checkTokenInAmount?: number - if defined, check that the tokenInBefore - tokenInAfter = checkTokenInAmount
   * @param checkTokenOutAmount?: number - if defined, check that the tokenOutBefore - tokenOutAfter = checkTokenOutAmount
   */
  const validateExecuteSwap = async (
    quote: CurrencyAmount<Currency>,
    tokenIn: Currency,
    tokenOut: Currency,
    methodParameters: MethodParameters | undefined,
    tradeType: TradeType,
    checkTokenInAmount?: number,
    checkTokenOutAmount?: number,
    estimatedGasUsed?: BigNumber,
  ) => {
    expect(methodParameters).not.toBeUndefined();
    const { tokenInBefore, tokenInAfter, tokenOutBefore, tokenOutAfter } =
      await executeSwap(methodParameters!, tokenIn, tokenOut!, estimatedGasUsed);
    if (tradeType == TradeType.EXACT_INPUT) {
      if (checkTokenInAmount) {
        expect(
          tokenInBefore
            .subtract(tokenInAfter)
            .equalTo(
              CurrencyAmount.fromRawAmount(
                tokenIn,
                expandDecimals(tokenIn, checkTokenInAmount)
              )
            )
        ).toBe(true);
      }
      checkQuoteToken(
        tokenOutBefore,
        tokenOutAfter,
        /// @dev we need to recreate the CurrencyAmount object here because tokenOut can be different from quote.currency (in the case of ETH vs. WETH)
        CurrencyAmount.fromRawAmount(tokenOut, quote.quotient)
      );
    } else {
      if (checkTokenOutAmount) {
        expect(
          tokenOutAfter
            .subtract(tokenOutBefore)
            .equalTo(
              CurrencyAmount.fromRawAmount(
                tokenOut,
                expandDecimals(tokenOut, checkTokenOutAmount)
              )
            )
        ).toBe(true);
      }
      checkQuoteToken(
        tokenInBefore,
        tokenInAfter,
        CurrencyAmount.fromRawAmount(tokenIn, quote.quotient)
      );
    }
  };

  beforeAll(async () => {
    alice = hardhat.providers[0]!.getSigner();
    const aliceAddress = await alice.getAddress();
    expect(aliceAddress).toBe(alice._address);

    await hardhat.fund(
      alice._address,
      [
        parseAmount('8000000', USDC_MAINNET),
        parseAmount('5000000', USDT_MAINNET),
        parseAmount('1000', UNI_MAINNET),
        parseAmount('5000000', DAI_MAINNET),
      ],
      [
        '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', // Binance peg tokens
      ]
    );

    await hardhat.fund(
      alice._address,
      [parseAmount('4000', WETH9[1])],
      [
        '0x06920c9fc643de77b99cb7670a944ad31eaaa260', // WETH whale
      ]
    );

    // alice should always have 10000 ETH
    const aliceEthBalance = await hardhat.provider.getBalance(alice._address);
    /// Since alice is deploying the QuoterV3 contract, expect to have slightly less than 10_000 ETH but not too little
    expect(aliceEthBalance.toBigInt()).toBeGreaterThanOrEqual(
      parseEther('9995').toBigInt()
    );
    const aliceUSDCBalance = await hardhat.getBalance(
      alice._address,
      USDC_MAINNET
    );
    expect(aliceUSDCBalance).toEqual(parseAmount('8000000', USDC_MAINNET));
    const aliceUSDTBalance = await hardhat.getBalance(
      alice._address,
      USDT_MAINNET
    );
    expect(aliceUSDTBalance).toEqual(parseAmount('5000000', USDT_MAINNET));
    const aliceWETH9Balance = await hardhat.getBalance(
      alice._address,
      WETH9[1]
    );
    expect(aliceWETH9Balance).toEqual(parseAmount('4000', WETH9[1]));
    const aliceDAIBalance = await hardhat.getBalance(
      alice._address,
      DAI_MAINNET
    );
    expect(aliceDAIBalance).toEqual(parseAmount('5000000', DAI_MAINNET));
    const aliceUNIBalance = await hardhat.getBalance(
      alice._address,
      UNI_MAINNET
    );
    expect(aliceUNIBalance).toEqual(parseAmount('1000', UNI_MAINNET));

    const v3PoolProvider = new CachingV3PoolProvider(
      ChainId.MAINNET,
      new V3PoolProvider(ChainId.MAINNET, multicall2Provider),
      new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
    );
    const v2PoolProvider = new V2PoolProvider(ChainId.MAINNET, multicall2Provider);

    const simulator = new FallbackTenderlySimulator(process.env.TENDERLY_BASE_URL!, process.env.TENDERLY_USER!, process.env.TENDERLY_PROJECT!, process.env.TENDERLY_ACCESS_KEY!, hardhat.providers[0]!,v2PoolProvider, v3PoolProvider)
    alphaRouter = new AlphaRouter({
      chainId: ChainId.MAINNET,
      provider: hardhat.providers[0]!,
      multicall2Provider,
      v2PoolProvider,
      v3PoolProvider,
      simulator
    });
  });

  /**
   *  tests are 1:1 with routing api integ tests
   */
  for (const tradeType of [TradeType.EXACT_INPUT, TradeType.EXACT_OUTPUT]) {
    describe(`${ID_TO_NETWORK_NAME(1)} alpha - ${tradeType}`, () => {
      describe(`+ Execute on Hardhat Fork`, () => {
        it('erc20 -> erc20', async () => {
          // declaring these to reduce confusion
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
            }
          );

          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it(`erc20 -> eth`, async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = Ether.onChain(1) as Currency;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('1000000', tokenIn)
              : parseAmount('10', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            1000000
          );
        });

        it(`erc20 -> eth large trade`, async () => {
          // Trade of this size almost always results in splits.
          const tokenIn = USDC_MAINNET;
          const tokenOut = Ether.onChain(1) as Currency;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('1000000', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, methodParameters } = swap!;

          const { route } = swap!;

          expect(route).not.toBeUndefined;

          const amountInEdgesTotal = _(route)
            // Defineness check first
            .filter((routeWithValidQuote) =>
              tradeType == TradeType.EXACT_INPUT
                ? !!routeWithValidQuote.amount.quotient
                : !!routeWithValidQuote.quote.quotient
            )
            .map((routeWithValidQuote) =>
              tradeType == TradeType.EXACT_INPUT
                ? BigNumber.from(routeWithValidQuote.amount.quotient.toString())
                : BigNumber.from(routeWithValidQuote.quote.quotient.toString())
            )
            .reduce((cur, total) => total.add(cur), BigNumber.from(0));
          /**
           * @dev for exactIn, make sure the sum of the amountIn to every split = total amountIn for the route
           * @dev for exactOut, make sure the sum of the quote of every split = total quote for the route
           */
          const amountIn =
            tradeType == TradeType.EXACT_INPUT
              ? BigNumber.from(amount.quotient.toString())
              : BigNumber.from(quote.quotient.toString());
          expect(amountIn).toEqual(amountInEdgesTotal);

          const amountOutEdgesTotal = _(route)
            .filter((routeWithValidQuote) =>
              tradeType == TradeType.EXACT_INPUT
                ? !!routeWithValidQuote.quote.quotient
                : !!routeWithValidQuote.amount.quotient
            )
            .map((routeWithValidQuote) =>
              tradeType == TradeType.EXACT_INPUT
                ? BigNumber.from(routeWithValidQuote.quote.quotient.toString())
                : BigNumber.from(routeWithValidQuote.amount.quotient.toString())
            )
            .reduce((cur, total) => total.add(cur), BigNumber.from(0));
          /**
           * @dev for exactIn, make sure the sum of the quote to every split = total quote for the route
           * @dev for exactOut, make sure the sum of the amountIn of every split = total amountIn for the route
           */
          const amountOut =
            tradeType == TradeType.EXACT_INPUT
              ? BigNumber.from(quote.quotient.toString())
              : BigNumber.from(amount.quotient.toString());
          expect(amountOut).toEqual(amountOutEdgesTotal);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            1000000
          );
        });

        it(`eth -> erc20`, async () => {
          /// Fails for v3 for some reason, ProviderGasError
          const tokenIn = Ether.onChain(1) as Currency;
          const tokenOut = UNI_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('10', tokenIn)
              : parseAmount('10000', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V2],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, methodParameters } = swap!;

          expect(methodParameters).not.toBeUndefined();

          const { tokenInBefore, tokenInAfter, tokenOutBefore, tokenOutAfter } =
            await executeSwap(methodParameters!, tokenIn, tokenOut);

          if (tradeType == TradeType.EXACT_INPUT) {
            // We've swapped 10 ETH + gas costs
            expect(
              tokenInBefore
                .subtract(tokenInAfter)
                .greaterThan(parseAmount('10', tokenIn))
            ).toBe(true);
            checkQuoteToken(
              tokenOutBefore,
              tokenOutAfter,
              CurrencyAmount.fromRawAmount(tokenOut, quote.quotient)
            );
          } else {
            /**
             * @dev it is possible for an exactOut to generate more tokens on V2 due to precision errors
             */
            expect(
              !tokenOutAfter
                .subtract(tokenOutBefore)
                // == .greaterThanOrEqualTo
                .lessThan(
                  CurrencyAmount.fromRawAmount(
                    tokenOut,
                    expandDecimals(tokenOut, 10000)
                  )
                )
            ).toBe(true);
            // Can't easily check slippage for ETH due to gas costs effecting ETH balance.
          }
        });

        it(`weth -> erc20`, async () => {
          const tokenIn = WETH9[1];
          const tokenOut = DAI_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, methodParameters } = swap!;

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it(`erc20 -> weth`, async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = WETH9[1];
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, methodParameters } = swap!;

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it('erc20 -> erc20 v3 only', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V3],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          const { route } = swap!;

          for (const r of route) {
            expect(r.protocol).toEqual('V3');
          }

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it('erc20 -> erc20 v2 only', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V2],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          const { route } = swap!;

          for (const r of route) {
            expect(r.protocol).toEqual('V2');
          }

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it('erc20 -> erc20 forceCrossProtocol', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
              forceCrossProtocol: true,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          const { route } = swap!;

          let hasV3Pool = false;
          let hasV2Pool = false;
          for (const r of route) {
            if (r.protocol == 'V3') {
              hasV3Pool = true;
            }
            if (r.protocol == 'V2') {
              hasV2Pool = true;
            }
          }

          expect(hasV3Pool && hasV2Pool).toBe(true);

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });
      });
      describe(`+ Simulate on Tenderly + Execute on Hardhat fork`, () => {
        it('erc20 -> erc20', async () => {
          // declaring these to reduce confusion
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
            }
          );

          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters } = swap!;

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10)

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100
          );
        });

        it(`erc20 -> eth large trade`, async () => {
          // Trade of this size almost always results in splits.
          const tokenIn = USDC_MAINNET;
          const tokenOut = Ether.onChain(1) as Currency;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('1000000', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;

          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            1000000,
            undefined,
            estimatedGasUsed
          );
        });

        it(`eth -> erc20`, async () => {
          /// Fails for v3 for some reason, ProviderGasError
          const tokenIn = Ether.onChain(1) as Currency;
          const tokenOut = UNI_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('10', tokenIn)
              : parseAmount('10000', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V2],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, simulationError, estimatedGasUsedQuoteToken } = swap!;
          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();
        });

        it(`weth -> erc20`, async () => {
          const tokenIn = WETH9[1];
          const tokenOut = DAI_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;

          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100,
            estimatedGasUsed
          );
        });

        it(`erc20 -> weth`, async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = WETH9[1];
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;

          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100,
            estimatedGasUsed
          );
        });

        it('erc20 -> erc20 v3 only', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V3],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;
          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100,
            estimatedGasUsed
          );
        });

        it('erc20 -> erc20 v2 only', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V2],
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;

          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100,
            estimatedGasUsed
          );
        });

        it('erc20 -> erc20 forceCrossProtocol', async () => {
          const tokenIn = USDC_MAINNET;
          const tokenOut = USDT_MAINNET;
          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('100', tokenIn)
              : parseAmount('100', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
              simulate: {fromAddress: WHALES(tokenIn)}
            },
            {
              ...ROUTING_CONFIG,
              forceCrossProtocol: true,
            }
          );
          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, estimatedGasUsed, simulationError, estimatedGasUsedQuoteToken } = swap!;

          expect(quoteGasAdjusted.subtract(quote).equalTo(estimatedGasUsedQuoteToken))

          // Expect tenderly simulation to be successful
          expect(simulationError).toBeUndefined();

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            100,
            100,
            estimatedGasUsed
          );
        });
      });

      it(`erc20 -> erc20 no recipient/deadline/slippage`, async () => {
        const tokenIn = USDC_MAINNET;
        const tokenOut = USDT_MAINNET;
        const amount =
          tradeType == TradeType.EXACT_INPUT
            ? parseAmount('100', tokenIn)
            : parseAmount('100', tokenOut);

        const swap = await alphaRouter.route(
          amount,
          getQuoteToken(tokenIn, tokenOut, tradeType),
          tradeType,
          undefined,
          {
            ...ROUTING_CONFIG,
          }
        );
        expect(swap).toBeDefined();
        expect(swap).not.toBeNull();

        const { quote, quoteGasAdjusted } = swap!;

        await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);
      });

      it(`erc20 -> erc20 gas price specified`, async () => {
        const tokenIn = USDC_MAINNET;
        const tokenOut = USDT_MAINNET;
        const amount =
          tradeType == TradeType.EXACT_INPUT
            ? parseAmount('100', tokenIn)
            : parseAmount('100', tokenOut);

        const gasPriceWeiBN = BigNumber.from(60000000000);
        const gasPriceProvider = new StaticGasPriceProvider(gasPriceWeiBN);
        // Create a new AlphaRouter with the new gas price provider
        const customAlphaRouter: AlphaRouter = new AlphaRouter({
          chainId: 1,
          provider: hardhat.providers[0]!,
          multicall2Provider,
          gasPriceProvider,
        });

        const swap = await customAlphaRouter.route(
          amount,
          getQuoteToken(tokenIn, tokenOut, tradeType),
          tradeType,
          undefined,
          {
            ...ROUTING_CONFIG,
          }
        );
        expect(swap).toBeDefined();
        expect(swap).not.toBeNull();

        const { quote, quoteGasAdjusted, gasPriceWei } = swap!;

        expect(gasPriceWei.eq(BigNumber.from(60000000000))).toBe(true);

        await validateSwapRoute(quote, quoteGasAdjusted, tradeType, 100, 10);
      });
    });
  }

  describe('Mixed routes', () => {
    const tradeType = TradeType.EXACT_INPUT;

    const BOND_MAINNET = new Token(
      1,
      '0x0391D2021f89DC339F60Fff84546EA23E337750f',
      18,
      'BOND',
      'BOND'
    );

    const APE_MAINNET = new Token(
      1,
      '0x4d224452801aced8b2f0aebe155379bb5d594381',
      18,
      'APE',
      'APE'
    );

    beforeAll(async () => {
      await hardhat.fund(
        alice._address,
        [parseAmount('10000', BOND_MAINNET)],
        [
          '0xf510dde022a655e7e3189cdf67687e7ffcd80d91', // BOND token whale
        ]
      );
      const aliceBONDBalance = await hardhat.getBalance(
        alice._address,
        BOND_MAINNET
      );
      expect(aliceBONDBalance).toEqual(parseAmount('10000', BOND_MAINNET));
    });

    describe(`exactIn mixedPath routes`, () => {
      describe('+ simulate swap', () => {
        it('BOND -> APE', async () => {
          const tokenIn = BOND_MAINNET;
          const tokenOut = APE_MAINNET;

          const amount =
            tradeType == TradeType.EXACT_INPUT
              ? parseAmount('10000', tokenIn)
              : parseAmount('10000', tokenOut);

          const swap = await alphaRouter.route(
            amount,
            getQuoteToken(tokenIn, tokenOut, tradeType),
            tradeType,
            {
              recipient: alice._address,
              slippageTolerance: SLIPPAGE,
              deadline: parseDeadline(360),
            },
            {
              ...ROUTING_CONFIG,
              protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
              forceMixedRoutes: true,
            }
          );

          expect(swap).toBeDefined();
          expect(swap).not.toBeNull();

          const { quote, quoteGasAdjusted, methodParameters, route } = swap!;

          expect(route.length).toEqual(1);
          expect(route[0]!.protocol).toEqual(Protocol.MIXED);

          await validateSwapRoute(quote, quoteGasAdjusted, tradeType);

          await validateExecuteSwap(
            quote,
            tokenIn,
            tokenOut,
            methodParameters,
            tradeType,
            10000
          );
        });
      });
    });
  });
});

describe('external class tests', () => {
  const multicall2Provider = new UniswapMulticallProvider(
    ChainId.MAINNET,
    hardhat.provider
  );
  const onChainQuoteProvider = new OnChainQuoteProvider(
    1,
    hardhat.provider,
    multicall2Provider
  );

  const token0 = new Token(
    1,
    '0x0000000000000000000000000000000000000001',
    18,
    't0',
    'token0'
  );
  const token1 = new Token(
    1,
    '0x0000000000000000000000000000000000000002',
    18,
    't1',
    'token1'
  );
  const token2 = new Token(
    1,
    '0x0000000000000000000000000000000000000003',
    18,
    't2',
    'token2'
  );

  const pool_0_1 = new Pool(
    token0,
    token1,
    FeeAmount.MEDIUM,
    encodeSqrtRatioX96(1, 1),
    0,
    0,
    []
  );

  const pool_1_2 = new Pool(
    token1,
    token2,
    FeeAmount.MEDIUM,
    encodeSqrtRatioX96(1, 1),
    0,
    0,
    []
  );

  const pair_0_1 = new Pair(
    CurrencyAmount.fromRawAmount(token0, 100),
    CurrencyAmount.fromRawAmount(token1, 100)
  );

  it('Prevents incorrect routes array configurations', async () => {
    const amountIns = [
      CurrencyAmount.fromRawAmount(token0, 1),
      CurrencyAmount.fromRawAmount(token0, 2),
    ];
    const amountOuts = [
      CurrencyAmount.fromRawAmount(token1, 1),
      CurrencyAmount.fromRawAmount(token1, 2),
    ];
    const v3Route = new V3Route([pool_0_1], token0, token1);
    const v3Route_2 = new V3Route([pool_0_1, pool_1_2], token0, token2);
    const v2route = new V2Route([pair_0_1], token0, token1);
    const mixedRoute = new MixedRoute([pool_0_1], token0, token1);
    const routes_v3_mixed = [v3Route, mixedRoute];
    const routes_v2_mixed = [v2route, mixedRoute];
    const routes_v3_v2_mixed = [v3Route, v2route, mixedRoute];
    const routes_v3_v2 = [v3Route, v2route];
    const routes_v3 = [v3Route, v3Route_2];

    /// Should fail
    await expect(
      onChainQuoteProvider.getQuotesManyExactIn(amountIns, routes_v3_v2_mixed)
    ).rejects.toThrow();
    await expect(
      onChainQuoteProvider.getQuotesManyExactIn(amountIns, routes_v3_v2)
    ).rejects.toThrow();
    await expect(
      onChainQuoteProvider.getQuotesManyExactIn(amountIns, routes_v3_mixed)
    ).rejects.toThrow();

    await expect(
      /// @dev so since we type the input argument, we can't really call it with a wrong configuration of routes
      /// however, we expect this to fail in case it is called somehow w/o type checking
      onChainQuoteProvider.getQuotesManyExactOut(
        amountOuts,
        routes_v3_v2_mixed as unknown as V3Route[]
      )
    ).rejects.toThrow();

    await expect(
      onChainQuoteProvider.getQuotesManyExactOut(
        amountOuts,
        routes_v2_mixed as unknown as V3Route[]
      )
    ).rejects.toThrow();

    await expect(
      onChainQuoteProvider.getQuotesManyExactOut(amountOuts, [
        mixedRoute,
      ] as unknown as V3Route[])
    ).rejects.toThrow();

    await expect(
      onChainQuoteProvider.getQuotesManyExactOut(amountOuts, [
        v2route,
      ] as unknown as V3Route[])
    ).rejects.toThrow();

    /// ExactIn passing tests
    await onChainQuoteProvider.getQuotesManyExactIn(amountIns, routes_v2_mixed);
    await onChainQuoteProvider.getQuotesManyExactIn(amountIns, routes_v3);
    await onChainQuoteProvider.getQuotesManyExactIn(amountIns, [v2route]);
    await onChainQuoteProvider.getQuotesManyExactIn(amountIns, [mixedRoute]);
    await onChainQuoteProvider.getQuotesManyExactIn(amountIns, [v3Route]);
    /// ExactOut passing tests
    await onChainQuoteProvider.getQuotesManyExactOut(amountOuts, routes_v3);
    await onChainQuoteProvider.getQuotesManyExactOut(amountOuts, [v3Route]);
  });
});

describe('quote for other networks', () => {
  const TEST_ERC20_1: { [chainId in ChainId]: Token } = {
    [ChainId.MAINNET]: USDC_ON(1),
    [ChainId.ROPSTEN]: USDC_ON(ChainId.ROPSTEN),
    [ChainId.RINKEBY]: USDC_ON(ChainId.RINKEBY),
    [ChainId.GÖRLI]: UNI_GÖRLI,
    [ChainId.KOVAN]: USDC_ON(ChainId.KOVAN),
    [ChainId.OPTIMISM]: USDC_ON(ChainId.OPTIMISM),
    [ChainId.OPTIMISTIC_KOVAN]: USDC_ON(ChainId.OPTIMISTIC_KOVAN),
    [ChainId.ARBITRUM_ONE]: USDC_ON(ChainId.ARBITRUM_ONE),
    [ChainId.ARBITRUM_RINKEBY]: USDC_ON(ChainId.ARBITRUM_RINKEBY),
    [ChainId.POLYGON]: USDC_ON(ChainId.POLYGON),
    [ChainId.POLYGON_MUMBAI]: USDC_ON(ChainId.POLYGON_MUMBAI),
    [ChainId.CELO]: CUSD_CELO,
    [ChainId.CELO_ALFAJORES]: CUSD_CELO_ALFAJORES,
    [ChainId.GNOSIS]: WBTC_GNOSIS,
    [ChainId.MOONBEAM]: WBTC_MOONBEAM,
  };
  const TEST_ERC20_2: { [chainId in ChainId]: Token } = {
    [ChainId.MAINNET]: DAI_ON(1),
    [ChainId.ROPSTEN]: DAI_ON(ChainId.ROPSTEN),
    [ChainId.RINKEBY]: DAI_ON(ChainId.RINKEBY),
    [ChainId.GÖRLI]: DAI_ON(ChainId.GÖRLI),
    [ChainId.KOVAN]: DAI_ON(ChainId.KOVAN),
    [ChainId.OPTIMISM]: DAI_ON(ChainId.OPTIMISM),
    [ChainId.OPTIMISTIC_KOVAN]: DAI_ON(ChainId.OPTIMISTIC_KOVAN),
    [ChainId.ARBITRUM_ONE]: DAI_ON(ChainId.ARBITRUM_ONE),
    [ChainId.ARBITRUM_RINKEBY]: DAI_ON(ChainId.ARBITRUM_RINKEBY),
    [ChainId.POLYGON]: DAI_ON(ChainId.POLYGON),
    [ChainId.POLYGON_MUMBAI]: DAI_ON(ChainId.POLYGON_MUMBAI),
    [ChainId.CELO]: CEUR_CELO,
    [ChainId.CELO_ALFAJORES]: CEUR_CELO_ALFAJORES,
    [ChainId.GNOSIS]: USDC_ETHEREUM_GNOSIS,
    [ChainId.MOONBEAM]: WBTC_MOONBEAM,
  };

  // TODO: Find valid pools/tokens on optimistic kovan and polygon mumbai. We skip those tests for now.
  for (const chain of _.filter(
    SUPPORTED_CHAINS,
    (c) =>
      c != ChainId.RINKEBY &&
      c != ChainId.ROPSTEN &&
      c != ChainId.OPTIMISTIC_KOVAN &&
      c != ChainId.POLYGON_MUMBAI &&
      c != ChainId.ARBITRUM_RINKEBY &&
      c != ChainId.OPTIMISM && /// @dev infura has been having issues with optimism lately
      // Tests are failing https://github.com/Uniswap/smart-order-router/issues/104
      c != ChainId.CELO_ALFAJORES
  )) {
    for (const tradeType of [TradeType.EXACT_INPUT, TradeType.EXACT_OUTPUT]) {
      const erc1 = TEST_ERC20_1[chain];
      const erc2 = TEST_ERC20_2[chain];

      describe(`${ID_TO_NETWORK_NAME(chain)} ${tradeType} 2xx`, function () {
        // Help with test flakiness by retrying.
        jest.retryTimes(1);

        const wrappedNative = WNATIVE_ON(chain);

        let alphaRouter: AlphaRouter;

        const chainProvider = ID_TO_PROVIDER(chain);
        const provider = new JsonRpcProvider(chainProvider, chain);
        const multicall2Provider = new UniswapMulticallProvider(
          chain,
          provider
        );
        const v3PoolProvider = new CachingV3PoolProvider(
          ChainId.MAINNET,
          new V3PoolProvider(ChainId.MAINNET, multicall2Provider),
          new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
        );
        const v2PoolProvider = new V2PoolProvider(ChainId.MAINNET, multicall2Provider);

        const simulator = new FallbackTenderlySimulator(process.env.TENDERLY_BASE_URL!, process.env.TENDERLY_USER!, process.env.TENDERLY_PROJECT!, process.env.TENDERLY_ACCESS_KEY!, provider, v2PoolProvider, v3PoolProvider)
        alphaRouter = new AlphaRouter({
          chainId: ChainId.MAINNET,
          provider: provider,
          multicall2Provider,
          v2PoolProvider,
          v3PoolProvider,
          simulator
        });

        beforeAll(async () => {
          alphaRouter = new AlphaRouter({
            chainId: chain,
            provider,
            multicall2Provider,
            simulator
          });
        });

        describe(`Swap`, function () {
          it(`${wrappedNative.symbol} -> erc20`, async () => {
            const tokenIn = wrappedNative;
            const tokenOut = erc1;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('10', tokenIn)
                : parseAmount('10', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              undefined,
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();

            // Scope limited for non mainnet network tests to validating the swap
          });

          it(`erc20 -> erc20`, async () => {
            const tokenIn = erc1;
            const tokenOut = erc2;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('1', tokenIn)
                : parseAmount('1', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              undefined,
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
          });

          const native = NATIVE_CURRENCY[chain];

          it(`${native} -> erc20`, async () => {
            const tokenIn = nativeOnChain(chain);
            const tokenOut = erc2;

            // Celo currently has low liquidity and will not be able to find route for
            // large input amounts
            // TODO: Simplify this when Celo has more liquidity
            const amount =
              chain == ChainId.CELO || chain == ChainId.CELO_ALFAJORES
                ? tradeType == TradeType.EXACT_INPUT
                  ? parseAmount('10', tokenIn)
                  : parseAmount('10', tokenOut)
                : tradeType == TradeType.EXACT_INPUT
                ? parseAmount('100', tokenIn)
                : parseAmount('100', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              undefined,
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
          });

          it(`has quoteGasAdjusted values`, async () => {
            const tokenIn = erc1;
            const tokenOut = erc2;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('1', tokenIn)
                : parseAmount('1', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              undefined,
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();

            const { quote, quoteGasAdjusted } = swap!;

            if (tradeType == TradeType.EXACT_INPUT) {
              // === .lessThanOrEqualTo
              expect(!quoteGasAdjusted.greaterThan(quote)).toBe(true);
            } else {
              // === .greaterThanOrEqualTo
              expect(!quoteGasAdjusted.lessThan(quote)).toBe(true);
            }
          });

          it(`does not error when protocols array is empty`, async () => {
            const tokenIn = erc1;
            const tokenOut = erc2;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('1', tokenIn)
                : parseAmount('1', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              undefined,
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
          });

          if (!V2_SUPPORTED.includes(chain)) {
            it(`is null when considering MIXED on non supported chains for exactInput & exactOutput`, async () => {
              const tokenIn = erc1;
              const tokenOut = erc2;
              const amount =
                tradeType == TradeType.EXACT_INPUT
                  ? parseAmount('1', tokenIn)
                  : parseAmount('1', tokenOut);

              const swap = await alphaRouter.route(
                amount,
                getQuoteToken(tokenIn, tokenOut, tradeType),
                tradeType,
                undefined,
                {
                  // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                  ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                  protocols: [Protocol.MIXED],
                }
              );
              expect(swap).toBeNull();
            });
          }
        });
        describe(`Simulate + Swap`, function () {
          // Tenderly does not support Celo
          if([ChainId.CELO, ChainId.CELO_ALFAJORES].includes(chain)) {
            return
          }
          it(`${wrappedNative.symbol} -> erc20`, async () => {
            const tokenIn = wrappedNative;
            const tokenOut = erc1;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('10', tokenIn)
                : parseAmount('10', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              {
                recipient: WHALES(tokenIn),
                slippageTolerance: SLIPPAGE,
                deadline: parseDeadline(360),
                simulate: {fromAddress: WHALES(tokenIn)}
              },
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
            if(swap) {
              expect(swap.quoteGasAdjusted.subtract(swap.quote).equalTo(swap.estimatedGasUsedQuoteToken))

              // Expect tenderly simulation to be successful
              expect(swap.simulationError).toBeUndefined();
            }

            // Scope limited for non mainnet network tests to validating the swap
          });

          it(`erc20 -> erc20`, async () => {
            const tokenIn = erc1;
            const tokenOut = erc2;
            const amount =
              tradeType == TradeType.EXACT_INPUT
                ? parseAmount('1', tokenIn)
                : parseAmount('1', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              {
                recipient: WHALES(tokenIn),
                slippageTolerance: SLIPPAGE,
                deadline: parseDeadline(360),
                simulate: {fromAddress: WHALES(tokenIn)}
              },
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
            if(swap) {
              expect(swap.quoteGasAdjusted.subtract(swap.quote).equalTo(swap.estimatedGasUsedQuoteToken))

              // Expect tenderly simulation to be successful
              expect(swap.simulationError).toBeUndefined();
            }
          });

          const native = NATIVE_CURRENCY[chain];

          it(`${native} -> erc20`, async () => {
            const tokenIn = nativeOnChain(chain);
            const tokenOut = erc2;

            // Celo currently has low liquidity and will not be able to find route for
            // large input amounts
            // TODO: Simplify this when Celo has more liquidity
            const amount =
              chain == ChainId.CELO || chain == ChainId.CELO_ALFAJORES
                ? tradeType == TradeType.EXACT_INPUT
                  ? parseAmount('10', tokenIn)
                  : parseAmount('10', tokenOut)
                : tradeType == TradeType.EXACT_INPUT
                ? parseAmount('100', tokenIn)
                : parseAmount('100', tokenOut);

            const swap = await alphaRouter.route(
              amount,
              getQuoteToken(tokenIn, tokenOut, tradeType),
              tradeType,
              {
                recipient: WHALES(tokenIn),
                slippageTolerance: SLIPPAGE,
                deadline: parseDeadline(360),
                simulate: {fromAddress: WHALES(tokenIn)}
              },
              {
                // @ts-ignore[TS7053] - complaining about switch being non exhaustive
                ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chain],
                protocols: [Protocol.V3, Protocol.V2],
              }
            );
            expect(swap).toBeDefined();
            expect(swap).not.toBeNull();
            if(swap) {
              expect(swap.quoteGasAdjusted.subtract(swap.quote).equalTo(swap.estimatedGasUsedQuoteToken))

              // Expect tenderly simulation to be successful
              expect(swap.simulationError).toBeUndefined();
            }
          });
        })
      });
    }
  }
});
