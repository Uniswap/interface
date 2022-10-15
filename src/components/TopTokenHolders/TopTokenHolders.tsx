//eslint-disable
//tslint-disable
/*eslint-disable*/
/*eslint-ignore*/
import * as axios from 'axios'

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, ExternalLink as LinkIcon, Maximize, Minimize } from 'react-feather';
import Badge, { BadgeVariant } from 'components/Badge';
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink';
import React, { FC, useEffect, useMemo, useState } from 'react';

import { CImage } from '@coreui/react';
import { DarkCard } from 'components/Card';
import { ExternalLink } from 'theme';
import ReactFullscreen from 'react-easyfullscreen';
import { Style } from 'util';
import Tooltip from 'components/Tooltip'
import _ from 'lodash'
import styled from 'styled-components/macro'
import { useIsMobile } from 'pages/Swap/SelectiveChartingBsc';
import { usePairs } from 'state/logs/utils';
import useTheme from 'hooks/useTheme'
import { useTokenInfo } from 'components/swap/ChartPage';

const AddressLink = styled(ExternalLink) <{ hasENS: boolean; isENS: boolean }>`
  font-size: 0.825rem;
  color: ${({ theme }) => theme.text3};
  font-size: 0.825rem;
  display: flex;
  :hover {
    color: ${({ theme }) => theme.text2};
  }
`
type Props = {
    address: string;
    chainId?: number;
}

type TopHolder = {
    address: string;
    balance: number;
    share?: number;
    total_supply?: string;
}

const StyledSpan = styled.span`
    color: lightgreen;
    &:hover {
        color: ${props => props.theme.primary1};
        transition: ease all 0.1s;
    }
`

type BscScanHolder = {
    TokenHolderAddress: string
    TokenHolderQuantity: string
}

const fetchBscscanTopHolders = async (tokenAddress: string) => {
    const retVal: BscScanHolder[] = []
    const response = await axios.default.get<{ result: BscScanHolder[] }>(`https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=10&apikey=G5GE5FR37HCTS1UZ957PRB9DYUBGV4SU75`)
    return response.data.result
}

export const TopTokenHolders: FC<Props> = (props: Props) => {
    const isMobile = useIsMobile()
    const { address, chainId } = props;
    const [holders, setHolders] = useState<TopHolder[]>()
    const pairs = usePairs(address)
    const URL = useMemo(() => {
        if (!address) return ``
        if (!chainId || chainId === 1) return `https://api.ethplorer.io/getTopTokenHolders/${address}?apiKey=EK-htz4u-dfTvjqu-7YmJq&limit=50`;
        if (chainId === 56) return `https://api.covalenthq.com/v1/56/tokens/${address}/token_holders/?&key=ckey_3e8b37ddebbf418d9f829e4dddb&page-size=15000&page-number=1`;
        return ``
    }, [address, chainId])
    const tokenInfo = useTokenInfo(chainId, address)
    const deadAddresses = ['0xdEAD000000000000000042069420694206942069'?.toLowerCase(), '0x000000000000000000000000000000000000dead'?.toLowerCase()]
    const [token, setToken] = React.useState<{ name: string; symbol: string; logo: string; decimals: number }>()
    useEffect(() => {
        if (URL && (!chainId || chainId === 1)) {
            axios.default.get<{ holders: TopHolder[] }>(URL).then((response) => {
                setHolders(response.data.holders);
            });
        }

        if (URL && chainId === 56) {

            axios.default.get<{
                data: {
                    items: { logo_url: string, total_supply: string, address: string, contract_name: string, contract_ticker_symbol: string, contract_decimals: number, balance: string }[]
                }
            }>(URL).then((response) => {
                const trueTotalSupply = +response.data.data.items?.[0]?.total_supply / 10 ** response.data.data.items?.[0]?.contract_decimals
                setToken({
                    decimals: response.data.data.items?.[0]?.contract_decimals,
                    logo: response.data.data.items?.[0]?.logo_url,
                    name: response.data.data.items?.[0]?.contract_name,
                    symbol: response.data.data.items?.[0]?.contract_ticker_symbol,
                })
                setHolders(
                    _.orderBy(
                        [
                            ...response.data.data.items,
                        ],
                        a => +a.balance,
                        "desc"
                    ).slice(0, 50).map((item) => ({
                        address: item.address,
                        balance: +item.balance / 10 ** item.contract_decimals,
                        share: trueTotalSupply / +item.balance / 10 ** item.contract_decimals,
                        total_supply: trueTotalSupply.toString()
                    })))

            }).catch(console.error)
            // fetchBscscanTopHolders(address).then((response) => setHolders(response.map((item) => ({
            //     address: item.TokenHolderAddress,
            //     balance: +item.TokenHolderQuantity
            // }))))
        }
    }, [URL, chainId, address])

    const burntHolderOwnedPercentComputed = useMemo(() => {
        if (!holders) return 0;
        if (!holders.some(a => deadAddresses.includes(a.address?.toLowerCase()))) return 0;

        return _.sumBy(holders.filter(a => deadAddresses.includes(a.address?.toLowerCase())), a => a?.share || 0)
    }, [holders]);

    const topHoldersOwnedPercentComputed = useMemo(() => {
        if (!holders) return 0;

        return _.sumBy(holders.filter(holder => !deadAddresses.includes(holder.address) && !pairs?.some((pair: { id: string }) => holder?.address?.toLowerCase() === pair?.id?.toLowerCase())), holders => holders?.share || 0).toFixed(2);
    }, [holders, pairs])

    const [showUniTooltip, setShowUniTooltip] = React.useState(false)
    const isUniswapPair = React.useMemo(() => (address: string) => !!pairs.some((pair: { id: string }) => pair.id.toLowerCase() === address.toLowerCase()), [pairs])
    const PairTooltipText = React.useMemo(() => (address: string) => {
        if (!isUniswapPair(address)) return ''
        const pair: { token0: { symbol: string; }, token1: { symbol: string; } } = pairs?.find((pair: { id: string; symbol: string; }) => pair.id.toLowerCase() === address.toLowerCase());
        return pair?.token0 && pair?.token1 ?
            `${pair?.token0?.symbol}/${pair?.token1?.symbol} Uniswap Pair` :
            ''
    }, [pairs])
    const [sliceCount, setSliceCount] = React.useState({ start: 0, end: 10 });

    const sliceCountCb = () => {
        const end = sliceCount.end == holders?.length ? 10 : holders?.length || 0;
        setSliceCount({ ...sliceCount, end })
    }
    const [isOpen, setIsOpen] = useState(false)

    const getHolderLink = (holder: { address: string }) => {
        if (chainId === 1 || !chainId) return `https://etherscan.io/address/${holder.address}`
        if (chainId === 56) return `https://bscscan.com/address/${holder.address}`;
        return ``
    }
    const [maxxed, setIsMaxxed] = React.useState(false)
    const theme = useTheme()
    console.log(`[useTopTokenHolders]`, holders)
    const node = useMemo(() => isOpen ? <ChevronUp style={{ cursor: "pointer" }} /> : <ChevronDown style={{ cursor: "pointer" }} />, [isOpen]);
    const nodeProps = (onRequest: Promise<void> | any, onExit: Promise<void> | any) => ({
        onClick: (e: any) => {
            e && e.preventDefault && e.preventDefault()
            const maximum = !maxxed
            let _isOpen = false
            setIsMaxxed(maximum)
            if (maximum) {
                onRequest()
                setIsOpen(true)
                sliceCountCb()
            } else {
                onExit()
                setIsOpen(false)
            }
        }
    })
    //tslint-ignore
    //eslint-disable
    //eslint-ignore
    const maxNode = useMemo(() => {
        return (onRequest: () => void, onExit: () => void) => {
            return maxxed ?
                <Minimize aria-title={"Full Screen"} style={{ cursor: 'pointer', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}
                    onClick={nodeProps(onRequest, onExit).onClick} /> :
                <Maximize aria-title={"Exit Full Screen"} style={{ cursor: 'pointer', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}
                    onClick={nodeProps(onRequest, onExit).onClick} />
        }
    }, [maxxed])

    return useMemo(() => {
        return topHoldersOwnedPercentComputed > 0 ? (
            <ReactFullscreen>
                {({ ref, onRequest, onExit }: any) => (

                    <DarkCard ref={ref} style={{ padding: '.85rem', border: `1px solid ${theme.bg6}`, background: theme.chartSidebar }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'stretch', alignItems: 'center', gap: 10 }}>
                            {Boolean(token) && token?.logo && <CImage style={{ maxWidth: 30 }} fluid src={token.logo} />}
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <p style={{ margin: 0, fontSize: 14 }} onClick={() => setIsOpen(!isOpen)}>The top 50 holders own <Badge>{topHoldersOwnedPercentComputed}%</Badge> of the total supply. <Badge>{burntHolderOwnedPercentComputed}%</Badge> is burnt. {node} </p>  {maxNode(onRequest, onExit)} </div>
                        </div>
                        {isOpen && <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {!isMobile && <>
                                <p style={{ fontSize: 12, margin: 0 }}>Address</p>
                                <p style={{ fontSize: 12, margin: 0 }}>Balance <span style={{ borderLeft: '1px solid #444', paddingLeft: 10, marginLeft: 10 }}>Share (%)</span></p>
                            </>}
                            {isMobile && <p style={{ margin: 0 }}>Top {tokenInfo?.symbol} token holders</p>}
                        </div>}
                        {isOpen && <div style={{ maxHeight: maxxed ? '100vh' : '380px', overflowY: `scroll`, width: '100%', overflow: 'auto' }}>
                            {holders && holders.slice(sliceCount.start, sliceCount.end).map((holder, i) => (
                                <div key={holder.address} style={{ columnGap: 20, borderBottom: (i == sliceCount.end - 1) ? 'none' : `1px solid #444`, alignItems: 'center', padding: '2px 0px', marginBottom: 1, display: 'flex', rowGap: 10, justifyContent: isMobile ? 'stretch' : 'space-between', flexFlow: 'row wrap' }}>
                                    <AddressLink
                                        hasENS={false}
                                        isENS={false}
                                        href={chainId == 56 ? getHolderLink(holder) : getExplorerLink(chainId || 1, holder.address, ExplorerDataType.ADDRESS)}
                                        style={{
                                            color: theme.text1,
                                            fontSize: 12
                                        }}>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 3,
                                            width: 25,
                                            height: 25,
                                            color: theme.text1,
                                            background: theme.backgroundInteractive,
                                            borderRadius: 15
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ marginRight: 3 }}>{holder?.address?.substring(0, 10)}...{holder.address?.substring(holder?.address?.length - 4, holder?.address?.length)}</span>
                                        <LinkIcon size={16} />
                                        {isUniswapPair(holder.address) &&
                                            <Tooltip text={PairTooltipText(holder.address)} show={showUniTooltip} >
                                                <img onMouseEnter={() => setShowUniTooltip(true)}
                                                    onMouseLeave={() => setShowUniTooltip(false)}
                                                    src={'https://i2.wp.com/fastandclean.org/wp-content/uploads/2021/01/UniSwap-logo.png?ssl=1'}
                                                    style={{ maxWidth: 30, marginTop: -8 }} />
                                            </Tooltip>
                                        }
                                    </AddressLink>

                                    <Badge style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} variant={BadgeVariant.GREY}>
                                        <div style={{
                                            fontSize: 12,
                                            paddingRight: 10,
                                            borderRight: '1px solid #444',
                                            display: 'flex',
                                            gap: 15,
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            color: theme.white
                                        }}>
                                            {chainId == 1 && tokenInfo?.decimals && <span>{Number(holder.balance / 10 ** tokenInfo?.decimals).toLocaleString()}</span>}
                                            {chainId == 56 && <span>{Number(holder.balance).toLocaleString()}</span>}
                                            {((tokenInfo && tokenInfo.symbol) || token && token?.symbol) && <span> {tokenInfo?.symbol}</span>}
                                        </div>
                                        &nbsp;
                                        <span style={{ paddingLeft: 10, fontSize: 12.5, color: 'lightgreen' }}>{holder.share}%</span>
                                    </Badge>

                                </div>
                            ))}

                        </div>}
                        {!!isOpen && <Badge style={{ cursor: 'pointer', alignItems: 'center', color: theme.text1, position: 'relative', width: '100%', bottom: 0, display: 'flex', justifyContent: 'center' }} onClick={sliceCountCb}>
                            <small style={{ fontSize: 12 }}>{
                                holders?.length === sliceCount?.end ? 'Hide' : 'Show'} All
                                {holders?.length !== sliceCount?.end ? <ArrowDown /> : <ArrowUp />}
                                Top 50</small>
                        </Badge>}
                    </DarkCard>)}
            </ReactFullscreen>
        ) : null
    }, [holders, setSliceCount, nodeProps, setIsOpen, isMobile, holders?.length, isOpen, burntHolderOwnedPercentComputed, node, sliceCount.start, sliceCount.end, topHoldersOwnedPercentComputed, maxxed])
}