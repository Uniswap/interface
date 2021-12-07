import { WETH9 } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core';
import Badge, { BadgeVariant } from 'components/Badge';
import { DarkGreyCard } from 'components/Card';
import CurrencyInputPanel from 'components/CurrencyInputPanel';
import { USDC } from 'constants/tokens';
import { LoadingRows } from 'pages/Pool/styleds';
import { routerAbi, routerAddress } from 'pages/Vote/routerAbi';
import { useKiba } from 'pages/Vote/VotePage';
import React from 'react';
import { BarChart2, Minus, Plus } from 'react-feather';
import { useTotalReflections } from 'state/logs/utils';
import styled from 'styled-components/macro'
import Web3 from 'web3'
const PanelHeader = styled.div`
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:15px;
    h1 {
        font-family: "Bangers", cursive;
        font-weight:500;
    }
`

const PanelBody = styled.div`
    margin-top:10px;
    flex-flow:column wrap;
    align-items:center;
    justify-content:start;
    h1 {
        font-family:"Bangers", cursive; 
        font-weight:500;
    }
`
export const LifetimeReflections = () => {
    const [selectedCurrency, setSelectedCurrency] = React.useState()
    const { account, library} = useWeb3React()
    const [address, setAddressCallback] = React.useState('')
    const totalReflections = useTotalReflections(account, address)
    const [totalReflectionsUsd, setTotalReflectionsUsd] = React.useState('')
    const [totalBalanceUsd, setTotalBalanceUsd] = React.useState('')
    const kibaBalance = useKiba(account)
    React.useEffect(() => {
        if (totalReflections && totalReflections.totalGained && totalReflections.totalGained > 0 && library.provider) {
            const provider = library.provider;
            const w3 = new Web3(provider as any).eth;
            const routerContr = new w3.Contract(routerAbi as any, routerAddress);
            const ten9 = 10 ** 9;
            const amount = +totalReflections.totalGained.toFixed(0) * ten9;
            const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
              address,
              WETH9[1].address,
              USDC.address, 
            ]);
            amountsOut.call().then((response: any) => {
              const usdc = response[response.length - 1];
              const ten6 = 10 ** 6;
              const usdcValue = usdc / ten6;
              const number = Number(usdcValue.toFixed(2));
              setTotalReflectionsUsd(number.toLocaleString());
            });
        }
    }, [totalReflections.totalGained, library])

    React.useEffect(() => {
        if (totalReflections && totalReflections.balance && +totalReflections.balance?.toFixed(0) > 0 && library.provider) {
            const provider = library.provider;
            const w3 = new Web3(provider as any).eth;
            const routerContr = new w3.Contract(routerAbi as any, routerAddress);
            const ten9 = 10 ** 9;
            const amount = +totalReflections.balance.toFixed(0) * ten9;
            const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
              address,
              WETH9[1].address,
              USDC.address, 
            ]);
            amountsOut.call().then((response: any) => {
              const usdc = response[response.length - 1];
              const ten6 = 10 ** 6;
              const usdcValue = usdc / ten6;
              const number = Number(usdcValue.toFixed(2));
              setTotalBalanceUsd(number.toLocaleString());
            });
        }
    }, [totalReflections.totalGained, library])
   
    const notAllowed = React.useMemo(() => !account || !kibaBalance || +kibaBalance?.toFixed(0) <= 0,[account, kibaBalance])
    return (
        <DarkGreyCard style={{padding:'10px 20px'}}>
            <PanelHeader>
                <h1>Track total reflections made from any ERC20 token</h1>
                <BarChart2 />
            </PanelHeader>
            <PanelBody>
                {!notAllowed && <>
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
                    id="swap-currency-input-reflections"
                />
                {totalReflections.loading && <LoadingRows>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    <div/>
                    </LoadingRows>}
                {totalReflections?.totalGained && totalReflections.totalGained >= 0 ? <div style={{padding: '9px 14px', border:'1px solid red', marginTop: 15}}>
                    <PanelBody>

                        <div>
                            <h1>Total Bought</h1>
                            <Badge variant={BadgeVariant.DEFAULT}>{totalReflections?.totalBought}</Badge>
                        </div>
                        <div>
                            <h1>Total Sold</h1>
                            <Badge variant={BadgeVariant.DEFAULT}><Minus /> {totalReflections?.totalSold}</Badge>
                        </div>
                            <div>
                                <h1>Current Balance</h1>
                                <Badge variant={BadgeVariant.DEFAULT}>{Number(totalReflections?.balance?.toFixed(0)).toLocaleString()} {`(${totalBalanceUsd} USD)`}</Badge>

                            </div>
                        <div>
                            <h1>Total Reflections</h1>
                            <Badge variant={BadgeVariant.DEFAULT}> <Plus /> {totalReflections?.totalGained} {`(${totalReflectionsUsd} USD)`}</Badge>
                        </div>
                    </PanelBody>
                </div> : <>{!!address && <p style={{height:'400px', alignItems:'center', display:'flex', justifyContent: 'center'}}> You must select a token you own to track reflections! </p>}</>}
                </>}
                {notAllowed && <p style={{height: '400px', alignItems:'center', display:'flex', justifyContent: 'center'}}>
                    You must hold Kiba Inu Tokens to use this feature.
                    </p>}
            </PanelBody>
                </DarkGreyCard>
    )
}