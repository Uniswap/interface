import { FullScreenIcon, FullScreenWrapper } from "./ChartTable";
import { Maximize, Minimize } from "react-feather";
import { useIsDarkMode, useUserLocale } from "state/user/hooks";

import Loader from "components/Loader";
import React from "react";
import ReactFullscreen from 'react-easyfullscreen';
import TradingViewWidget from "react-tradingview-widget";
import _ from "lodash";
import styled from 'styled-components/macro'
import { toChecksum } from "state/logs/utils";
import { useActiveWeb3React } from "hooks/web3";
import { useParams } from "react-router-dom";
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  *, >* {
    .css-14hxyhp, [data-is-custom-header-element] {
      display: none !important
    }
  }
  [data-is-custom-header-element] {
    display:none !important;
  }
`
type ChartProps = {
  symbol: string;
  address: string;
  pairData?: any[];
  height?: number;
  pairAddress?: string;
  tokenSymbolForChart?: string;
  networkProvided?: string
}

const areChartPropsEqual = (oldProps: ChartProps, newProps: ChartProps) => newProps.symbol == oldProps.symbol && newProps.pairAddress?.toLowerCase() == oldProps.pairAddress?.toLowerCase() && newProps.address?.toLowerCase() == oldProps.address?.toLowerCase()
export const ChartComponent = (props: ChartProps) => {
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

  const darkMode = useIsDarkMode()
  const theme = useTheme()
  const [isMaxxed, setIsMaxxed] = React.useState(false)
  const heightForChart = !isMaxxed ? (height ? height : 410) : '100vh'
  const changeFn = ( newMaxxed: boolean ) => setIsMaxxed(newMaxxed)
  if (!pairAddress) {
    return (
      <div style={{ color: theme.text1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader />
        Loading Chart..
      </div>
    )
  }


  return (
    <FullScreenWrapper onMaxChange={changeFn} childrenFn={({ isMaxxed, ref, onRequest, onExit, isEnabled, onToggle, }) => (
      <Wrapper ref={ref} style={{ overflow: 'hidden', height: heightForChart }}>
        <div style={{ height: 0, width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {FullScreenIcon(isMaxxed, isEnabled, onToggle, onRequest, onExit, {position:'relative', color: '#ccc', top: 20, right: 100})}
        </div>
        <iframe src={chartURL} style={{ zIndex: 1, background: 'transparent', border: '1px solid transparent', height: (typeof heightForChart == 'number' ? heightForChart + 40 : '105vh'), borderRadius: 4, width: '100%' }} />
      </Wrapper>
    )} />
  );
}
