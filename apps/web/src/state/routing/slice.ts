import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Protocol } from "@taraswap/router-sdk";
import { ChainId, TradeType } from "@taraswap/sdk-core";
import { isUniswapXSupportedChain } from "constants/chains";
import ms from "ms";
import { logSwapQuoteRequest } from "tracing/swapFlowLoggers";
import { trace } from "tracing/trace";
import { logger } from "utilities/src/logger/logger";
import { RPC_PROVIDERS } from "../../constants/providers";
import {
  ClassicAPIConfig,
  ClassicQuoteData,
  GetQuoteArgs,
  INTERNAL_ROUTER_PREFERENCE_PRICE,
  QuoteIntent,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  RoutingConfig,
  TradeResult,
  URAQuoteResponse,
  URAQuoteType,
  UniswapXConfig,
  UniswapXv2Config,
} from "./types";
import {
  isExactInput,
  transformQuoteToTrade,
  transformTaraQuoteToTrade,
} from "./utils";

const UNISWAP_API_URL = process.env.REACT_APP_QUOTE_ENDPOINT;
const UNISWAP_GATEWAY_DNS_URL =
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  "https://interface.gateway.taraswap.org";
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(
    `UNISWAP_API_URL and UNISWAP_GATEWAY_DNS_URL must be defined environment variables`
  );
}

const TARAXA_ROUTING_API_URL = process.env.REACT_APP_TARAXA_ROUTING_API || "";

const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
};

const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED];

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const DEFAULT_QUERY_PARAMS = {
  // this should be removed once BE fixes issue where enableUniversalRouter is required for fees to work
  enableUniversalRouter: true,
};

function getRoutingAPIConfig(args: GetQuoteArgs): RoutingConfig {
  const {
    account,
    tokenInChainId,
    uniswapXForceSyntheticQuotes,
    routerPreference,
    protocolPreferences,
    isXv2,
    priceImprovementBps,
    forceOpenOrders,
    deadlineBufferSecs,
    isXv2Arbitrum,
  } = args;

  const uniswapX: UniswapXConfig = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    swapper: account,
    routingType: URAQuoteType.DUTCH_V1,
  };

  const uniswapXv2: UniswapXv2Config = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    swapper: account,
    routingType: URAQuoteType.DUTCH_V2,
    ...(isXv2Arbitrum
      ? {
          priceImprovementBps,
          forceOpenOrders,
          deadlineBufferSecs,
        }
      : {}),
  };

  const classic: ClassicAPIConfig = {
    ...DEFAULT_QUERY_PARAMS,
    protocols:
      protocolPreferences && protocolPreferences.length > 0
        ? protocolPreferences
        : protocols,
    routingType: URAQuoteType.CLASSIC,
    recipient: account,
    enableFeeOnTransferFeeFetching: true,
  };

  if (
    // If the user has opted out of UniswapX during the opt-out transition period, we should respect that preference and only request classic quotes.
    routerPreference === RouterPreference.API ||
    routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ||
    (!isUniswapXSupportedChain(tokenInChainId) && !isXv2Arbitrum)
  ) {
    return [classic];
  }

  return [isXv2 || isXv2Arbitrum ? uniswapXv2 : uniswapX, classic];
}

export const routingApi = createApi({
  reducerPath: "routingApi",
  baseQuery: fetchBaseQuery({
    headers: { "Access-Control-Allow-Origin": "*" },
  }),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      queryFn(args, _api, _extraOptions, fetch) {
        return trace(
          { name: "Quote", op: "quote", data: { ...args } },
          async (trace) => {
            logSwapQuoteRequest(
              args.tokenInChainId,
              args.routerPreference,
              false
            );
            const {
              tokenInAddress: tokenIn,
              tokenInChainId,
              tokenOutAddress: tokenOut,
              tokenOutChainId,
              amount,
              tradeType,
              sendPortionEnabled,
            } = args;

            if (
              tokenInChainId !== ChainId.TARAXA_TESTNET &&
              tokenInChainId !== ChainId.TARAXA
            ) {
              return {
                data: {
                  state: QuoteState.NOT_FOUND,
                  latencyMs: trace.now(),
                },
              };
            }

            const requestBody = {
              tokenInChainId,
              tokenIn,
              tokenOutChainId,
              tokenOut,
              amount,
              sendPortionEnabled,
              type: isExactInput(tradeType) ? "EXACT_INPUT" : "EXACT_OUTPUT",
              intent:
                args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE
                  ? QuoteIntent.Pricing
                  : QuoteIntent.Quote,
              configs: getRoutingAPIConfig(args),
              useUniswapX: args.routerPreference === RouterPreference.X,
              swapper: args.account,
            };

            const baseURL =
              args.tokenInChainId === ChainId.TARAXA_TESTNET ||
              args.tokenInChainId === ChainId.TARAXA
                ? TARAXA_ROUTING_API_URL
                : UNISWAP_API_URL;

            try {
              if (
                args.tokenInChainId !== ChainId.TARAXA_TESTNET &&
                args.tokenInChainId !== ChainId.TARAXA
              ) {
                return trace.child(
                  { name: "Quote on server", op: "quote.server" },
                  async (serverTrace) => {
                    const response = await fetch({
                      method: "POST",
                      url: `${baseURL}/quote`,
                      body: JSON.stringify(requestBody),
                      headers: {
                        "x-request-source": "uniswap-web",
                      },
                    });
                    if (response.error) {
                      try {
                        // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
                        const errorData = response.error.data as {
                          errorCode?: string;
                          detail?: string;
                        };
                        // NO_ROUTE should be treated as a valid response to prevent retries.
                        if (
                          typeof errorData === "object" &&
                          (errorData?.errorCode === "NO_ROUTE" ||
                            errorData?.detail === "No quotes available")
                        ) {
                          serverTrace.setStatus("unknown_error");
                          trace.setStatus("unknown_error");
                          return {
                            data: {
                              state: QuoteState.NOT_FOUND,
                              latencyMs: trace.now(),
                            },
                          };
                        }
                      } catch {
                        console.warn("error got caught here");
                        throw response.error;
                      }
                    }

                    const uraQuoteResponse = response.data as URAQuoteResponse;
                    const tradeResult = await transformQuoteToTrade(
                      args,
                      uraQuoteResponse,
                      QuoteMethod.ROUTING_API
                    );
                    return { data: { ...tradeResult, latencyMs: trace.now() } };
                  }
                );
              } else {
                try {
                  const taraxaRpcProvider = RPC_PROVIDERS[args.tokenInChainId];
                  // console.log("taraxaRpcProvider", taraxaRpcProvider);
                  // const taraxaAlphaRouter = new AlphaRouter({
                  //   chainId: args.tokenInChainId,
                  //   provider: taraxaRpcProvider,
                  // });
                  // console.log("taraxaAlphaRouter", taraxaAlphaRouter);
                  return trace.child(
                    { name: "Quote on client", op: "quote.client" },
                    async (clientTrace) => {
                      const constructGetUrlForTaraxa = (args: GetQuoteArgs) => {
                        const url = new URL(`${TARAXA_ROUTING_API_URL}/quote`);
                        url.searchParams.set(
                          "tokenInChainId",
                          args.tokenInChainId.toString()
                        );
                        url.searchParams.set(
                          "tokenInAddress",
                          args.tokenInAddress === "ETH"
                            ? "TARA"
                            : args.tokenInAddress.toString()
                        );
                        url.searchParams.set(
                          "tokenOutChainId",
                          args.tokenOutChainId.toString() === "ETH"
                            ? "TARA"
                            : args.tokenOutChainId.toString()
                        );
                        url.searchParams.set(
                          "tokenOutAddress",
                          args.tokenOutAddress === "ETH"
                            ? "TARA"
                            : args.tokenOutAddress
                        );
                        url.searchParams.set("amount", args.amount);
                        url.searchParams.set(
                          "type",
                          tradeType === TradeType.EXACT_INPUT
                            ? "exactIn"
                            : "exactOut"
                        );
                        args.account &&
                          url.searchParams.set("recipient", args.account);

                        return url;
                      };
                      const taraxaurl = constructGetUrlForTaraxa(args);
                      // console.log("Taraxa url: ", taraxaurl.toString());
                      const returnData = await fetch(taraxaurl.toString());
                      if (!returnData.error) {
                        const quoteResult: URAQuoteResponse = {
                          routing: URAQuoteType.CLASSIC,
                          quote: returnData.data as ClassicQuoteData,
                          allQuotes: [],
                        };
                        const trade = await transformTaraQuoteToTrade(
                          args,
                          quoteResult,
                          QuoteMethod.CLIENT_SIDE_FALLBACK
                        );
                        // console.log("trade", trade);
                        return {
                          data: { ...trade, latencyMs: trace.now() },
                        };
                      } else {
                        clientTrace.setStatus("unknown_error");
                        trace.setStatus("unknown_error");
                        return {
                          data: {
                            ...(returnData as any),
                            latencyMs: trace.now(),
                          },
                        };
                      }
                    }
                  );
                } catch (error: any) {
                  console.warn(`GetQuote failed on client: ${error}`);
                  trace.setError(error);
                  return {
                    error: {
                      status: "CUSTOM_ERROR",
                      error: error?.detail ?? error?.message ?? error,
                    },
                  };
                }
              }
            } catch (error: any) {
              logger.warn(
                "routing/slice",
                "queryFn",
                `GetQuote failed on Unified Routing API, falling back to client: ${
                  error?.message ?? error?.detail ?? error
                }`
              );
            }

            try {
              return trace.child(
                { name: "Quote on client", op: "quote.client" },
                async () => {
                  const { getRouter, getClientSideQuote } = await import(
                    "lib/hooks/routing/clientSideSmartOrderRouter"
                  );
                  const router = getRouter(args.tokenInChainId);
                  const quoteResult = await getClientSideQuote(
                    args,
                    router,
                    CLIENT_PARAMS
                  );
                  if (quoteResult.state === QuoteState.SUCCESS) {
                    const trade = await transformQuoteToTrade(
                      args,
                      quoteResult.data,
                      QuoteMethod.CLIENT_SIDE_FALLBACK
                    );
                    return {
                      data: { ...trade, latencyMs: trace.now() },
                    };
                  } else {
                    return { data: { ...quoteResult, latencyMs: trace.now() } };
                  }
                }
              );
            } catch (error: any) {
              logger.warn(
                "routing/slice",
                "queryFn",
                `GetQuote failed on client: ${error}`
              );
              trace.setError(error);
              return {
                error: {
                  status: "CUSTOM_ERROR",
                  error: error?.detail ?? error?.message ?? error,
                },
              };
            }
          }
        );
      },
      keepUnusedDataFor: ms(`10s`),
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
});

export const { useGetQuoteQuery } = routingApi;
export const useGetQuoteQueryState =
  routingApi.endpoints.getQuote.useQueryState;
