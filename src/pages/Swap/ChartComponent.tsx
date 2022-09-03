import { useIsDarkMode, useUserLocale } from "state/user/hooks";

import React from "react";
import TradingViewWidget from "react-tradingview-widget";
import _ from "lodash";

export const ChartComponent = React.memo(
    (props: {
      symbol: string;
      address: string;
      tokenSymbolForChart: string;
      pairData?: any[];
      height?:number;
    }) => {
      const { height, symbol, tokenSymbolForChart, pairData } = props;
      const chartKey = React.useMemo(() => {
        if (symbol && (symbol == "ETH" || symbol == "WETH")) {
          return "UNISWAP:WETHUSDT";
        }
  
        if (pairData && pairData.length) {
          const pairSymbol = `${
            pairData?.[0]?.token0?.symbol?.toLowerCase() === symbol?.toLowerCase()
              ? pairData?.[0]?.token1?.symbol
              : pairData?.[0]?.token0?.symbol
          }`;
          if (pairSymbol === "DAI") return `DOLLAR${symbol.replace("$", "")}DAI`;
          return `UNISWAP:${symbol.replace("$", "") || ""}${pairSymbol}`;
        }
  
        return tokenSymbolForChart ? tokenSymbolForChart : `pair.not.found`;
      }, [pairData, symbol]);

      const heightForChart  =  height ? height : 400
      const symbolForChart = chartKey
        ? chartKey
        : tokenSymbolForChart.replace("$", "");

        const darkMode = useIsDarkMode()
        const locale = useUserLocale()
        const theme = darkMode ? "Dark" : "Light";
      return (
        <div style={{ height: heightForChart }}>
          {symbolForChart && (
            <TradingViewWidget
              hide_side_toolbar={false}
              symbol={symbolForChart}
              theme={theme}
              
              locale={locale || 'en-US'}
              autosize={true}
            />
          )}
        </div>
      );
    },
    _.isEqual
  );

  ChartComponent.displayName = 'Chart'