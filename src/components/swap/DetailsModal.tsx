import { AlertTriangle, CheckCircle, Percent, X } from 'react-feather';
import Badge, { BadgeVariant } from 'components/Badge';
import { ExternalLink, ExternalLinkIcon } from 'theme';
import { LoadingRows, LoadingSkeleton } from 'pages/Pool/styleds';
import { fetchBscTokenData, useBnbPrices } from 'state/logs/bscUtils';
import { getTokenData, useEthPrice, useTokenData } from 'state/logs/utils';

import { DarkCard } from 'components/Card';
import Modal from 'components/Modal';
import React from 'react';
import { Token } from 'state/transactions/hooks';
import { TopTokenHolders } from 'components/TopTokenHolders/TopTokenHolders';
import _ from 'lodash'
import moment from 'moment';
import styled from 'styled-components/macro'
import { useContractOwner } from './ConfirmSwapModal';
import useTheme from 'hooks/useTheme'
import { useTokenInfo } from './ChartPage';
import { useWeb3React } from '@web3-react/core';

const StyledHeader = styled.div<{ size?: 'lg' }>`
    font-family: "Open Sans";
    font-size:${(props) => props?.size ? '16px' : '14px'};
`

export const RENOUNCED_ADDRESSES = [
    '0x000000000000000000000000000000000000dEaD',
    '0x0000000000000000000000000000000000000000'
]


const RenderRecursive = ({ thekey, object }: { thekey: keyof any, object: Record<string, any> }) => {
    const obj = (object as any)
    return (typeof obj[thekey] == 'object') ? (
        <div style={{display:'flex', flexFlow: `row wrap`, alignItems:"center", justifyContent:'stretch', gap: 15}}>
            <Badge style={{width:'100%'}}>{thekey}</Badge>
            <hr style={{color:"#444"}}/>
            {Object.keys(obj[thekey]).map(subkey => (
                <RenderRecursive thekey={subkey} key={subkey} object={obj[thekey]} />
            ))}
        </div>
    ) : (
        <div style={{padding:2}}>
            <StyledHeader>{_.startCase(thekey?.toString())}</StyledHeader>
            <Badge variant={BadgeVariant.HOLLOW}>{((obj as any)?.[thekey])}</Badge>
        </div>
    )
}

export const DetailsModal = ({
    token,
    network,
    symbol,
    address,
    isOpen,
    onDismiss
}: {
    token: Token,
    network: 'bsc' | 'eth',
    symbol: string,
    address: string,
    isOpen: boolean,
    onDismiss: () => void
}) => {
    const theme = useTheme()
    const { chainId } = useWeb3React()
    const owner = useContractOwner(address, network.toLowerCase() as 'bsc' | 'eth' | undefined)
    const isEqualShallow = React.useCallback(
        (address: string) => _.isEqual(owner.toLowerCase(), address.toLowerCase()),
        [owner])

    const isRenounced = React.useMemo(() => RENOUNCED_ADDRESSES.some(isEqualShallow), [owner, isEqualShallow])
    const bnbPrice = useBnbPrices()
    const [ethPrice, ethPriceOld] = useEthPrice()
    const tokenData = useTokenData(address, 10000)
    const [loadedTokenData, setLoadedTokenData] = React.useState(Boolean(tokenData))

    const LIQUIDITY_ENDPOINT = `https://team-finance-backend-origdfl2wq-uc.a.run.app/api/app/explorer/search?network=ethereum&chainId=0x1&input=${symbol}&skip=0&limit=15&order=4`
    const [lockedMap, setLockedMap] = React.useState<any>()
    const CIRCULATING_SUPPLY = React.useMemo(() => {
        if (!lockedMap?.token?.tokenCirculatingSupply) return undefined
        return Number(lockedMap?.token?.tokenCirculatingSupply)
    }, [lockedMap])
    React.useEffect(() => {
        fetch(LIQUIDITY_ENDPOINT, { method: "GET" })
            .then((response) => response.json())
            .then((data) => {
                const tokenLock = data?.data?.pagedData?.some((item: any) => item?.token?.tokenAddress?.toLowerCase() === address?.toLowerCase());
                if (tokenLock) setLockedMap(data?.data?.pagedData?.find((item: any) => item?.token?.tokenAddress?.toLowerCase() === address?.toLowerCase()))
            })
    }, [])

    const tokenInfo = useTokenInfo(network == 'eth' ? 1 : network == 'bsc' ? 56 : 1, address)

    const MARKET_CAP = React.useMemo(() => {
        const price = tokenData?.priceUSD || tokenInfo?.price || token.screenerToken?.priceUsd
        if (!CIRCULATING_SUPPLY || !price) return undefined
        return `$${(CIRCULATING_SUPPLY * Number(price)).toLocaleString()}`
    }, [CIRCULATING_SUPPLY, tokenData])

    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss}>
            <DarkCard style={{ height: '100%', color: theme.text1 }}>
                {!loadedTokenData && <LoadingSkeleton count={6} />}
                {!!loadedTokenData && (
                    <>
                        <div style={{ display: 'flex', marginBottom: 15, justifyContent: 'space-between' }}>
                            <div><StyledHeader size='lg'>{tokenData?.name ?? 'N/A'} ({symbol}) Details</StyledHeader> <br />
                                <StyledHeader>Lock details are provided utilizing <a style={{ background: theme.backgroundInteractive, color: theme.text1 }} href={"https://team.finance"}>Team Finances</a> interface.</StyledHeader>
                            </div>
                            <X style={{ cursor: 'pointer' }} onClick={onDismiss} />
                        </div>

                        <div style={{ marginBottom: 30 }}>
                            <TopTokenHolders address={address} chainId={chainId} />
                        </div>
                        <div style={{ borderRadius: 12, border: `1px solid #444`, padding: '1rem', maxWidth: '100%', marginTop: '.25rem', display: 'flex', flexFlow: 'column wrap' }}>
                            <div style={{ display: 'grid', justifyContent: 'space-between', gridTemplateColumns: 'auto auto', columnGap: 35 }}>
                                <ul style={{ display: 'flex', gap: 18, flexFlow: 'row wrap', alignItems: 'center', listStyle: 'none', padding: 5 }}>
                                    {owner &&  <li style={{ borderBottom: '1px solid #444', paddingLeft: 0, marginBottom: 10 }}>
                                        <StyledHeader style={{ display: 'flex', flexFlow: 'column wrap' }}>Contract Owner &nbsp; <small>
                                            <Badge style={{ marginBottom: 10, marginRight: 5 }} variant={isRenounced ? BadgeVariant.POSITIVE_OUTLINE : BadgeVariant.WARNING_OUTLINE}>{isRenounced ? 'Renounced' : 'Not Renounced'}</Badge>
                                            <Badge variant={BadgeVariant.DEFAULT}><ExternalLink style={{ color: theme.text1 }} href={`${network.toLowerCase() === 'bsc' ? 'https://bscscan.com/address/' : 'https://etherscan.io/address/'}${owner}`}> {owner !== '?' && owner.substring(0, 8) + '...' + owner.substring(34, 42)} </ExternalLink>  <ExternalLinkIcon href={`${network.toLowerCase() === 'bsc' ? 'https://bscscan.com/address/' : 'https://etherscan.io/address/'}${owner}`} style={{ display: 'inline-block' }} /></Badge></small> </StyledHeader>

                                    </li>}

                                    {!!tokenData?.totalLiquidityUSD && tokenData?.totalLiquidityUSD > 0 && <li style={{ paddingLeft: 0, marginBottom: 10 }}>
                                        <StyledHeader>Paired Liquidity Value (USD)</StyledHeader>
                                        <Badge variant={BadgeVariant.HOLLOW}>${Number(tokenData?.totalLiquidityUSD * 2).toLocaleString()}</Badge>
                                    </li>}
                                    {MARKET_CAP && <li style={{ borderBottom: '1px solid #444', marginBottom: 10 }}><StyledHeader>MarketCap</StyledHeader> <Badge variant={BadgeVariant.HOLLOW}>{MARKET_CAP}</Badge></li>}
                                    {lockedMap && <li style={{ borderBottom: '1px solid #444', marginBottom: 10 }}><StyledHeader>Circulating Supply</StyledHeader> <Badge variant={BadgeVariant.HOLLOW}>{Number(lockedMap?.token?.tokenCirculatingSupply).toLocaleString()}</Badge></li>}


                                    {[NaN, 0].includes(Number(tokenData?.priceUSD)) === false && <li style={{ paddingLeft: 0, marginBottom: 10 }}>
                                        <StyledHeader>Price (USD)</StyledHeader>
                                        <Badge variant={BadgeVariant.HOLLOW}>{Number(tokenData?.priceUSD).toFixed(18)}</Badge>
                                    </li>}


                                    {!!token && !!token.screenerToken && Object.keys(token?.screenerToken || {})?.filter((key) => !['symbol', 'name', 'decimals', 'typename', '__typename', 'id'].includes(key.toLowerCase()) && !key?.toLowerCase()?.includes('type') && Boolean(key)).map((key) => (
                                        <li key={key} style={{ paddingLeft: 0, marginBottom: 10 }}>
                                            <RenderRecursive thekey={key} object={token?.screenerToken || {}} />
                                        </li>
                                    ))}

                                </ul>
                                {!lockedMap && <ul style={{ listStyle: 'none', paddingLeft: 0, padding: 3 }}>
                                    <li style={{ paddingLeft: 0 }}>
                                        <StyledHeader>Liquidity Locked?</StyledHeader>
                                        <small>                                                 <Badge style={{ color: theme.text1 }} variant={BadgeVariant.RED_WHITE}>NOT FOUND <AlertTriangle /></Badge></small>
                                    </li>
                                </ul>}
                                {lockedMap &&
                                    <ul style={{ listStyle: 'none', paddingLeft: 0, padding: 3 }}>
                                        <li style={{ borderBottom: '1px solid #444', paddingLeft: 0, paddingBottom: 10 }}>
                                            <StyledHeader>Liquidity Locked?</StyledHeader>
                                            <small>                                                 <Badge variant={BadgeVariant.POSITIVE_OUTLINE}>LOCKED <CheckCircle /></Badge></small>
                                        </li>
                                        <li style={{ borderBottom: '1px solid #444', paddingLeft: 0, paddingBottom: 10 }}>
                                            <StyledHeader>Locked Amount (USD)</StyledHeader>
                                            <Badge variant={BadgeVariant.HOLLOW}>${Number(lockedMap.token?.liquidityLockedInUsd).toLocaleString()}</Badge>
                                        </li>
                                        <li style={{ borderBottom: '1px solid #444', paddingLeft: 0, paddingBottom: 10 }}>
                                            <StyledHeader>Locked Percentage</StyledHeader>
                                            <Badge variant={BadgeVariant.HOLLOW}>{Number(lockedMap.token?.liquidityLockedInPercent * 100).toLocaleString() === '1' ? `100` : Number(lockedMap.token?.liquidityLockedInPercent * 100).toLocaleString()} <Percent /></Badge>
                                        </li>
                                        <li style={{ paddingLeft: 0, paddingBottom: 10 }}>
                                            <StyledHeader>Unlock Date</StyledHeader>
                                            <Badge variant={BadgeVariant.HOLLOW}>{moment(+lockedMap.event?.unlockTime * 1000).toDate().toLocaleString()}</Badge>
                                        </li>
                                    </ul>}
                            </div>
                        </div>
                    </>
                )}
            </DarkCard>
        </Modal>
    )
}
