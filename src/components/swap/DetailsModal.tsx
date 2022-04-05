import { DarkCard } from 'components/Card';
import Modal from 'components/Modal';
import React from 'react';
import { getTokenData, useEthPrice, useTokenData } from 'state/logs/utils';
import { useContractOwner } from './ConfirmSwapModal';
import styled from 'styled-components/macro'
import { X, Percent, CheckCircle, AlertTriangle } from 'react-feather';
import Badge, { BadgeVariant } from 'components/Badge';
import { fetchBscTokenData, useBnbPrices } from 'state/logs/bscUtils';
import { LoadingRows } from 'pages/Pool/styleds';
import moment from 'moment';
import { ExternalLink, ExternalLinkIcon } from 'theme';
const StyledHeader = styled.div<{ size?: 'lg' }>`
    font-family: "Bangers", cursive;
    font-size:${(props) => props?.size ? '28px' : '20px'};
`

export const DetailsModal = ({
    network,
    symbol,
    address,
    isOpen,
    onDismiss
}: {
    network: 'bsc' | 'eth',
    symbol: string,
    address: string,
    isOpen: boolean,
    onDismiss: () => void
}) => {
    const owner = useContractOwner(address, network.toLowerCase() as 'bsc' | 'eth' | undefined)
    const isRenounced = React.useMemo(() => owner === '0x0000000000000000000000000000000000000000', [owner])
    const [tokenData, setTokenData] = React.useState<any>()
    const bnbPrice = useBnbPrices()
    const [ethPrice, ethPriceOld] = useEthPrice()
    const [loadedTokenData, setLoadedTokenData] = React.useState(false)
    React.useEffect(() => {
        const func = async () => {
            if (ethPrice && ethPriceOld && !tokenData) {
                const tokenDataFn = network?.toLowerCase() === 'bsc' ? fetchBscTokenData : network?.toLowerCase() === 'eth' ? getTokenData : (add: string, p1: any, p2: any) => ({ totalLiquidity: undefined });
                const [price1, price2] = network?.toLowerCase() === 'bsc' ? [bnbPrice?.current, bnbPrice?.current] : [ethPrice, ethPriceOld]
                const tokenData = await tokenDataFn(address, price1, price2);
                setTokenData(tokenData);
                console.log(tokenData)
                setLoadedTokenData(true)
            }
        }
        func();
    }, [ethPrice, ethPriceOld])

    const LIQUIDITY_ENDPOINT = `https://team-finance-backend-origdfl2wq-uc.a.run.app/api/app/explorer/search?network=ethereum&chainId=0x1&input=${symbol}&skip=0&limit=15&order=4`
    const [lockedMap, setLockedMap] = React.useState<any>()
    React.useEffect(() => {
        fetch(LIQUIDITY_ENDPOINT, { method: "GET" })
            .then((response) => response.json())
            .then((data) => {
                const tokenLock = data?.data?.pagedData?.some((item: any) => item?.token?.tokenAddress?.toLowerCase() === address?.toLowerCase());
                if (tokenLock) setLockedMap(data?.data?.pagedData?.find((item: any) => item?.token?.tokenAddress?.toLowerCase() === address?.toLowerCase()))
            })
    }, [])
   
    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss}>
            <DarkCard>
                {!loadedTokenData && <LoadingRows>
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                </LoadingRows>}
                {!!loadedTokenData && (
                    <>
                        <div style={{ display: 'flex', marginBottom: 15, justifyContent: 'space-between' }}>
                            <div><StyledHeader size='lg'>{tokenData?.name ?? 'N/A'} ({symbol}) Details</StyledHeader> <br/>
                            <StyledHeader>Lock details are provided utilizing <a href={"https://team.finance"}>Team Finances</a> interface.</StyledHeader>
                         </div>
                            <X onClick={onDismiss} />
                        </div>

                        <div style={{ maxWidth: 600, padding: '9px 14px', display: 'flex', flexFlow: 'column wrap' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 150, justifyContent: 'center' }}>
                                <ul style={{ listStyle: 'none', padding: 3 }}>
                                    {owner && owner !== '?' && <li style={{marginBottom:10}}>
                                        <StyledHeader>Contract Owner &nbsp; <small>
                                            <Badge style={{marginBottom:10}} variant={isRenounced ? BadgeVariant.POSITIVE_OUTLINE : BadgeVariant.WARNING_OUTLINE}>{isRenounced ? 'Renounced' : 'Not Renounced'}</Badge><Badge variant={BadgeVariant.DEFAULT}><ExternalLink style={{color:"#FFF"}} href={`${network.toLowerCase() === 'bsc' ? 'https://bscscan.com/address/' : 'https://etherscan.io/address/'}${owner}`}> {owner !== '?' && owner.substring(0, 8) + '...' + owner.substring(34, 42)} </ExternalLink>  <ExternalLinkIcon  href={`${network.toLowerCase() === 'bsc' ? 'https://bscscan.com/address/' : 'https://etherscan.io/address/'}${owner}`} style={{display: 'inline-block'}}/></Badge></small> </StyledHeader>

                                    </li>}
                                    {!!tokenData?.totalLiquidityUSD && tokenData?.totalLiquidityUSD > 0 && <li style={{marginBottom:10}}>
                                        <StyledHeader>Liquidity (USD)</StyledHeader>
                                        <Badge variant={BadgeVariant.POSITIVE}>{Number(tokenData?.totalLiquidityUSD * 2).toLocaleString()}</Badge>
                                    </li>}
                                    {lockedMap && <li style={{marginBottom:10}}><StyledHeader>Circulating Supply</StyledHeader> <Badge variant={BadgeVariant.DEFAULT}>{Number(lockedMap?.token?.tokenCirculatingSupply).toLocaleString()}</Badge>
                                    </li>}
                                    {[NaN, 0].includes(Number(tokenData?.priceUSD))===false && <li style={{marginBottom:10}}>
                                        <StyledHeader>Price (USD)</StyledHeader>
                                        <Badge variant={BadgeVariant.DEFAULT}>{Number(tokenData?.priceUSD).toFixed(18)}</Badge>
                                    </li>}
                                </ul>
                                {!lockedMap && <ul style={{ listStyle: 'none', padding: 3 }}>
                                    <li>
                                        <StyledHeader>Liquidity Locked?</StyledHeader>
                                        <small>                                                 <Badge variant={BadgeVariant.RED_WHITE}>NOT FOUND <AlertTriangle /></Badge></small>
                                    </li>
                                </ul>}
                                {lockedMap &&
                                    <ul style={{ listStyle: 'none', padding: 3 }}>
                                        <li style={{marginBottom:10}}>
                                            <StyledHeader>Liquidity Locked?</StyledHeader>
                                            <small>                                                 <Badge variant={BadgeVariant.POSITIVE_OUTLINE}>LOCKED <CheckCircle /></Badge></small>
                                        </li>
                                        <li style={{marginBottom:10}}> 
                                            <StyledHeader>Locked Amount (USD)</StyledHeader>
                                            <Badge variant={BadgeVariant.DEFAULT}>${Number(lockedMap.token?.liquidityLockedInUsd).toLocaleString()}</Badge>
                                        </li>
                                        <li style={{marginBottom:10}}>
                                            <StyledHeader>Locked Percentage</StyledHeader>
                                            <Badge variant={BadgeVariant.DEFAULT}>{Number(lockedMap.token?.liquidityLockedInPercent * 100).toLocaleString() === '1' ? `100` : Number(lockedMap.token?.liquidityLockedInPercent * 100).toLocaleString()} <Percent /></Badge>
                                        </li>
                                        <li style={{marginBottom:10}}>
                                            <StyledHeader>Unlock Date</StyledHeader>
                                            <Badge variant={BadgeVariant.DEFAULT}>{moment(+lockedMap.event?.unlockTime * 1000).toDate().toLocaleString()}</Badge>
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
