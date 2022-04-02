import { useWeb3React } from '@web3-react/core';
import Badge from 'components/Badge';
import _ from 'lodash';
import { useKiba } from 'pages/Vote/VotePage';
import React from 'react';
import { ChevronRight, X } from 'react-feather';
import { useTokenTransactions, useTokenData, useEthPrice,  getTokenData } from 'state/logs/utils';
import styled from 'styled-components/macro';
import { StyledInternalLink } from 'theme';

const StyledDiv = styled.div`
font-family: 'Bangers', cursive;
font-size:25px;
`
const TransactionList = React.memo(({transactions, tokenData}:{transactions:any, tokenData:any}) => {
    
    const price = React.useMemo(() => tokenData?.priceUSD,[tokenData?.priceUSD])
    const formattedTransactions = transactions?.swaps?.map((swap: any) => {
        const netToken0 = swap.amount0In - swap.amount0Out
        const netToken1 = swap.amount1In - swap.amount1Out
        const newTxn: Record<string, any> = {}
        if (netToken0 < 0) {
            newTxn.token0Symbol = (swap.pair).token0.symbol
            newTxn.token1Symbol = (swap.pair).token1.symbol
            newTxn.token0Amount = Math.abs(netToken0)
            newTxn.token1Amount = Math.abs(netToken1)
        } else if (netToken1 < 0) {
            newTxn.token0Symbol = (swap.pair).token1.symbol
            newTxn.token1Symbol = (swap.pair).token0.symbol
            newTxn.token0Amount = Math.abs(netToken1)
            newTxn.token1Amount = Math.abs(netToken0)
        }
        newTxn.transaction = swap.transaction;
        newTxn.hash = swap.transaction.id
        newTxn.timestamp = swap.transaction.timestamp
        newTxn.type = 'swap'
        newTxn.amountUSD = swap.amountUSD;
        newTxn.account = swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? swap.from : swap.to
        return newTxn;
    })
    return (
        <>
            <StyledDiv style={{ width: '100%', display: 'flex', justifyContent:'space-between', paddingTop: 15, paddingBottom: 5 }}>{tokenData?.name} ({tokenData?.symbol}) <br /> {(+price?.toFixed(18))} {tokenData?.totalLiquidityUSD && <small>(Total Liquidity ${Number(tokenData.totalLiquidityUSD * 2).toLocaleString()})</small>}</StyledDiv>
            <div style={{ display: 'block', width: '100%', overflowY: 'auto', maxHeight: 500 }}>
                <table style={{ width: '100%' }}>
                    <thead style={{ textAlign: 'left', position: 'sticky', top:0, background:'#222' }}>
                        <tr>
                            <th>
                                Date
                            </th>
                            <th>Type</th>
                            <th>
                                Amount ETH
                            </th>
                            <th>
                                Amount USD
                            </th>
                            <th>Amount Tokens</th>
                            <th>Maker</th>
                            <th>Tx</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!formattedTransactions?.length && <tr><td colSpan={5}>Loading transaction data...</td></tr>}
                        {formattedTransactions && formattedTransactions?.map((item: any, index: number) => (
                            <tr key={`_${item.timestamp * 1000}_${item.hash}_${index}`}>
                                <td style={{ fontSize: 12 }}>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                                <td style={{ color: item.token0Symbol === 'WETH' ? 'red' : 'green' }}>{item.token0Symbol === 'WETH' ? 'SELL' : 'BUY'}</td>
                                <td>{item.token0Symbol === 'WETH' && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                    {item.token1Symbol === 'WETH' && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                </td>
                                <td>${Number(item.amountUSD).toFixed(2).toLocaleString()}</td>
                                <td>{item.token0Symbol !== 'WETH' && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                    {item.token1Symbol !== 'WETH' && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                </td>  <td>
                                    <a href={'https://etherscan.io/address/' + item.account}>
                                        {item.account && item.account.slice(0, 6) + '...' + item.account.slice(38, 42)}
                                    </a>
                                </td>
                                <td>
                                    <a href={'https://etherscan.io/tx/' + item?.hash}>
                                        {item?.hash && item?.transaction?.id.slice(0, 6) + '...' + item?.transaction?.id.slice(38, 42)}
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}, _.isEqual)  
TransactionList.displayName = 'TxnList';

export const ChartPage = () => {
    const web3Data = useWeb3React();
    const kibaBalance = useKiba(web3Data?.account)
    const [tokenData, setTokenData] = React.useState<any>({})
    const [ethPrice, ethPriceOld] = useEthPrice()

    React.useEffect(( ) => {
        if (!tokenData?.symbol && ethPrice && ethPriceOld) {
            getTokenData('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', ethPrice, ethPriceOld).then((data) => 
            {
                setTokenData(data)
                setSymbol(data?.symbol)
            })
        }
    }, [tokenData, ethPrice, ethPriceOld])
    const transactions = useTokenTransactions('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', 300000)
    const isBinance = web3Data?.chainId && web3Data?.chainId === 56
    const accessDenied = !web3Data?.account || (!kibaBalance) || (+kibaBalance?.toFixed(0) <= 0)
    const [symbol, setSymbol] = React.useState('')

    const FrameWrapper = styled.div`
        padding:9px 14px;
        width:100%;
        display:flex;
        flex-flow:column wrap;
        max-width:1000px;
        overflow-y:auto;
    `

    const [view, setView] = React.useState<'chart'>('chart')
    const frameURL = React.useMemo(() => `https://www.tradingview.com/widgetembed/?symbol=UNISWAP:${symbol}WETH&interval=4H&hidesidetoolbar=0&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`, [symbol])


    return (
        <FrameWrapper style={{ background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))' }} >
            <div style={{ display: 'block', marginBottom: 5, width: '100%', padding: "9px 14px" }}>
                <div style={{ display: 'flex', marginBottom: 5, alignItems: 'center', flexFlow: "row wrap" }}>
                    <a style={{ marginRight: 15 }} href="https://www.dextools.io/app/ether/pair-explorer/0xac6776d1c8d455ad282c76eb4c2ade2b07170104">
                        <img src={'https://miro.medium.com/max/663/1*eV5_P4s2WQkgzVM_XdgWSw.png'}
                            style={{ maxWidth: 100 }} />
                    </a>
                    <a href={'https://app.moontools.io/pairs/uniswap/0xac6776d1c8d455ad282c76eb4c2ade2b07170104'} style={{ marginRight: 15 }}>
                        <img src={'https://miro.medium.com/max/440/1*rtdc0fgltZdBep3miLuSuQ.png'}
                            style={{ maxWidth: 100 }} />
                    </a>
                    <a href={'https://coingecko.com/en/coins/kiba-inu'} style={{ marginRight: 15 }}>
                        <img src={'https://cdn.filestackcontent.com/MKnOxRS8QjaB2bNYyfou'}
                            style={{ maxWidth: 30 }} />
                    </a>
                    <a href={'https://coinmarketcap.com/en/currencies/kiba-inu'} style={{ marginRight: 15 }}>
                        <img src={'https://doostoken.com/assets/images/site/brand/new/png/coinmarketcap.png'}
                            style={{ maxWidth: 30 }} />
                    </a>
                    {!isBinance && <Badge style={{color:"#fff", textDecoration:'none'}}>ETH: ${ethPrice &&(+ethPrice)?.toFixed(2)}</Badge>}
                </div>
                {isBinance && <StyledDiv>Binance Charts &amp; Trade Data Coming Soon</StyledDiv>}

                {accessDenied && <div style={{ width: '100%', padding: '9px 14px', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><StyledDiv style={{ color: "#222" }}>You must own Kiba Inu tokens to use this feature.</StyledDiv></div>}
                {accessDenied === false &&
                <> <div style={{ display: 'flex', justifyContent:'space-between', marginBottom: 15, flexFlow: 'row wrap' }}>
                    <StyledDiv onClick={() => setView('chart')} style={{
                        cursor: 'pointer',
                        marginRight: 10,
                        textDecoration: view === 'chart' ? 'underline' : ''
                    }}>KibaCharts</StyledDiv>
                  {!isBinance &&  <StyledDiv style={{alignItems:'center',display:'flex',color:"#FFF"}}>
                        <StyledInternalLink style={{fontSize:25,color:"#FFF"}} to="/selective-charts">View Charts for Other Tokens </StyledInternalLink><ChevronRight /> <Badge>Beta</Badge>
                    </StyledDiv>}
                </div>

                 <>            {transactions?.swaps?.length && tokenData && tokenData?.priceUSD && symbol && <div style={{width:'100%',marginTop:'0.5rem',marginBottom:'0.25rem'}}><iframe src={frameURL} style={{ height: 471, width: '100%', border: '1px solid #222' }} /></div>}
<div style={{ height: 500, width: '100%', overflowY: 'auto', padding: '9px 14px', background: '#222', color: '#fff', borderRadius: 6, display: 'table', flexFlow: 'column wrap', gridColumnGap: 50 }}>
                    <TransactionList transactions={transactions} tokenData={tokenData} />
                </div></>
                </>}
            </div>

        </FrameWrapper>
    )
}
