import React, { FC, useEffect, useState, useMemo } from 'react';
import * as axios from 'axios'
import _ from 'lodash'
import Badge, { BadgeVariant } from 'components/Badge';
import { DarkCard } from 'components/Card';
import { ChevronDown, ChevronUp } from 'react-feather';
import { isMobile } from 'react-device-detect';
import { usePairs } from 'state/logs/utils';
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


export const TopTokenHolders: FC<Props> = (props: Props) => {
    const { address, chainId } = props;
    const [holders, setHolders] = useState<TopHolder[]>()
    const pairs = usePairs(address)
    const URL = useMemo(() => {
        if (!chainId || chainId === 1) return `https://api.ethplorer.io/getTopTokenHolders/${address}?apiKey=EK-htz4u-dfTvjqu-7YmJq&limit=50`;
        if (chainId === 56) return `https://api.covalenthq.com/v1/56/tokens/${address}/token_holders/?&key=ckey_3e8b37ddebbf418d9f829e4dddb&page-size=2199&page-number=1`;
        return ``
    }, [props])

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
    const [sliceCount, setSliceCount] = React.useState({ start: 0, end: 10 });

    const [isOpen, setIsOpen] = useState(false)

    const getHolderLink = (holder: { address: string }) => {
        if (chainId === 1) return `https://etherscan.io/address/${holder.address}`
        if (chainId === 56) return `https://bscscan.com/address/${holder.address}`;
        return ``
    }
    const node = useMemo(() => isOpen ? <ChevronUp style={{ cursor: "pointer" }} /> : <ChevronDown style={{ cursor: "pointer" }} />, [isOpen]);
    if (chainId !== 1) return null
    return (
        <DarkCard style={{ background: 'rgba(0,0,0,.4)' }}>
            <p onClick={() => setIsOpen(!isOpen)}>The top 50 holders own <Badge>{topHoldersOwnedPercentComputed}%</Badge> of the total supply. <Badge>{burntHolderOwnedPercentComputed}%</Badge> is burnt. {node}</p>

            {isOpen && !isMobile && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ margin: 0 }}>Address</p>
                <p style={{ margin: 0 }}>Balance</p>
                <p style={{ margin: 0 }}>Share</p>
            </div>}
            {isOpen && <div style={{ maxHeight: 350, overflow: 'scroll' }}>
                {holders && holders.slice(sliceCount.start, sliceCount.end).map((holder, i) => (
                    <div key={holder.address} style={{ rowGap: 3, alignItems: 'center', padding: '1px 0px', marginBottom: 1, display: 'flex', justifyContent: 'space-between', flexFlow: 'row wrap' }}>
                        <a style={{ color: "#fff" }} href={getHolderLink(holder)}>
                            <span style={{ marginRight: 3, color: '#FFF', background: "#222", borderRadius: 15, padding: 3 }}>{i + 1}</span> {holder?.address.substring(0, 8) + '...' + holder?.address.substring(holder?.address.length - 8, holder?.address.length)}
                        </a>
                        <Badge>{Number(holder.balance / 10 ** 9).toLocaleString()}</Badge>
                        <Badge variant={BadgeVariant.POSITIVE}>{holder.share}%</Badge>

                    </div>
                ))}
                {holders && <Badge style={{ cursor: 'pointer', marginTop: 3 }} onClick={() => {
                    {
                        const end = sliceCount.end == holders?.length ? 10 : holders?.length;
                        setSliceCount({ ...sliceCount, end })
                    }
                }} variant={BadgeVariant.RED_WHITE}>{holders?.length === sliceCount?.end ? 'Hide' : 'Show'} All Top 50</Badge>}
            </div>}
        </DarkCard>
    )
}