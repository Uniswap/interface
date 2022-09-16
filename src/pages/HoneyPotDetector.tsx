import * as ethers from 'ethers'

import { AlertCircle, AlertOctagon, CheckCircle, ChevronDown, ChevronUp, Globe, Info } from "react-feather";
import Badge, { BadgeVariant } from "components/Badge";
import React, { useState } from "react";

import { AutoColumn } from "components/Column";
import { CFormInput } from "@coreui/react";
import { CardSection } from "components/earn/styled";
import { DarkCard } from "components/Card";
import { HoneyPotBsc } from "components/HoneyPotBSC";
import Loader from 'components/Loader';
import { RowFixed } from "components/Row";
import Swal from "sweetalert2";
import { TYPE } from "theme";
import Tooltip from "components/Tooltip";
import { TopTokenHolders } from "components/TopTokenHolders/TopTokenHolders";
import Web3 from "web3";
import axios from 'axios';
import { getTokenTaxes } from "./HoneyUtils";
import { isAddress } from "utils";
import { number } from '@lingui/core/cjs/formats';
import styled from 'styled-components/macro'
import { useContractOwner } from "components/swap/ConfirmSwapModal";
import { useKiba } from "./Vote/VotePage";
import useTheme from "hooks/useTheme";
import { useTokenData } from "state/logs/utils";
import { useTokenInfo } from "components/swap/ChartPage";
import { useWeb3Endpoint } from "./Charts/PairSearch";
import { useWeb3React } from "@web3-react/core";

export type GetMaxesResponse = { BuyGas: number, BuyTax: number, Error: any, IsHoneypot: boolean, MaxTxAmount: number, MaxTxAmountBNB: number, SellGas: number, SellTax: number } | undefined

export const getMaxes = async (value: string, chain = 'eth'): Promise<GetMaxesResponse> => {
    if (!value) return 
    const response = await axios.get<{ BuyGas: number, BuyTax: number, Error: any, IsHoneypot: boolean, MaxTxAmount: number, MaxTxAmountBNB: number, SellGas: number, SellTax: number }>(`https://aywt3wreda.execute-api.eu-west-1.amazonaws.com/default/IsHoneypot?chain=${chain}&token=${value}` , {

    });

    return response.data
}

const Footer = styled.div`
  position: relative;
  bottom: 0;
  width: 100%;
  font-family: 'Open Sans';
  font-size:14px;
  border-radius: 20px;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-top: 1px solid ${({ theme }) => theme.bg3};
  padding: 20px;
  text-align: center;
`


const StyledHeader = styled.div`
  font-family:"Open Sans";
  font-size:14px;
`
export const HoneyPotDetector = () => {
    const WEB3_ENDPOINT = useWeb3Endpoint()
    const { account, chainId, library } = useWeb3React();
    const kibaBalance = useKiba(account)
    const [msg, setMsg] = useState('')
    const [honeyData, setHoneyData] = React.useState<any>({})
    let provider = library?.provider
    if (!provider) {
        const { JsonRpcProvider } = ethers.providers;
        provider = new JsonRpcProvider(WEB3_ENDPOINT);
    }
    const web3 = new Web3(provider);
    const [scanning, setScanning] = React.useState(false)
    const tokenData = useTokenData(msg)
    const tokenInfo = useTokenInfo(chainId, msg)
    const [showTip, setShowTip] = React.useState(false)
    const contractOwner = useContractOwner(msg)
    const [priceDetailsOpen, setPriceDetailsOpen] = React.useState(!!tokenInfo?.price)
    const runCheck = async (value: string) => {
        if (!value) {
            setScanning(false)
            setHoneyData({})
            setMsg('');
            return;
        };
        if (isAddress(value.toLowerCase())) {
            setMsg(value);
            setScanning(true)
          
            const response = { data: (await getMaxes(value) || {}) as any }

            const isHoneypot = response?.data?.IsHoneypot
            const tokenSymbol = '';
            const tokenDecimals = 0;
            const maxSell = 0;
            const maxTXAmount = 0;
            const bnbIN = 1000000000000000000;
            const honey_data: Record<string, any> = {}
            const maxTxBNB = null;
            honey_data['isHoneyPot'] = isHoneypot
            honey_data['buyTax'] = response?.data?.BuyTax
            honey_data['sellTax'] = response?.data?.SellTax
            honey_data['maxTxAmount'] = response?.data?.MaxTxAmount
            honey_data["error"] = response?.data?.Error
            if (response?.data?.SellTax > 90) {
                honey_data['isHoneyPot'] = true
            }
            if (maxTXAmount != 0 || maxSell != 0) {
                let n = 'Max TX';
                let x = maxTXAmount;
                honey_data['maxTxAmount'] = maxTXAmount;
                if (maxSell != 0) {
                    n = 'Max Sell';
                    x = maxSell;
                    honey_data['maxSell'] = maxSell;
                }
                let bnbWorth = '?'
                if (maxTxBNB != null) {
                    bnbWorth = (Math.round(maxTxBNB / 10 ** 15) / 10 ** 3).toString();
                }
                const tokens = Math.round(x / 10 ** tokenDecimals);
                honey_data['isHoneyPot'] = false;
            }
            honey_data['ran'] = true;
            setHoneyData(honey_data)
            setScanning(false)

        } else {
            Swal.fire({ title: "The address you entered was not a contract address", icon: 'error', toast: true, timer: 5000, timerProgressBar: true, showConfirmButton: false })
            setHoneyData({})
            setMsg('');
            setScanning(false)
        }
    }
    const setPriceDetailsOpenFn = () => setPriceDetailsOpen(!priceDetailsOpen);
    const hasInvalidPermissions = !account || (!!kibaBalance && +kibaBalance?.toFixed(0) <= 0)
    const theme = useTheme()
    const asyncInputChange = async (e: any) => await runCheck(e.target.value)

    if (chainId === 56) return <HoneyPotBsc />
    return (<DarkCard style={{ position: 'relative', background: theme.bg0, color: theme.text1, opacity: '.96', maxWidth: 600, width: '100%', padding: 20 }} id="honeypage">
        <div style={{ maxWidth: 600, display: 'flex', flexFlow: 'column wrap', margin: 'auto', paddingBottom: '1rem' }}>
            <StyledHeader style={{ fontSize: 15, paddingBottom: 20, paddingTop: 20 }}>Honeypot Checker (ETH)</StyledHeader>
            <Footer>
                <TYPE.darkGray>Disclaimer: This is an experimental service, use at your own risk and make sure to double check all contract interactions.</TYPE.darkGray>
            </Footer>
        </div>
        <RowFixed style={{ maxWidth: 600, width: "100%", padding: 20 }} >
            {hasInvalidPermissions === false &&
                <AutoColumn style={{ maxWidth: 600, width: "100%" }} gap={'md'}>
                    <label>Input a contract address to check if its a honeypot</label>
                    <CFormInput style={{ padding: 8, width: '100%', marginBottom: 5 }} type={'search'} placeholder={"Input a contract address to check if a honeypot"} onChange={asyncInputChange} />
                </AutoColumn>
            }

            {hasInvalidPermissions &&
                <p style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>You must hold Kiba Inu tokens in order to use this feature.
                </p>}
        </RowFixed>
        {scanning && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
                <TYPE.small>Determining honeypot status.. &nbsp;
                </TYPE.small>
                <Loader />
            </div>
        )}
        {!scanning && hasInvalidPermissions === false && <>
            <RowFixed>
                <AutoColumn style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexFlow: 'row wrap',
                    padding: '9px 14px',
                    columnGap: 3,
                    gap: 3
                }}>
                    {honeyData &&
                        honeyData['ran'] &&
                        honeyData['isHoneyPot'] && (
                            <div style={{
                                borderRadius: 12,
                                padding: '1rem',
                                border: `1px solid ${theme.error}`,
                                columnGap: 10,
                                flexFlow: 'row wrap',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Badge variant={BadgeVariant.NEGATIVE}>
                                    <AlertOctagon style={{ color: '#FFF' }} /> &nbsp;HONEY POT DETECTED
                                </Badge>
                                <TYPE.italic>
                                    {tokenData?.symbol && <>{tokenData?.name} &nbsp; ({tokenData?.symbol}) is not safe!</>}
                                </TYPE.italic>
                                {honeyData?.error && <TYPE.small><span style={{ color: 'red' }}>Error</span> encountered: {honeyData?.error}</TYPE.small>}
                            </div>
                        )}
                    {honeyData && honeyData['ran'] && !honeyData['isHoneyPot'] && <Badge variant={BadgeVariant.POSITIVE} style={{ textAlign: 'center', display: 'flex' }}><CheckCircle /> This is not a honey pot. </Badge>}
                    {honeyData && honeyData['ran'] && contractOwner && <div style={{ paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
                        <div style={{ marginRight: '8px' }}>
                            <Badge variant={contractOwner === '0x0000000000000000000000000000000000000000' ? BadgeVariant.POSITIVE : BadgeVariant.WARNING}>Ownership {contractOwner !== '0x0000000000000000000000000000000000000000' && <> NOT </>} Renounced &nbsp; <Tooltip show={showTip} text={<TYPE.small color={'text1'}>{'The contract is owned by '} <a href={`https://etherscan.io/address/${contractOwner}`}>{contractOwner}</a> </TYPE.small>}> <Info onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setTimeout(() => setShowTip(false), 1500)} /></Tooltip></Badge>
                        </div>
                    </div>
                    }
                    {honeyData && +honeyData['buyTax'] > 0 && <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
                        <div style={{ marginRight: '8px' }}>
                            <StyledHeader>Buy Tax <br /> {honeyData['buyTax']}% </StyledHeader>
                        </div>
                        <div style={{ marginRight: '8px' }}>
                            <StyledHeader>Sell Tax <br /> {honeyData['sellTax']}% </StyledHeader>
                        </div>

                        {honeyData && Boolean(honeyData['maxTxAmount']) && <div style={{ marginRight: '8px' }}>
                            <StyledHeader>Max Transaction <br /> {honeyData['maxTxAmount']} </StyledHeader>
                        </div>}

                        {honeyData && Boolean(honeyData['maxSell']) && <div style={{ marginRight: '8px' }}>
                            <StyledHeader>Max Sell <br /> {honeyData['maxSell']} </StyledHeader>
                        </div>}
                    </div>}


                    {tokenInfo && <div style={{ display: 'flex', flexFlow: 'row wrap' }}>
                        <div style={{ display: 'flex', flexFlow: 'row wrap', gap: 2, alignItems: 'center' }}><StyledHeader>Website</StyledHeader><a title={!tokenInfo?.website ? 'Website not found' : `${tokenInfo?.symbol} website`} style={{ cursor: !tokenInfo?.website ? 'not-allowed' : 'pointer' }} href={tokenInfo.website}>{tokenInfo?.website ? <Globe /> : <AlertCircle />}</a> </div>
                    </div>}

                </AutoColumn>
            </RowFixed>
            {msg &&
                <TopTokenHolders address={msg} chainId={chainId} />
            }
            {!!tokenInfo && typeof (tokenInfo.price) === 'object' && (
                <div style={{ background: theme.bg0, color: theme.text1, padding: 10 }}>
                    <StyledHeader onClick={setPriceDetailsOpenFn} style={{ filter: priceDetailsOpen ? 'drop-shadow(2px 4px 6px #eee)' : 'none', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}>Price Details {priceDetailsOpen ? <ChevronUp /> : <ChevronDown />} </StyledHeader>
                    {priceDetailsOpen && <RowFixed style={{ paddingRight: '0.5rem', paddingLeft: '0.5rem', maxWidth: 600, width: "100%" }}>
                        <AutoColumn style={{
                            display: 'flex',
                            justifyContent: 'stretch',
                            alignItems: 'center',
                            flexFlow: 'row wrap',
                            padding: '9px 14px',
                            marginTop: 10,
                            columnCount: 2,
                            columnGap: 12,
                            rowGap: 12
                        }}>
                            {!!tokenInfo && typeof (tokenInfo?.price) === 'object' && (
                                <>
                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Price</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>${tokenInfo.price.rate.toFixed(12)}</Badge></div>
                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Volume (24h)</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>${tokenInfo.price.volume24h.toLocaleString()}</Badge></div>
                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Total Supply</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>{(tokenInfo.totalSupply / 10 ** 9).toLocaleString()}</Badge></div>
                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Market Cap</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>${((tokenInfo.totalSupply / 10 ** 9) * tokenInfo.price.rate).toLocaleString()}  </Badge></div>

                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Price Change % (24hr)</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} />} {tokenInfo.price.diff}%</Badge></div>
                                    <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Price Change % (1 week)</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff7d >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} />} {tokenInfo.price.diff7d}%</Badge></div>
                                    {tokenInfo.price.diff30d && <div style={{ display: 'flex', flexFlow: 'column' }}><StyledHeader>Price Change % (1 month)</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff30d >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} />} {tokenInfo.price.diff30d}%</Badge></div>}
                                </>
                            )}

                        </AutoColumn>
                    </RowFixed>}
                </div>
            )}
        </>
        }
    </DarkCard>
    )
}
