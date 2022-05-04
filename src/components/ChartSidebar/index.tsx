import 'react-pro-sidebar/dist/css/styles.css';

import { ArrowLeftCircle, ArrowRightCircle, BarChart2, ChevronDown, ChevronUp, Globe, Heart, PieChart, Twitter } from 'react-feather'
import { Currency, Token } from '@uniswap/sdk-core';
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink';
import { ExternalLink, StyledInternalLink, TYPE, } from 'theme';
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarFooter, SidebarHeader, SubMenu } from 'react-pro-sidebar';
import { RowBetween, RowFixed } from 'components/Row';
import styled, { keyframes } from 'styled-components/macro'
import { useBscToken, useCurrency, useToken } from 'hooks/Tokens';
import { useHolderCount, useTokenHolderCount, useTokenInfo } from 'components/swap/ChartPage'

import { BurntKiba } from 'components/BurntKiba';
import Copy from '../AccountDetails/Copy'
import CurrencyLogo from 'components/CurrencyLogo';
import React from 'react';
import { StyledAnchorLink } from 'components/Header';
import { Trans } from '@lingui/macro'
import _ from 'lodash'
import { useKiba } from 'pages/Vote/VotePage';
import { useTokenBalance } from 'state/wallet/hooks';
import { useTotalSupply } from 'hooks/useTotalSupply';
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

const Wrapper = styled.div`
.pro-sidebar .pro-menu a:before {
    content: inherit;
}
.pro-sidebar .pro-menu .pro-menu-item.pro-sub-menu .pro-inner-list-item {
    padding-left: 0;
    padding-top:0;
}
.pro-sidebar .pro-menu > ul > .pro-sub-menu > .pro-inner-list-item > div > ul {
    padding-top:15px;
    padding-bottom:15px;
    background: linear-gradient(#181C27, #131722);
}
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
    onCollapse: (collapsed: boolean) => void
    collapsed: boolean;
    loading: boolean;
}
const _ChartSidebar = React.memo(function (props: ChartSidebarProps) {
    const [componentLoading, setComponentLoading] = React.useState(false)
    const { token, tokenData, chainId, collapsed, onCollapse, loading } = props
    const { account } = useWeb3React()
    const hasData = React.useMemo(() => !!tokenData && !!token && !!token.name && !!token.address && !!token.symbol, [tokenData, token])
    const tokenInfo = useTokenInfo(chainId ?? 1, token.address)
    const [statsOpen, setStatsOpen] = React.useState(true)
    const [quickNavOpen, setQuickNavOpen] = React.useState(false)
    const transactionCount = React.useMemo(() => {
        return tokenData && tokenData?.txCount ? tokenData?.txCount : undefined
    }, [tokenData])
    const holderCount = useTokenHolderCount(token.address, chainId)
    const tokenCurrency = token && token.decimals && token.address ? new Token(chainId ?? 1, token.address, +token.decimals, token.symbol, token.name) : {} as Token
    //create a custom function that will change menucollapse state from false to true and true to false
    const menuIconClick = () => {
        //condition checking to change state from true to false and vice versa
        collapsed ? onCollapse(false) : onCollapse(true);
    };
    const totalSupply = useTotalSupply(tokenCurrency)
    const totalSupplyInt = React.useMemo(() => {
        if (tokenInfo && tokenInfo?.totalSupply && tokenInfo.totalSupply.valueOf() && _.isNumber(tokenInfo?.totalSupply))
            return parseFloat(tokenInfo?.totalSupply?.toFixed(0));
        if (totalSupply) {
            return parseFloat(totalSupply.toFixed(0))
        }
        return 0
    }, [tokenInfo?.totalSupply, totalSupply])
    const formattedPrice = React.useMemo(() => {
        console.log(`trying to get price--`, tokenInfo?.price, tokenData?.priceUSD)

        if (tokenData && tokenData.priceUSD) {
            console.info(`Using uniswap v2 price -- its always much more up - to - date`, tokenData)
            return `$${parseFloat(parseFloat(tokenData.priceUSD).toFixed(18)).toFixed(18)}`
        }
        if (tokenInfo && tokenInfo.price && tokenInfo.price.rate) {
            console.info(`Fallback to etherapi price -- not as  up - to - date, but better than nothing`, tokenData)
            return `$${tokenInfo.price.rate.toFixed(18)}`
        }


        return `-`
    }, [tokenInfo?.price, token, tokenData])
    const deadKiba = useKiba('0x000000000000000000000000000000000000dead')
    const _token = useToken(token.address)
    const _bscToken = useBscToken(chainId == 56 ? token.address : undefined)
    const amountBurnt = useTokenBalance('0x000000000000000000000000000000000000dead', chainId == 56 ? _bscToken as Token : _token ?? undefined)
    const marketCap = React.useMemo(() => {
        if (!totalSupplyInt || totalSupplyInt === 0) return ''
        const hasTokenData = !!tokenData?.priceUSD
        const hasTokenInfo = !!tokenInfo?.price && !!tokenInfo?.price?.rate
        if (!hasTokenInfo && !hasTokenData) return ''
        const price = tokenData && tokenData.priceUSD ? tokenData?.priceUSD : tokenInfo && tokenInfo.price ? tokenInfo.price.rate : '';
        if (price == '') return '';
        let excludingBurntValue = totalSupplyInt;
        if (amountBurnt) excludingBurntValue -= parseFloat(amountBurnt.toFixed(0))
        else if (!amountBurnt && token.name.toLowerCase().includes('kiba') && deadKiba)
            excludingBurntValue -= parseFloat(deadKiba.toFixed(0))

        return Number(parseFloat(price.toFixed(18)) * excludingBurntValue).toLocaleString()
    }, [totalSupplyInt, tokenInfo?.price, tokenData?.priceUSD, amountBurnt])
    const hasSocials = React.useMemo(() => tokenInfo && (tokenInfo?.twitter || tokenInfo?.coingecko || tokenInfo?.website), [tokenInfo])
    const currency = useCurrency(token.address ? token.address : tokenData?.id)
    console.log('chartSidebar -> tokenInfo', marketCap)

    return (
        <Wrapper>
            <ProSidebar collapsed={collapsed}
                width={'100%'}
                onLoadStart={() => setComponentLoading(true)}
                onLoadCapture={() => setComponentLoading(false)}
                style={{ marginRight: 15, background: 'linear-gradient(#181C27, #131722)', borderRadius: 10, border: '.25px solid transparent' }}
            >
                <SidebarHeader style={{ background: 'linear-gradient(#181C27, #131722)' }}>
                    <Menu iconShape="round">

                        <MenuItem icon={<BarChart2 style={{ background: 'transparent' }} />}> Kiba Charts </MenuItem>
                        {/* changing menu collapse icon on click */}
                        <div style={{ marginBottom: 5, cursor: 'pointer', display: 'flex', justifyContent: "end", position: 'relative', right: '5' }} >
                            {collapsed && (
                                <ArrowRightCircle onClick={menuIconClick} />
                            )}

                            {!collapsed && (
                                <ArrowLeftCircle onClick={menuIconClick} />
                            )}
                        </div>
                    </Menu>

                </SidebarHeader>
                <SidebarContent style={{ background: 'linear-gradient(#181C27, #131722)' }}>
                    <Menu>
                        <SubMenu
                            style={{ background: 'linear-gradient(#181C27, #131722)', paddingLeft: 0 }}
                            open={statsOpen}
                            onOpenChange={(isOpen) => {
                                setStatsOpen(isOpen)
                                if (isOpen) setQuickNavOpen(false)
                            }}
                            popperarrow
                            placeholder={'loader'}
                            icon={<PieChart style={{ background: 'transparent' }} />}
                            title={`${tokenData?.name ? tokenData?.name : ''} Stats`}>
                            {hasData &&
                                <>
                                    <Menu style={{ background: 'linear-gradient(#181C27, #131722)', paddingLeft: 0 }} iconShape="round"   >
                                        <SidebarHeader>
                                            <MenuItem>{tokenData?.name} Info</MenuItem>
                                            {token && token.address && currency && (<MenuItem>
                                                <RowBetween>
                                                    <ExternalLink href={getExplorerLink(chainId as number, token.address ? token.address : tokenData?.id ? tokenData?.id : currency?.wrapped?.address, ExplorerDataType.TOKEN)}>

                                                        <RowFixed>
                                                            <CurrencyLogo currency={currency as Currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
                                                            <TYPE.main>{token?.symbol} ↗</TYPE.main>

                                                        </RowFixed>
                                                    </ExternalLink>

                                                    {token.address && (
                                                        <RowFixed>
                                                            <Copy toCopy={token.address}>
                                                                <span style={{ marginLeft: '4px' }}>
                                                                    <Trans>Copy Address</Trans>
                                                                </span>
                                                            </Copy>
                                                        </RowFixed>
                                                    )}
                                                </RowBetween>
                                            </MenuItem>)}
                                            {hasSocials &&
                                                <MenuItem >
                                                    <div style={{ display: 'flex', alignItems: 'center', columnGap: 10 }}>
                                                        {tokenInfo?.twitter && <a style={{ display: "inline-block" }} href={`https:/twitter.com/${tokenInfo?.twitter}`}>
                                                            <Twitter />
                                                        </a>}
                                                        {tokenInfo?.website && <a style={{ display: "inline-block" }} href={tokenInfo?.website}>
                                                            <Globe />
                                                        </a>}
                                                        {tokenInfo?.coingecko && <a style={{ display: "inline-block" }} href={`https://coingecko.com/en/coins/${tokenInfo.coingecko}`}>
                                                            <img src='https://cdn.filestackcontent.com/MKnOxRS8QjaB2bNYyfou' style={{ height: 25, width: 25 }} />
                                                        </a>}
                                                    </div>
                                                </MenuItem>}
                                        </SidebarHeader>

                                        {!!tokenData && !!tokenData?.priceUSD && _.isNumber(tokenData?.priceUSD) && <> <MenuItem>
                                            <TYPE.subHeader>Price</TYPE.subHeader>
                                            <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{formattedPrice}</TYPE.black>
                                        </MenuItem>
                                            {!!marketCap &&
                                                <MenuItem>
                                                    <TYPE.subHeader>Market Cap (includes burnt)</TYPE.subHeader>
                                                    <TYPE.black>${marketCap}</TYPE.black>
                                                </MenuItem>}
                                            <MenuItem>
                                                <TYPE.subHeader>Diluted Market Cap</TYPE.subHeader>
                                                <TYPE.black>${Number(parseFloat(tokenData?.priceUSD?.toFixed(18)) * (totalSupplyInt)).toLocaleString()}</TYPE.black>
                                            </MenuItem></>}

                                        {!tokenData?.priceUSD && !!tokenInfo && !!tokenInfo.price && !!tokenInfo?.price?.rate && _.isNumber(tokenInfo.price.rate) && <>
                                            <MenuItem>
                                                <TYPE.subHeader>Price</TYPE.subHeader>
                                                <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{formattedPrice}</TYPE.black>
                                            </MenuItem>
                                            {!!marketCap &&
                                                <MenuItem>
                                                    <TYPE.subHeader>Market Cap (includes burnt)</TYPE.subHeader>
                                                    <TYPE.black>${marketCap}</TYPE.black>
                                                </MenuItem>}
                                            <MenuItem>
                                                <TYPE.subHeader>Diluted Market Cap</TYPE.subHeader>
                                                <TYPE.black>${Number(parseFloat(tokenInfo?.price?.rate?.toFixed(18)) * totalSupplyInt).toLocaleString()}</TYPE.black>
                                            </MenuItem>
                                        </>
                                        }

                                        {token?.symbol?.toLowerCase().includes('kiba') && <MenuItem>
                                            <TYPE.subHeader>Total Burnt</TYPE.subHeader>
                                            <BurntKiba style={{ display: 'flex', justifyContent: 'start !important' }} />
                                        </MenuItem>}
                                        {!!totalSupplyInt && totalSupplyInt > 0 && <MenuItem>
                                            <TYPE.subHeader>Total Supply</TYPE.subHeader>
                                            <TYPE.black>{totalSupplyInt.toLocaleString()}</TYPE.black>
                                        </MenuItem>}
                                        {transactionCount && <MenuItem>
                                            <TYPE.subHeader>Total Transactions</TYPE.subHeader>
                                            <TYPE.black>{transactionCount.toLocaleString()}</TYPE.black>
                                        </MenuItem>}
                                        {holderCount && holderCount?.holdersCount && <MenuItem>
                                            <TYPE.subHeader># Holders</TYPE.subHeader>
                                            <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{parseFloat(holderCount?.holdersCount).toLocaleString()}</TYPE.black>
                                        </MenuItem>}

                                        {!tokenInfo || !tokenInfo?.price && tokenData?.oneDayVolumeUSD && <MenuItem>
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
                                        {(tokenInfo && tokenInfo.price || tokenData && tokenData?.priceChangeUSD) && <Menu iconShape="round"   >
                                            <SidebarHeader>
                                                <MenuItem>Price Change Stats</MenuItem>
                                            </SidebarHeader>
                                            <SidebarContent>
                                                {!tokenInfo?.price && tokenData?.priceChangeUSD && <MenuItem>
                                                    <TYPE.subHeader>Price 24Hr (%) </TYPE.subHeader>
                                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenData?.priceChangeUSD < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {tokenData?.priceChangeUSD?.toFixed(2)}%</TYPE.black>
                                                </MenuItem>}

                                                {tokenInfo && tokenInfo.price && tokenInfo?.price?.diff && <MenuItem>
                                                    <TYPE.subHeader>Price 24Hr (%) </TYPE.subHeader>
                                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenInfo?.price.diff < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {parseFloat(tokenInfo.price.diff.toString()).toFixed(2)}%</TYPE.black>
                                                </MenuItem>}

                                                {tokenInfo && tokenInfo.price && tokenInfo?.price?.diff7d && <MenuItem>
                                                    <TYPE.subHeader>Price 1 Week (%) </TYPE.subHeader>
                                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenInfo.price.diff7d < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {parseFloat(tokenInfo.price.diff7d.toString()).toFixed(2)}%</TYPE.black>
                                                </MenuItem>}

                                                {tokenInfo && tokenInfo.price && tokenInfo?.price?.diff30d && <MenuItem>
                                                    <TYPE.subHeader>Price 30 Days (%) </TYPE.subHeader>
                                                    <TYPE.black style={{ display: 'flex', alignItems: 'center' }}>{tokenInfo.price.diff30d < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}&nbsp; {parseFloat(tokenInfo.price.diff30d.toString()).toFixed(2)}%</TYPE.black>
                                                </MenuItem>}
                                            </SidebarContent>
                                        </Menu>}
                                    </Menu>

                                </>
                            }
                            {!hasData || loading || componentLoading && (
                                <Spinner />
                            )}

                        </SubMenu>
                    </Menu>

                </SidebarContent>

                <SidebarFooter style={{ background: 'linear-gradient(#181C27, #131722)' }} >
                    <Menu iconShape="square" style={{background:'linear-gradient(#181C27, #131722)'}}>
                        <SubMenu style={{background: 'linear-gradient(#181C27, #131722)'}} title="Quick Nav" icon={<Heart style={{ background: 'transparent' }} />} open={quickNavOpen} onOpenChange={(isOpen) => {
                            setQuickNavOpen(isOpen)
                            if (isOpen) setStatsOpen(false)
                        }}>
                            <MenuItem><StyledInternalLink to="/dashboard">Dashboard</StyledInternalLink></MenuItem>
                            <MenuItem><StyledInternalLink to="/swap">Swap</StyledInternalLink></MenuItem>
                            {!!account && <MenuItem><StyledInternalLink to={`/details/${account}`}>View Your Transactions</StyledInternalLink></MenuItem>}
                            <MenuItem><StyledInternalLink to="/fomo">Kiba Fomo</StyledInternalLink></MenuItem>
                            <MenuItem><StyledInternalLink to="/honeypot-checker">Honeypot Checker</StyledInternalLink></MenuItem>
                        </SubMenu>
                    </Menu>
                </SidebarFooter>
            </ProSidebar>
        </Wrapper>
    )
})
_ChartSidebar.displayName = 'chart.sidebar'
export const ChartSidebar = _ChartSidebar