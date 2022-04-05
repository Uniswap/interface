import 'react-pro-sidebar/dist/css/styles.css';

import { BarChart2, ChevronDown, ChevronUp, DollarSign, Heart, PieChart } from 'react-feather'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarFooter, SidebarHeader, SubMenu } from 'react-pro-sidebar';
import { StyledInternalLink, TYPE, } from 'theme';
import styled, { keyframes } from 'styled-components/macro'
import { useHolderCount, useTokenInfo } from 'components/swap/ChartPage'

import { BurntKiba } from 'components/BurntKiba';
import React from 'react';
import _ from 'lodash'
import { useWeb3React } from '@web3-react/core';

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);
  display:flex;
  justify-content:center;
  margin-top:15px;
  margin-bottom:15px;
  text-aligncenter;
  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.green1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;

  left: -3px;
  top: -3px;
`

type ChartSidebarProps = {
    token: {
        name: string
        symbol: string
        address: string
        decimals: string
    }
    tokenData: any
    chainId?: number
}
const _ChartSidebar = React.memo(function (props: ChartSidebarProps) {
    const { token, tokenData, chainId } = props
    const { account } = useWeb3React()
    const hasData = React.useMemo(() => !!tokenData, [tokenData])
    const tokenInfo = useTokenInfo(chainId, token.address)
    const [statsOpen, setStatsOpen] = React.useState(true)
    const [quickNavOpen, setQuickNavOpen] = React.useState(false)
    const holderCount = useHolderCount(chainId)
    console.log('chartSidebar -> tokenInfo', tokenInfo, holderCount)
    return (
        <ProSidebar width={'100%'} title="Kiba Charts" style={{ background: '#252632', borderRadius: 10, border: '.25px solid transparent' }}>
            <SidebarContent style={{ background: '#252632' }} >

                <Menu  popperArrow  innerSubMenuArrows style={{ background: '#252632' }} iconShape="round">
                    <SidebarHeader>
                        <MenuItem  icon={<BarChart2 style={{background:'transparent'}} />}>KibaCharts</MenuItem>
                    </SidebarHeader>
                    <SubMenu
                        style={{ background: '#252632' }}
                        open={statsOpen}
                        onOpenChange={(isOpen) => {
                            setStatsOpen(isOpen)
                            if (isOpen) setQuickNavOpen(false)
                        }}
                        icon={<PieChart style={{background:'transparent'}} />}
                        title={`${tokenData?.name ? tokenData?.name : ''} Stats`}>
                        {hasData &&
                            <>
                                <MenuItem>
                                    <TYPE.subHeader>Price</TYPE.subHeader>
                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenData.priceUSD.toFixed(18)}</TYPE.black>
                                </MenuItem>
                                <MenuItem>
                                    <TYPE.subHeader>Market Cap</TYPE.subHeader>
                                    <TYPE.black>${Number(tokenData?.priceUSD * 1000000000000).toLocaleString()}</TYPE.black>
                                </MenuItem>
                                <MenuItem>
                                    <TYPE.subHeader>Total Burnt</TYPE.subHeader>
                                    <BurntKiba style={{ display: 'flex', justifyContent: 'start !important' }} />
                                </MenuItem>
                                {holderCount && holderCount?.holdersCount && <MenuItem>
                                    <TYPE.subHeader># Holders</TYPE.subHeader>
                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{holderCount?.holdersCount}</TYPE.black>
                                </MenuItem>}
                                {!tokenInfo || !tokenInfo?.price && <MenuItem>
                                    <TYPE.subHeader>24hr Volume</TYPE.subHeader>
                                    <TYPE.main>${chainId !== 56 ?
                                        parseFloat(parseFloat(tokenData?.oneDayVolumeUSD).toFixed(2)).toLocaleString()
                                        : (parseFloat(parseFloat(tokenData?.oneDayVolumeUSD).toFixed(2))).toLocaleString()}</TYPE.main>
                                </MenuItem>}
                                {tokenInfo && tokenInfo.price && tokenInfo.price.volume24h && <MenuItem>
                                    <TYPE.subHeader>24hr Volume</TYPE.subHeader>
                                    <TYPE.main>
                                        ${
                                            parseFloat(parseFloat(tokenInfo.price.volume24h.toString()).toFixed(2)).toLocaleString()
                                        }
                                        </TYPE.main>
                                </MenuItem>}
                                {!tokenInfo?.price && <MenuItem>
                                    <TYPE.subHeader>Price Change 24Hr (%) </TYPE.subHeader>
                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenData?.priceChangeUSD < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {tokenData.priceChangeUSD.toFixed(2)}%</TYPE.black>
                                </MenuItem>}

                                {tokenInfo && tokenInfo.price && tokenInfo.price.diff && <MenuItem>
                                    <TYPE.subHeader>Price Change 24Hr (%) </TYPE.subHeader>
                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenInfo?.price.diff < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {parseFloat(tokenInfo.price.diff.toString()).toFixed(2)}%</TYPE.black>
                                </MenuItem>}
                                {tokenInfo && tokenInfo.price && tokenInfo.price.rate && <MenuItem>
                                    <TYPE.subHeader>Price Change 1 Week (%) </TYPE.subHeader>
                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenInfo.price.diff7d < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {parseFloat(tokenInfo.price.diff7d.toString()).toFixed(2)}%</TYPE.black>
                                </MenuItem>}

                            </>
                        }
                        {!hasData && (
                            <Spinner />
                        )}
                    </SubMenu>


                    <SidebarFooter style={{ background: '#252632' }} >
                        <SubMenu  title="Quick Nav" icon={<Heart  style={{background:'transparent'}}/>} open={quickNavOpen} onOpenChange={(isOpen) => {
                            setQuickNavOpen(isOpen)
                            if (isOpen) setStatsOpen(false)
                        }}>
                            <MenuItem><StyledInternalLink to="/dashboard">Dashboard</StyledInternalLink></MenuItem>
                            <MenuItem><StyledInternalLink to="/swap">Swap</StyledInternalLink></MenuItem>
                            {!!account && <MenuItem><StyledInternalLink to={`/account/${account}`}>View Your Transactions</StyledInternalLink></MenuItem>}
                            <MenuItem><StyledInternalLink to="/fomo">Kiba Fomo</StyledInternalLink></MenuItem>
                            <MenuItem><StyledInternalLink to="/honeypot-checker">Honeypot Checker</StyledInternalLink></MenuItem>
                        </SubMenu>
                    </SidebarFooter>
                </Menu>
            </SidebarContent>
        </ProSidebar>
    )
}, _.isEqual)
_ChartSidebar.displayName = 'chart.sidebar'
export const ChartSidebar = _ChartSidebar