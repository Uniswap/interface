import { Currency } from '@uniswap/sdk-core';
import Badge from 'components/Badge';
import { DarkCard } from 'components/Card';
import CurrencyInputPanel from 'components/CurrencyInputPanel';
import { CardSection } from 'components/earn/styled';
import React from 'react'; import { BarChart, ChevronDown, ChevronLeft, ChevronUp, Type } from 'react-feather';
import { getTokenData, useEthPrice, useTokenData, useTokenTransactions } from 'state/logs/utils';
import styled from 'styled-components/macro'
import { TYPE } from 'theme';
import { formattedFeeAmount } from 'utils';
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount';
export const SelectiveChart = () => {
    const [ethPrice,ethPriceOld] = useEthPrice()
    const [selectedCurrency, setSelectedCurrency] = React.useState<Currency | undefined>()
    const [address, setAddress] = React.useState('')
    const [tokenData,setTokenData] = React.useState<any>({})
    const setAddressCallback = React.useCallback((address?: string) => {
        if (address) {
            setAddress(address)
            getTokenData(address, ethPrice, ethPriceOld).then((data) => {
                setTokenData(data)
              })
        } else {
            setAddress('')
        }   
    },[address, ethPrice, ethPriceOld])
    const transactions = useTokenTransactions(address?.toLowerCase())
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
        newTxn.amountUSD = swap.amountUSD
        newTxn.account = swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ? swap.from : swap.to
        return newTxn;
    })
    const StyledDiv = styled.div`
font-family: 'Bangers', cursive;
font-size:25px;
`
    const frameURL = React.useMemo(() => `https://www.tradingview.com/widgetembed/?symbol=UNISWAP:${tokenData.symbol}WETH&interval=4H&hidesidetoolbar=0&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`, [selectedCurrency, tokenData])
    return (
        <DarkCard style={{ maxWidth: 900, background: 'radial-gradient(rgba(235,91,44,.91), rgba(129,3,3,.95))', display: 'flex', flexFlow: 'column wrap' }}>
            <CardSection>
            <StyledDiv style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => window.history.back()}><ChevronLeft /> Back</StyledDiv>
                <StyledDiv>KibaCharts <BarChart /></StyledDiv>
                
                <p style={{ margin: 0 }}>Select a token to view the associated chart/transaction data</p>
            </CardSection>
            <CardSection>
                {tokenData && tokenData?.priceUSD && <div style={{ marginBottom: 5 }}>

                    <div style={{ display: 'flex', flexFlow:'row wrap', justifyContent: 'space-between' }}>
                        <div style={{paddingBottom:5}}>
                            <StyledDiv>Price (USD)  <Badge style={{ color:"#fff", background:tokenData?.priceChangeUSD <= 0 ? "red" : 'green'}}><StyledDiv>{tokenData?.priceChangeUSD <= 0 ? <ChevronDown /> : <ChevronUp />}{tokenData.priceChangeUSD.toFixed(2)}%</StyledDiv></Badge></StyledDiv>
                           <div style={{display:"flex", flexFlow:'row wrap'}}> ${(tokenData?.priceUSD).toFixed(18)}</div>
                        </div>
                        <div style={{paddingBottom:5}}>
                            <StyledDiv>Volume (24 Hrs)</StyledDiv>
                            <TYPE.white>${Number((+tokenData?.oneDayVolumeUSD)?.toFixed(2)).toLocaleString()}</TYPE.white>
                        </div>
                        <div style={{paddingBottom:5}}>
                            <StyledDiv>Transactions</StyledDiv>
                            <TYPE.white>{Number(tokenData?.txCount).toLocaleString()}</TYPE.white>
                        </div>
                        <div style={{paddingBottom:5}}>
                            <StyledDiv>Total Liquidity (USD)</StyledDiv>
                            <TYPE.white>${Number(tokenData?.totalLiquidityUSD * 2).toLocaleString()}</TYPE.white>
                        </div>
                    </div>
                </div>}
                <div style={{marginTop:'0.25rem', marginBottom:'0.25rem'}}>
                <CurrencyInputPanel
                    label={'GAINS'}
                    showMaxButton={false}
                    value={''}
                    showCurrencyAmount={false}
                    hideBalance={true}
                    hideInput={true}
                    currency={selectedCurrency}
                    onUserInput={(value) => {
                        console.log(value)
                    }}
                    showOnlyTrumpCoins={false}
                    onMax={undefined}
                    fiatValue={undefined}
                    onCurrencySelect={(currency: any) => {
                        setSelectedCurrency(currency);
                        setAddressCallback(currency?.address)
                    }}
                    otherCurrency={undefined}
                    showCommonBases={false}

                    id="swap-currency-input"
                />
                </div>

            {tokenData && tokenData?.symbol && <div style={{width:'100%',marginTop:'0.5rem',marginBottom:'0.25rem'}}><iframe src={frameURL} style={{ height: 471, width: '100%', border: '1px solid #222' }} /></div>}

            {tokenData && selectedCurrency && (
                <div style={{ display: 'block', width: '100%', overflowY: 'auto', maxHeight: 500 }}>
                    <table style={{ background: '#222', width: '100%' }}>
                        <thead style={{ textAlign: 'left', position: 'sticky', top: 0, background: '#222', width: '100%' }}>
                            <tr style={{ borderBottom: '1px solid #fff' }}>
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
                            {(!formattedTransactions?.length || !formattedTransactions) && <tr><td colSpan={5}>Loading transaction data...</td></tr>}
                            {formattedTransactions && formattedTransactions?.map((item: any, index: number) => (
                                <tr style={{paddingBottom:5}}  key={`${item.token0Symbol}_${item.timestamp * 1000}_${item.hash}_${index}`}>
                                    <td style={{fontSize: 12 }}>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                                    <td style={{ color: item.token0Symbol === 'WETH' ? 'red' : 'green' }}>{item.token0Symbol === 'WETH' ? 'SELL' : 'BUY'}</td>
                                    <td>{item.token0Symbol === 'WETH' && <>{Number(+item.token0Amount?.toFixed(2))?.toLocaleString()} {item.token0Symbol}</>}
                                        {item.token1Symbol === 'WETH' && <>{Number(+item.token1Amount?.toFixed(2))?.toLocaleString()} {item.token1Symbol}</>}
                                    </td>
                                    <td>${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}</td>
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
                </div>)}
                </CardSection>
        </DarkCard>
    )
}