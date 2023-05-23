import { HistoryCallback, PeriodParams, ResolutionString, SubscribeBarsCallback, LibrarySymbolInfo } from "../../public/charting_library";


import { useEffect, useMemo, useRef } from "react";

import _ from "lodash";
import { fetchPoolPriceData } from "graphql/limitlessGraph/poolPriceData";
import { client as UniswapClient, arbitrumClient } from "graphql/limitlessGraph/uniswapClients";
import { limitlessClient } from "graphql/limitlessGraph/limitlessClients";
import { useWeb3React } from "@web3-react/core";
import { Pool } from "@uniswap/v3-sdk";

arbitrumClient

export const SUPPORTED_RESOLUTIONS = { 60: "1h", 240: "4h", "1D": "1d" };


const configurationData = {
  supported_resolutions: Object.keys(SUPPORTED_RESOLUTIONS),
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
  reset_cache_timeout: 100,
};

type SymbolInfo = LibrarySymbolInfo & {
  poolAddress: string;
  invertPrice: boolean;
  useUniswapSubgraph: boolean;
}


export default function useDatafeed(
  {
    chainId,
    // symbol
  } :
  { 
    chainId: number,
    // symbol: string
  }
  ) {

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>();
  const resetCacheRef = useRef<() => void | undefined>();
  const activeTicker = useRef<string | undefined>();
  const shouldRefetchBars = useRef<boolean>(false);

  return useMemo(() => {
    return {
      datafeed: {
        onReady: (callback: any) => {
          console.log('[onReady]: Method call');
          setTimeout(() => callback(configurationData));
        },
        // symbolName => JSON obj. w/ token0Symbol, token1Symbol, poolAddress
        resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any, onResolveErrorCallback: any, extension: any) => {
          console.log('[resolveSymbol]: Method call', symbolName);
          if (symbolName === "") {
            return onResolveErrorCallback("Symbol cannot be empty");
          }
          const {
            baseSymbol,
            quoteSymbol,
            poolAddress,
            invertPrice,
            useUniswapSubgraph
          } = JSON.parse(symbolName);
          const symbolInfo = {
            name: baseSymbol + "/" + quoteSymbol,
            type: "crypto",
            description: baseSymbol + "/" + quoteSymbol,
            ticker: baseSymbol + "/" + quoteSymbol,
            session: "24x7",
            minmov: 1,
            pricescale: 100,
            timezone: "Etc/UTC",
            has_intraday: true,
            has_daily: true,
            currency_code: quoteSymbol,
            visible_plots_set: "ohlc",
            data_status: "streaming",
            poolAddress,
            invertPrice,
            useUniswapSubgraph
          };
          setTimeout(() => onSymbolResolvedCallback(symbolInfo));
        },
        searchSymbols: (userInput: any, exchange: any, symbolType: any, onResultReadyCallback: any) => {
          console.log('[searchSymbols]: Method call');
        },
        getBars: async (
          symbolInfo: SymbolInfo,
          resolution: ResolutionString,
          periodParams: PeriodParams,
          onHistoryCallback: HistoryCallback,
          onErrorCallback: (error: string) => void
        ) => {
          console.log('[getBars]: Method call', symbolInfo, periodParams);
          if (!_.has(SUPPORTED_RESOLUTIONS, resolution)) {
            return onErrorCallback("[getBars] Invalid resolution");
          }
          const { poolAddress, invertPrice, useUniswapSubgraph } = symbolInfo;
          const { from, to, countBack } = periodParams;


          try {
            let { data, error } = await fetchPoolPriceData(poolAddress, from, to, countBack, invertPrice, useUniswapSubgraph ? arbitrumClient : limitlessClient);
            const noData = !data || data.length === 0;
            if (error) {
              console.error("subgraph error: ", error, data);
              return onErrorCallback("Unable to load historical data!");
            }
            console.log(`[getBars]: returned ${data.length} bar(s)`, data[0]);
            onHistoryCallback(data, { noData });
          } catch (err) {
            onErrorCallback("Unable to load historical data!");
          }
        },
        subscribeBars: async (
          symbolInfo: SymbolInfo,
          resolution: ResolutionString,
          onRealtimeCallback: SubscribeBarsCallback,
          _subscribeUID: string,
          onResetCacheNeededCallback: () => void
        ) => {
          console.log('[subscribeBars]: Method call with subscriberUID:', _subscribeUID);
        },
        unsubscribeBars: (subscriberUID: any) => {
          console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
        },
      }
    }
  }, [chainId]);
}
