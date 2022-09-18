import { useIsDarkMode, useUserLocale } from "state/user/hooks";

import Loader from "components/Loader";
import React from "react";
import TradingViewWidget from "react-tradingview-widget";
import _ from "lodash";
import styled from 'styled-components/macro'
import { toChecksum } from "state/logs/utils";
import { useActiveWeb3React } from "hooks/web3";
import { useParams } from "react-router-dom";
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  *, >* {
    .css-14hxyhp {
      display: none !important
    }
  }
`
type ChartProps = {
  symbol: string;
  address: string;
  pairData?: any[];
  height?: number;
  pairAddress?: string;
  tokenSymbolForChart?:string;
  networkProvided?:string
}

const areChartPropsEqual = (oldProps: ChartProps, newProps: ChartProps) => newProps.symbol == oldProps.symbol && newProps.pairAddress?.toLowerCase() == oldProps.pairAddress?.toLowerCase() && newProps.address?.toLowerCase() == oldProps.address?.toLowerCase()
export const ChartComponent = React.memo(
  (props: ChartProps) => {
    const { chainId } = useActiveWeb3React()
    const { height, networkProvided, address, pairAddress: pairAddy, symbol, pairData } = props;

    const pairAddress = React.useMemo(() => {
      if (pairAddy) return pairAddy
      if (!pairData?.length) return
      const pairId = pairData?.[0]?.id
      return pairId
    }, [pairData, symbol, pairAddy])

    const chartURL = React.useMemo(() => {
      const network = networkProvided ? networkProvided : !chainId || chainId == 1 ? 'ethereum' : chainId == 56 ? 'bsc' : 'ethereum'
      console.log(`[chartURL]`, network)
      return `https://dexscreener.com/${network}/${toChecksum(pairAddress)}?embed=1&trades=0&info=0`
    }, [chainId, networkProvided, pairAddress])

    const heightForChart = height ? height : 410
    const darkMode = useIsDarkMode()
    const theme = useTheme()
    if (!pairAddress) {
      return (
        <div style={{color: theme.text1, display:  'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader />
          Loading Chart..
        </div>
      )
    }

    return (
      <Wrapper style={{ overflow: 'hidden', height: heightForChart }}>
        <iframe src={chartURL} style={{ zIndex: 1, background: 'transparent', border: '1px solid transparent', height: 450, borderRadius: 4, width: '100%' }} />
      </Wrapper>
    );
  },
  areChartPropsEqual
);

ChartComponent.displayName = 'Chart'