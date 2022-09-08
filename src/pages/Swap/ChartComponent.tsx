import { useIsDarkMode, useUserLocale } from "state/user/hooks";

import Loader from "components/Loader";
import React from "react";
import TradingViewWidget from "react-tradingview-widget";
import _ from "lodash";
import styled from 'styled-components/macro'
import { useActiveWeb3React } from "hooks/web3";

const Wrapper = styled.div `
  *, >* {
    .css-14hxyhp {
      display: none !important
    }
  }
`
export const ChartComponent = React.memo(
    (props: {
      symbol: string;
      address: string;
      tokenSymbolForChart: string;
      pairData?: any[];
      height?:number;
      pairAddress?:string;
    }) => {
      const {chainId} = useActiveWeb3React()
      const { height, address, pairAddress: pairAddy,  symbol, tokenSymbolForChart, pairData } = props;
      
      const pairAddress = React.useMemo(() => {
        if (!pairData?.length || pairAddy) {
          return pairAddy
        }
        
        const pairId = pairData?.[0]?.id
        return pairId
      }, [pairData, symbol, pairAddy])
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

      const chartURL = React.useMemo(() => {
        const network = !chainId || chainId == 1 ? 'ethereum' : chainId == 56 ? 'bsc' : 'eth'
        return `https://dexscreener.com/${network}/${pairAddress}?embed=1&trades=0&info=0`
      }, [chainId, pairAddress])
      const heightForChart  =  height ? height : 410

        const darkMode = useIsDarkMode()
        if (!pairAddress) {
          return (
            <div style={{display:'flex', alignItems:'center', justifyContent:'  ', gap: 10}}>
              <Loader />
              Loading Chart..
            </div>
          )
        }

      return (
        <Wrapper style={{overflow: 'hidden', height: heightForChart }}>
          <iframe src={chartURL} style={{ zIndex: 1, background:'transparent', border:'1px solid transparent', height: 450, borderRadius: 4, width: '100%'}} />
        </Wrapper>
      );
    },
    _.isEqual
  );

  ChartComponent.displayName = 'Chart'