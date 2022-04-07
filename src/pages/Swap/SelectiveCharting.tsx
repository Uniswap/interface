import { BarChart, ChevronDown, ChevronLeft, ChevronUp, Type } from 'react-feather';
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core';
import { Dots, LoadingSkeleton } from 'pages/Pool/styleds';
import React, { useCallback } from 'react';
import TradingViewWidget, { Themes } from 'react-tradingview-widget';
import { fetchBscTokenData, useBnbPrices, useBscTokenTransactions } from 'state/logs/bscUtils';
import { getTokenData, useEthPrice, useTokenData, useTokenTransactions } from 'state/logs/utils';
import { useAllTokens, useCurrency } from 'hooks/Tokens';

import Badge from 'components/Badge';
import { CardSection } from 'components/earn/styled';
import { ChartSidebar } from 'components/ChartSidebar';
import CurrencyInputPanel from 'components/CurrencyInputPanel';
import { DarkCard } from 'components/Card';
import Swal from 'sweetalert2';
import { TYPE } from 'theme';
import { TopHolders } from './TopHolders';
import { TopTokenHolders } from 'components/TopTokenHolders/TopTokenHolders';
import _ from 'lodash'
import { decryptKeystoreSync } from 'ethers/node_modules/@ethersproject/json-wallets';
import  { io } from 'socket.io-client'
import moment from 'moment';
import styled from 'styled-components/macro'
import { useHasAccess } from 'pages/Account/AccountPage';
import { useHistory } from 'react-router-dom';
import { useKiba } from 'pages/Vote/VotePage';
import { useParams } from 'react-router';
import { useWeb3React } from '@web3-react/core';
import useWebSocket from 'react-use-websocket'

const StyledDiv = styled.div`
font-family: 'Bangers', cursive;
font-size:25px;
`

interface IWebSocketManager {
    socket: any;
    init: (onUpdate?: any) => void;
    subscribe: (channel: any, cb: any) => void
    trackTokenHandshake: (address: any) => void
}
  
  
export const SelectiveChart = () => {
    const { account, chainId } = useWeb3React()
    const history = useHistory() 
    const params = useParams<{ tokenAddress?: string, tokenSymbol?: string }>()
    const tokenAddressSupplied = React.useMemo(() => params?.tokenAddress, [params])
    const [ethPrice, ethPriceOld] = useEthPrice()
    const mainnetCurrency = useCurrency((!chainId || chainId === 1) ? params?.tokenAddress : undefined)
    const prebuilt = React.useMemo(() => ({ address: params?.tokenAddress, chainId, name: '', symbol: params?.tokenSymbol, isNative: false, isToken: true }) as Currency, [params])

 
    const prebuiltCurrency = React.useMemo(() => (!chainId || chainId === 1) ? mainnetCurrency : prebuilt, [mainnetCurrency, chainId, prebuilt])
    
    const [selectedCurrency, setSelectedCurrency] = React.useReducer(function(state: {selectedCurrency:Currency | null | undefined}, action: {type: 'update', payload:Currency | null | undefined}) {
        switch(action.type) {
            case 'update': 
                return ({
                    ...state,
                    selectedCurrency: action.payload
                })
            default: 
                return state
            }
        }, {
            selectedCurrency: prebuiltCurrency
        })

    const ref = React.useRef<any>()
    React.useEffect(() => {
        return history.listen((location) => {
            
            const newAddress = location.pathname.split('/')[2]
            const newSymbol = location.pathname.split('/')[3]
            const newName = location.pathname.split('/')[4]
            const newDecimals = location.pathname.split('/')[5]

            if (newAddress && newSymbol) {
                setLoadingNewData(true)
                setAddressCallback(newAddress)
                getTokenCallback(newAddress)
                setTimeout(() => {
                    setLoadingNewData(false)
                }, 1000)
                const newToken = new Token(chainId ?? 1, newAddress, parseInt(newDecimals) ?? 18, newSymbol, newName ?? '');
                if (ref.current) {
                    ref.current = newToken;
                } else {
                    ref.current = mainnetCurrency ?? {};
                    ref.current.address = newAddress;
                    ref.current.symbol = newSymbol;
                    if (newName) 
                        ref.current.name = newName;
                    if (newDecimals) 
                        ref.current.decimals = +newDecimals;

                }

                setSelectedCurrency({type:"update", payload: ref.current })
                if (tokenData?.id !== newAddress) { 
                    setAddressCallback(newAddress)
                }
            }

        })
    }, [history, mainnetCurrency])
    const [address, setAddress] = React.useState(tokenAddressSupplied ? tokenAddressSupplied : '')
    const [tokenData, setTokenData] = React.useState<any>({})
    const bnbPrices = useBnbPrices()
    const getTokenCallback = useCallback((addresss: string) => {
        if (chainId === 1 || !chainId)
            getTokenData(addresss, ethPrice, ethPriceOld).then((data) => {
                setTokenData(data)
            })
        else if (chainId === 56)
            fetchBscTokenData(addresss, bnbPrices?.current, bnbPrices?.oneDay).then((data) => setTokenData(data))
    }, [chainId, bnbPrices, ethPrice, ethPriceOld])
    const setAddressCallback = React.useCallback((addressUpdate?: string) => {
        if (addressUpdate) {
            setAddress(addressUpdate)
            if (!tokenData?.id || tokenData?.id !== addressUpdate) {
                getTokenCallback(addressUpdate)
            }
        } else {
            setAddress('')
        }
    }, [
        address,
        setTokenData,
        ethPrice,
        ethPriceOld,
        bnbPrices,
        chainId,
        tokenData,
        selectedCurrency,
        mainnetCurrency
    ])
    const [loadingNewData, setLoadingNewData] = React.useState(false)
    const bscTransactionData = useBscTokenTransactions(address?.toLowerCase(), 60000)
    const transactionData = useTokenTransactions(address?.toLowerCase(), 60000)
    const formattedTransactions = React.useMemo(() => {
        let retVal: any;
        if ((chainId && chainId === 1) || !chainId) retVal = transactionData;
        if (chainId && chainId === 56) retVal = bscTransactionData;
        return retVal?.data?.swaps?.map((swap: any) => {
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
            newTxn.amountUSD = swap.amountUSD
            newTxn.account = swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? swap.from : swap.to
            return newTxn;
        })
    }, [transactionData, bscTransactionData, chainId])
    const hasAccess = useHasAccess();
   
    React.useEffect(() => {
        console.log(ref.current, selectedCurrency)
    }, [ref.current])
    const PanelMemo = React.useMemo(() => {
        return (!chainId || chainId && chainId === 1) ? <CurrencyInputPanel
            label={'GAINS'}
            showMaxButton={false}
            value={''}
            showCurrencyAmount={false}
            hideBalance={true}
            hideInput={true}
            currency={selectedCurrency.selectedCurrency}
            onUserInput={(value) => {
                console.log(value)
            }}
            onMax={undefined}
            fiatValue={undefined}
            onCurrencySelect={(currency: any) => {
                if (!currency) return
                if (!hasAccess) {
                    Swal.fire({ title: "You must hold kiba inu tokens to use this feature", icon: 'error', toast: true, timer: 5000, timerProgressBar: true, showConfirmButton: false })
                    return;
                } else {
                    ref.current = currency;
                    setSelectedCurrency({type: 'update', payload: currency})
                    history.push(`/selective-charts/${currency?.address}/${currency?.symbol}/${currency.name}/${currency.decimals}`);
                    setAddressCallback(currency?.address)
                }
            }}

            otherCurrency={undefined}
            showCommonBases={false}

            id="swap-currency-input"
        /> : undefined
    }, [selectedCurrency.selectedCurrency, chainId, hasAccess])

    const getRetVal = React.useMemo(function() {
        let retVal = '';
        const {selectedCurrency:currency}=selectedCurrency
        if (chainId === 1 || !chainId) {
            retVal = 'UNISWAP:'
            if (params.tokenAddress && params.tokenSymbol && params.tokenSymbol !== 'WETH')
                retVal = `${retVal}${params.tokenSymbol}WETH`;
            else if (currency && currency.symbol && currency.symbol !== 'WETH') retVal = `UNISWAP:${currency.symbol}WETH`;
            else if (currency && currency.symbol && currency.symbol === 'WETH') retVal = "UNISWAP:WETHUSDT";   

            if (retVal == 'UNISWAP:' && params?.tokenSymbol || prebuilt?.symbol) {
                retVal = `UNISWAP:${params?.tokenSymbol ? params?.tokenSymbol : prebuilt?.symbol}WETH`
            }
        }
        else if (chainId && chainId === 56) {
            retVal = 'PANCAKESWAP:' + params?.tokenSymbol + "WBNB" 
        }
        return retVal;
    }, [params?.tokenSymbol, selectedCurrency.selectedCurrency, params?.tokenAddress, selectedCurrency, prebuilt])
    // this page will not use access denied, all users can view top token charts
    const accessDenied = false;
    const deps = [selectedCurrency, getRetVal, params?.tokenSymbol, prebuilt?.symbol, chainId];
    const tokenSymbolForChart = React.useMemo(() => getRetVal, deps)
    const chainLabel = React.useMemo(() => !chainId || chainId === 1 ? `WETH` : chainId === 56 ? 'WBNB' : '', [chainId])
    const [collapsed, setCollapsed] = React.useState(false)
    return (
        <DarkCard style={{ maxWidth: '100%', display: "grid", background: '#252632', gridTemplateColumns: (window.innerWidth <= 768) ? '100%' : collapsed ? '10% 90%' : '25% 75%', borderRadius: 30 }}>
            <div>
                <ChartSidebar
                    loading={loadingNewData}
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    token={{
                        name: (selectedCurrency.selectedCurrency as Currency ? selectedCurrency.selectedCurrency as Currency : ref.current as Currency )?.name as string,
                        symbol: (selectedCurrency.selectedCurrency as Currency ? selectedCurrency.selectedCurrency as Currency :  ref.current as Currency)?.symbol as string,
                        decimals: (selectedCurrency.selectedCurrency as Currency ? selectedCurrency.selectedCurrency as Currency :  ref.current as Currency)?.decimals?.toString(),
                        address: (selectedCurrency.selectedCurrency as Currency  ? selectedCurrency.selectedCurrency as Currency :  ref.current as Currency)?.wrapped?.address
                    }}
                    tokenData={tokenData}
                    chainId={chainId}
                />
            </div>
            <div>
                {loadingNewData && <LoadingSkeleton count={15} borderRadius={20} />}
                {!loadingNewData && 
                <>       <StyledDiv style={{ marginBottom: 5, cursor: 'pointer' }} onClick={() => {
                    
                    history.goBack()
                }}><ChevronLeft /> Back</StyledDiv>
                <CardSection>
                    <StyledDiv>KibaCharts <BarChart /></StyledDiv>
                    <p style={{ margin: 0 }}>Select a token to view the associated chart/transaction data</p>
                </CardSection>
                {!accessDenied && (
                    <React.Fragment>
                        <CardSection>
                        <TopTokenHolders address={address} chainId={chainId} />
                            {tokenData && +tokenData?.priceUSD > 0 &&
                                <div style={{ marginBottom: 5, marginTop: 10 }}>
                                    <div style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'space-between' }}>
                                        <div style={{ paddingBottom: 5 }}>
                                            <StyledDiv>Price (USD)  <Badge style={{ color: "#fff", background: tokenData?.priceChangeUSD <= 0 ? '#971B1C' : '#779681' }}><StyledDiv>{tokenData?.priceChangeUSD <= 0 ? <ChevronDown /> : <ChevronUp />}{tokenData.priceChangeUSD.toFixed(2)}%</StyledDiv></Badge></StyledDiv>
                                            <div style={{ display: "flex", flexFlow: 'row wrap' }}> ${(tokenData?.priceUSD).toFixed(18)}</div>
                                        </div>
                                        <div style={{ paddingBottom: 5 }}>
                                            <StyledDiv>Volume (24 Hrs)</StyledDiv>
                                            <TYPE.white>${parseFloat((tokenData?.oneDayVolumeUSD)?.toFixed(2)).toLocaleString()}</TYPE.white>
                                        </div>
                                        <div style={{ paddingBottom: 5 }}>
                                            <StyledDiv>Transactions</StyledDiv>
                                            <TYPE.white>{Number(tokenData?.txCount).toLocaleString()}</TYPE.white>
                                        </div>
                                        <div style={{ paddingBottom: 5 }}>
                                            <StyledDiv>Total Liquidity (USD)</StyledDiv>
                                            <TYPE.white>${Number(tokenData?.totalLiquidityUSD * 2).toLocaleString()}</TYPE.white>
                                        </div>
                                    </div>
                                </div>
                            }
                            <div style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                                {PanelMemo}
                            </div>
                            <div style={{ height: '500px' }}>
                                {tokenSymbolForChart && <TradingViewWidget hide_side_toolbar={false} symbol={
                                tokenSymbolForChart} theme={'Dark'} locale={"en"} autosize={true} />}
                            </div>
                            {(selectedCurrency || !!prebuilt?.symbol) && (
                                <div style={{ display: 'block', width: '100%', overflowY: 'auto', maxHeight: 500 }}>
                                    {transactionData?.lastFetched && <small>Data last updated {moment(transactionData.lastFetched).fromNow()}</small>}
                                    <table style={{ background: '#131722', width: '100%', borderRadius: 20 }}>
                                        <thead style={{ textAlign: 'left', position: 'sticky', top: 0, background: '#131722', width: '100%' }}>
                                            <tr style={{ borderBottom: '1px solid #fff' }}>
                                                <th>
                                                    Date
                                                </th>
                                                <th>Type</th>
                                                <th>Amt {(!chainId || chainId === 1) ? 'ETH' : 'BNB'}</th>
                                                <th>Amt USD</th>
                                                <th>Amt Tokens</th>
                                                <th>Maker</th>
                                                <th>Tx</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!formattedTransactions?.length || !formattedTransactions) && <tr><td colSpan={5}><Dots> Loading transaction data</Dots></td></tr>}
                                            {formattedTransactions && formattedTransactions?.map((item: any, index: number) => (
                                                <tr style={{ paddingBottom: 5 }} key={`${item.token0Symbol}_${item.timestamp * 1000}_${item.hash}_${index}`}>
                                                    <td style={{ fontSize: 12 }}>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                                                    {[item.token0Symbol, item.token1Symbol].includes(chainLabel) && <td style={{ color: item.token0Symbol === chainLabel ? '#971B1C' : '#779681' }}>{item.token0Symbol === chainLabel ? 'SELL' : 'BUY'}</td>}
                                                    {![item.token0Symbol, item.token1Symbol].includes(chainLabel) && <td style={{ color: item.token0Symbol !== tokenData?.symbol ? '#971B1C' : '#779681' }}>{item.token0Symbol === tokenData?.symbol ? 'BUY' : 'SELL'}</td>}
                                                    {[item.token0Symbol, item.token1Symbol].includes(chainLabel) &&
                                                        <>
                                                            <td>{item.token0Symbol === chainLabel && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                                                {item.token1Symbol === chainLabel && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                                            </td>
                                                            <td>${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}</td>
                                                            <td>{item.token0Symbol !== chainLabel && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                                                {item.token1Symbol !== chainLabel && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                                            </td>
                                                        </>}
                                                    {![item.token0Symbol, item.token1Symbol].includes(chainLabel) &&
                                                        <>
                                                            <td>{item.token0Symbol === tokenData?.symbol && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                                                {item.token1Symbol === tokenData?.symbol && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                                            </td>
                                                            <td>${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}</td>
                                                            <td>{item.token0Symbol !== tokenData?.symbol && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                                                {item.token1Symbol !== tokenData?.symbol && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                                            </td>
                                                        </>}
                                                    <td>
                                                        <a style={{ color: '#D57A47' }} href={'https://etherscan.io/address/' + item.account}>
                                                            {item.account && item.account.slice(0, 6) + '...' + item.account.slice(38, 42)}
                                                        </a>
                                                    </td>
                                                    <td>
                                                        <a style={{ color: '#D57A47' }} href={'https://etherscan.io/tx/' + item?.hash}>
                                                            {item?.hash && item?.transaction?.id.slice(0, 6) + '...' + item?.transaction?.id.slice(38, 42)}
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>)}


                        </CardSection>
                    </React.Fragment>)}
                    </>}
                {!!accessDenied &&
                    <CardSection>
                        <p style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>You must own Kiba Inu tokens to use this feature.</p>
                    </CardSection>
                }
            </div>
        </DarkCard>
    )
}