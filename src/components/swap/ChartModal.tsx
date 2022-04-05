
import Modal from 'components/Modal';
import React from 'react'
import { useTokenData, useTokenTransactions } from 'state/logs/utils';
import styled from 'styled-components/macro';
import _ from 'lodash';
import { X } from 'react-feather';
import { useWeb3React } from '@web3-react/core';
import { useKiba } from 'pages/Vote/VotePage';
import { Dots } from 'pages/Pool/styleds';
import moment from 'moment';
import { useHasAccess } from 'components/AccountPage/AccountPage';
const FrameWrapper = styled.div`
    padding:9px 14px;
    height:540px;
    width:100%;
`
const StyledDiv = styled.div`
    font-family: 'Bangers', cursive;
    font-size:25px;
`
export const ChartModal = React.memo(({ isOpen, onDismiss }: { isOpen: boolean, onDismiss: () => void }) => {
    const web3Data = useWeb3React();
    const kibaBalance = useKiba(web3Data.account)
    const isBinance = web3Data.chainId && web3Data.chainId === 56
    const hasAccess = useHasAccess()
    const accessDenied = !hasAccess
    const transactionData = useTokenTransactions('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', 60000)
    const Frame = accessDenied ? null : (
        <iframe id={'tradingview_5aace'} src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_5aace&symbol=UNISWAP:KIBAWETH&interval=4H&hidesidetoolbar=0&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
            style={{
                height: 500, width: '100%', border: '1px solid #222'
            }}

        />
    );
    const tokenData = useTokenData(`0x4b2c54b80b77580dc02a0f6734d3bad733f50900`)

    const [view, setView] = React.useState<'chart' | 'stats'>('chart')
    const transactions = useTokenTransactions('0x4b2c54b80b77580dc02a0f6734d3bad733f50900', 60000)
    const formattedTransactions = React.useMemo(() => transactionData?.data?.swaps?.map((swap: any) => {
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

        newTxn.hash = swap.transaction.id
        newTxn.timestamp = swap.transaction.timestamp
        newTxn.type = 'swap'
        newTxn.amountUSD = swap.amountUSD
        newTxn.account = swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? swap.from : swap.to
        return newTxn;
    }), [transactionData.data]
    )
    if (!isOpen) return null;
    return <Modal maxHeight={600} isOpen={isOpen} onDismiss={() => onDismiss()}>
        <FrameWrapper style={{ background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))' }} >
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <X style={{ cursor: 'pointer' }} onClick={() => onDismiss()} />
            </div>
            {isBinance && <small>Binance Chart coming soon</small>}
            {accessDenied && <div style={{ width: '100%', padding: '9px 14px', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><StyledDiv style={{ color: "#222" }}>You must own Kiba Inu tokens to use this feature.</StyledDiv></div>}
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
                </div>

                <div style={{ display: 'flex', marginBottom: 15, flexFlow: 'row wrap' }}>
                    <StyledDiv onClick={() => setView('chart')} style={{
                        cursor: 'pointer',
                        marginRight: 10,
                        textDecoration: view === 'chart' ? 'underline' : ''
                    }}>Chart</StyledDiv>
                    <StyledDiv onClick={() => setView('stats')} style={{ cursor: 'pointer', marginLeft: 10, textDecoration: view === 'stats' ? 'underline' : '' }}>Transactions</StyledDiv>
                </div>

                {view === 'chart' && <>{Frame}</>}
                {view === 'stats' && accessDenied === false && <div style={{ height: 500, overflowY: 'auto', padding: '9px 14px', background: '#222', color: '#fff', borderRadius: 6, display: 'table', flexFlow: 'column wrap', gridColumnGap: 50 }}>
                    <StyledDiv style={{ width: '100%', display: 'block', paddingTop: 15, paddingBottom: 5 }}>Kiba Inu (KIBA)</StyledDiv>
                    <StyledDiv style={{}}>{tokenData.price}</StyledDiv>



                    <div style={{ display: 'block', overflowY: 'auto', maxHeight: 600 }}>
                        <small>Transactions are ETH only for now. {transactionData?.data?.swaps && `Last updated ${moment(transactionData.lastFetched).fromNow()}`}</small>
                        <table>
                            <thead style={{ textAlign: 'left', position: 'sticky', top: 0, background: '#222' }}>
                                <tr>
                                    <th>
                                        Date
                                    </th>
                                    <th>Type</th>
                                    <th style={{ whiteSpace: 'nowrap' }}>
                                        Amt <small>ETH</small>
                                    </th>
                                    <th>
                                        Amt <small>USD</small>
                                    </th>
                                    <th>Amt Tokens</th>
                                    <th>Maker</th>
                                    <th>Tx</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!formattedTransactions && (
                                    <tr>
                                        <td colSpan={5}> <Dots>Loading transactions</Dots></td>
                                    </tr>
                                )}
                                {isOpen && formattedTransactions && formattedTransactions?.map((item: any, index: number) => (
                                    <tr key={`_${item.timestamp * 1000}_${item.hash}_${index}`}>
                                        <td style={{ fontSize: 12 }}>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                                        <td style={{ color: item.token0Symbol === 'WETH' ? 'red' : 'green' }}>{item.token0Symbol === 'WETH' ? 'SELL' : 'BUY'}</td>
                                        <td>{item.token0Symbol === 'WETH' && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                            {item.token1Symbol === 'WETH' && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                        </td>
                                        <td>${Number(item.amountUSD).toFixed(2).toLocaleString()}</td>
                                        <td>{item.token0Symbol !== 'WETH' && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                            {item.token1Symbol !== 'WETH' && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                        </td>
                                        <td>
                                            <a href={'https://etherscan.io/address/' + item.account}>
                                                {item.account && item.account.slice(0, 6) + '...' + item.account.slice(38, 42)}
                                            </a>
                                        </td>
                                        <td>
                                            <a href={'https://etherscan.io/tx/' + item?.hash}>
                                                {item?.hash && item?.hash.slice(0, 6) + '...' + item?.hash.slice(38, 42)}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>}

            </div>
        </FrameWrapper>
    </Modal>
}, _.isEqual)

ChartModal.displayName = "CHARTMODAL";