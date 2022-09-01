import * as axios from 'axios'

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'react-feather';
import Badge, { BadgeVariant } from 'components/Badge';
import React, { FC, useEffect, useMemo, useState } from 'react';

import { DarkCard } from 'components/Card';
import { ExternalLink } from 'theme';
import Tooltip from 'components/Tooltip'
import _ from 'lodash'
import { isMobile } from 'react-device-detect';
import styled from 'styled-components/macro'
import { usePairs } from 'state/logs/utils';
import { useTokenInfo } from 'components/swap/ChartPage';

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
        color: #fff !important;
        transition: ease all 0.1s;
    }
`

export const TopTokenHolders: FC<Props> = (props: Props) => {
    const { address, chainId } = props;
    const [holders, setHolders] = useState<TopHolder[]>()
    const pairs = usePairs(address)
    const URL = useMemo(() => {
        if (!chainId || chainId === 1) return `https://api.ethplorer.io/getTopTokenHolders/${address}?apiKey=EK-htz4u-dfTvjqu-7YmJq&limit=50`;
        if (chainId === 56) return `https://api.covalenthq.com/v1/56/tokens/${address}/token_holders/?&key=ckey_3e8b37ddebbf418d9f829e4dddb&page-size=2199&page-number=1`;
        return ``
    }, [props])
    const tokenInfo = useTokenInfo(chainId, address)
    const deadAddresses = ['0xdEAD000000000000000042069420694206942069'?.toLowerCase(), '0x000000000000000000000000000000000000dead'?.toLowerCase()]

    useEffect(() => {
        if (URL && chainId === 1) {
            axios.default.get<{ holders: TopHolder[] }>(URL).then((response) => {
                setHolders(response.data.holders);
            });
        }

        if (URL && chainId === 56) {
            axios.default.get<{ data: { updatedAt: string, items: TopHolder[] } }>(URL).then((response) => {
                let mappedData = response.data.data.items.map((holder) => {
                    if (holder.balance && holder.total_supply) {
                        holder.share = parseFloat(holder?.balance.toString()) / (parseFloat(holder?.total_supply))
                        holder.balance = parseFloat(holder?.balance?.toString())
                    }
                    return holder;
                });
                axios.default.get<{ data: { updatedAt: string, items: TopHolder[] } }>(URL.replace('page-number=1', 'page-number=2')).then((response) => {
                    mappedData = [
                        ...mappedData,
                        ...response.data.data.items.map((holder) => {
                            if (holder.balance && holder.total_supply) {
                                holder.share = parseFloat(holder?.balance.toString()) / (parseFloat(holder?.total_supply))
                                holder.balance = parseFloat(holder?.balance?.toString())
                            }
                            return holder;
                        })
                    ];
                    setHolders(_.orderBy(mappedData, m => m.balance, 'desc').slice(0, 50))
                });
            });
        }
    }, [props])

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

    const [isOpen, setIsOpen] = useState(false)

    const getHolderLink = (holder: { address: string }) => {
        if (chainId === 1 || !chainId) return `https://etherscan.io/address/${holder.address}`
        if (chainId === 56) return `https://bscscan.com/address/${holder.address}`;
        return ``
    }
    const node = useMemo(() => isOpen ? <ChevronUp style={{ cursor: "pointer" }} /> : <ChevronDown style={{ cursor: "pointer" }} />, [isOpen]);
    if (chainId !== 1) return null
    return (
        <DarkCard style={{ padding: '.85rem', background: 'rgba(0,0,0,.4)' }}>
            <p style={{ margin: 0 }} onClick={() => setIsOpen(!isOpen)}>The top 50 holders own <Badge>{topHoldersOwnedPercentComputed}%</Badge> of the total supply. <Badge>{burntHolderOwnedPercentComputed}%</Badge> is burnt. {node}</p>
            {isOpen && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {!isMobile && <>
                    <p style={{ fontSize: 12, margin: 0 }}>Address</p>
                    <p style={{ fontSize: 12 }}>Balance <span style={{ borderLeft: '1px solid #444', paddingLeft: 10, marginLeft: 10 }}>Share (%)</span></p>
                </>}
                {isMobile && <p style={{ margin: 0 }}>Top {tokenInfo?.symbol} token holders</p>}
            </div>}
            {isOpen && <div style={{ width: '100%', maxHeight: 345, overflow: 'auto' }}>
                {holders && holders.slice(sliceCount.start, sliceCount.end).map((holder, i) => (
                    <div key={holder.address} style={{ rowGap: 1, alignItems: 'center', padding: '1px 0px', marginBottom: 1, display: 'flex', gap: 10, justifyContent: isMobile ? 'stretch' : 'space-between', flexFlow: 'row wrap' }}>
                        <ExternalLink style={{ color: "#fff", fontSize: 12 }} href={getHolderLink(holder)}>
                            <span style={{ marginRight: 3, color: '#FFF', background: "#444", borderRadius: 15, padding: 3 }}>{i + 1}</span> {holder?.address}
                            {isUniswapPair(holder.address) &&
                                <Tooltip text={PairTooltipText(holder.address)} show={showUniTooltip} >
                                    <img onMouseEnter={() => setShowUniTooltip(true)}
                                        onMouseLeave={() => setShowUniTooltip(false)}
                                        src={'https://i2.wp.com/fastandclean.org/wp-content/uploads/2021/01/UniSwap-logo.png?ssl=1'}
                                        style={{ maxWidth: 30 }} />
                                </Tooltip>
                            }
                        </ExternalLink>

                        <Badge style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} variant={BadgeVariant.GREY}>
                            {tokenInfo && tokenInfo.decimals && <div style={{
                                fontSize: 12,
                                paddingRight: 10,
                                borderRight: '1px solid #444',
                                display: 'flex',
                                gap: 15,
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{Number(holder.balance / 10 ** tokenInfo?.decimals).toLocaleString()}</span>
                                <span> {tokenInfo?.symbol}</span>
                            </div>}
                            &nbsp;
                            <span style={{ paddingLeft: 10, fontSize: 12.5, color: 'lightgreen' }}>{holder.share}%</span>
                        </Badge>
                        {holder == holders[holders.slice(sliceCount.start, sliceCount.end).length - 1] ? <StyledSpan style={{ cursor: 'pointer', alignItems: 'center', color: 'lightgreen', position: 'relative', width: '100%', bottom: !isMobile ? 30 : 0, display: 'flex', justifyContent: 'center', height: !isMobile ? 1 : 15 }} onClick={() => {
                            const end = sliceCount.end == holders?.length ? 10 : holders?.length;
                            setSliceCount({ ...sliceCount, end })
                        }}>
                            <small style={{ fontSize: 12 }}>{
                                holders?.length === sliceCount?.end ? 'Hide' : 'Show'}
                                {holders?.length !== sliceCount?.end ? <ArrowDown /> : <ArrowUp />}
                                All Top 50</small>
                        </StyledSpan> : null}
                    </div>
                ))}

            </div>}
        </DarkCard>
    )
}