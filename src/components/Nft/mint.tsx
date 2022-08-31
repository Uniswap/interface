import './styles.css'

import * as ethers from 'ethers'

import { ButtonPrimary, ButtonSecondary } from 'components/Button'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import { Circle, ExternalLink, Info, Star } from 'react-feather'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import React, { useEffect } from 'react'

import Badge from 'components/Badge'
import { DarkCard } from 'components/Card'
import { KIBA_NFT_CONTRACT } from 'constants/addresses'
import Marquee from "react-marquee-slider";
import { NftGrid } from './NftGrid'
import { TYPE } from 'theme'
import { Trans } from '@lingui/macro'
import Transaction from 'components/AccountDetails/Transaction'
import axios from 'axios'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from 'hooks/web3'
import { useKibaNFTContract } from 'hooks/useContract'
import { useParams } from 'react-router-dom'
import useTheme from 'hooks/useTheme'
import { useTransactionAdder } from '../../state/transactions/hooks'

const CardWrapper = styled.div`
min-width: 190px;
width:100%;
margin-right: 16px;
padding:3px;
display:block;
`
const ConfirmOrLoadingWrapper = styled.div<{ activeBG: boolean }>`
  width: 100%;
  padding: 3px;
  position: relative;
  background: #252632;
`


const NoNfts = styled.div`
  align-items: center;
  display: flex;
  justify-content: start;
  margin: auto;
  max-width: 100%;
`

const Panel = styled.div<{ active: boolean }>`
  background: ${(props) => props.active ? '#F76C1D' : '#ccc'};
  color: ${(props) => props.active ? '#fff' : '#222'};
  padding:15px;
  width: ${props => window.innerWidth <= 768 ? '100%' : '50%'};
  opacity: ${props => props.active ? '1' : '0.7'};
  :hover {
      color: ${props => props.active ? '#EEE' : '#F76C1D'};
      opacity:1;
      cursor:pointer;
  }
  display:block;
  zIndex: 999999;
`

type OpenSeaLinkProps = {
    link?: string
    size?: number
    showFloor?: boolean
    floorPrice?:number
}

export const OpenSeaLink = (props: OpenSeaLinkProps) => {
    const {link, size, showFloor, floorPrice} = props
    const showFloorElm = Boolean(floorPrice && showFloor)
    const linkToUse = !link ? "https://opensea.io/collection/kiba-inu-genesis-i" : link
    const widthToUse = !size ? 40 : size
    return (
        <div style={{display:'flex', gap:10, justifyContent:'space-between', alignItems:'center'}}>
        <a style={{zIndex:9999, cursor:'pointer'}} href={linkToUse}>
            <img src={'https://opensea.io/static/images/logos/opensea.svg'} style={{maxWidth: '100%', width: widthToUse, height: 'auto', borderRadius:10, border: `1px solid transparent` }} />
        </a>
        {showFloorElm ? (
            <Badge>Floor Price {floorPrice}</Badge>
        ) : null}
        </div>
    )
}

export const useFloorPrice = () => {
    const [floorPrice, setFloorPrice] = React.useState<any>()
    const getData = React.useCallback(async () => {
       const url = `https://api.opensea.io/api/v1/collection/kiba-inu-genesis-i` 
       const response = await axios.get<{
           collection?: {
                stats?: { floor_price?: any} 
            }
        }>(url)

       const floor = response.data.collection?.stats?.floor_price
       console.log(`floor.price`, floor)
       return floor
    }, [])

    useEffect(() => {
        getData().then(setFloorPrice)
    }, [getData])

    return floorPrice
}

export const Mint: React.FC<any> = () => {
    const theme = useTheme()
    const { account, chainId } = useActiveWeb3React()
    const kibaNftContract = useKibaNFTContract()
    const params = useParams<{ referrer: string }>()
    const floorPrice = useFloorPrice()

    //statex
    const [hasEnoughTokensForEarlyMint, setHasEnoughTokensForEarlyMint] = React.useState(false)
    const [amountToMint, setAmountToMint] = React.useState(1)
    const [activeTab, setActiveTab] = React.useState<'mint' | 'nfts'>('mint')
    const [isMintingLive, setIsMintingLive] = React.useState(false)
    const [mintedTx, setMintedTx] = React.useState<any>({})
    const [isWhitelistMintingLive, setIsWhitelistMintingLive] = React.useState(false)
    const [accountWhitelisted, setAccountWhitelisted] = React.useState(false)
    const [flex, setFlex] = React.useState({ flexFlow: 'row wrap' })
    const [totalSupply, setTotalSupply] = React.useState(111);
    const addTransaction = useTransactionAdder()
    const [minting, setMinting] = React.useState(false)
    const [currentSupply, setCurrentSupply] = React.useState(0);
    // if false they already minted.
    const [canMint, setCanMint] = React.useState(true)
    const MAX = 5;
    const getBackgroundSize = () => {
        return {
            backgroundSize: `${(amountToMint * 100) / MAX}% 100%`,
            height: `auto`,
            marginLeft: 30
        };
    };

    async function getCanMint(account: string): Promise<boolean> {
        return new Promise((res, rej) => {
            kibaNftContract.canMint(account).then((response: any) => {
                const canMint =Boolean(response)
                return res(canMint)
            }).catch((e:any) => {
                console.error(e)
                rej(e)
            })
        })
    }

    async function getTotalSupply(): Promise<number> {
        return new Promise((res, rej) => {
            kibaNftContract.totalSupply().then((response: any) => {
                const number = ethers.BigNumber.from(response).toNumber()
                console.log(number)
                return res((number))
            }).catch((e:any) => {
                console.error(e)
                rej(e)
            })
        })
    }

    //sideffects
    useEffect(() => {
        if (kibaNftContract && account) {
            // determine if minting is live for everyone
            kibaNftContract.isActive().then((response: any) => {
                console.log(`$minting active?`, response)
                setIsMintingLive(!!(response))
            })
            // determine if whitelist minting is available for the connected account
            kibaNftContract.isWhitelistActive().then((response:any) => {
                console.log(`Whitelist minting active?`, response)
                setIsWhitelistMintingLive(Boolean(response))
                // if whitelist active, check if account was whitelisted..
                if (Boolean(response)) {
                    kibaNftContract.isAccountWhitelisted(account).then((response:any) => {
                        console.log(`${account} whitelisted?`, response)
                        setAccountWhitelisted(Boolean(response))
                    })
                }
            })

            
        }
    }, [account, kibaNftContract])

    useEffect(() => {
        if (kibaNftContract && account) {
            getCanMint(account).then(setCanMint)
        }
    }, [kibaNftContract, account, getCanMint])

    useEffect(() => {
        if (kibaNftContract) {
            getTotalSupply().then(setCurrentSupply)
        }
    }, [kibaNftContract, getTotalSupply])

    useEffect(() => {
        // initially focus the mint textbox
        if (activeTab === 'mint' && document.getElementById('mintRef'))
            document.getElementById("mintRef")?.focus()
    }, [activeTab])

    useEffect(() => {
        const flexStyle = window.innerWidth <= 768 ? 'column wrap' : 'row wrap';
        setFlex({ flexFlow: flexStyle })
    }, [window.innerWidth])

    // memos
    const isMintingDisabled = React.useMemo(() => {
        // check amt to mint
        if (amountToMint == 0 || amountToMint > 5) return true;
        // if minting is completed
        if (currentSupply === 111) return true;
        // if they are whitelisted, whitelst minting is active, and they havent minted
        if (isWhitelistMintingLive && accountWhitelisted && canMint) return false;
        // if minting is live, and they havent minted
        if (isMintingLive && canMint) return false;
        // if minting is not live
        if (!isMintingLive) return true;
        // if whitelist minting is not live, or is live but account not whitelisted
        if (!isWhitelistMintingLive || (isWhitelistMintingLive && !accountWhitelisted)) return true;
        return false;
    }, [isMintingLive, currentSupply, canMint, isWhitelistMintingLive, accountWhitelisted, amountToMint])

    const referrerText = React.useMemo(() => {
        return !params.referrer ? null : <>Referral Address <Badge>{params.referrer}</Badge></>
    }, [params.referrer])

    const activeText = React.useMemo(() => {
        let text = isMintingLive ? currentSupply == 111 ? 'Minting Completed' : `Minting Active` : ``
        
        if (isWhitelistMintingLive) 
            text = `Whitelist Minting Active`;

        const color = text ? 'green' : 'red'
        if (!text) text = `Minting Not Active`
        return <div style={{display:'flex', width: '100%', padding: 5,alignItems:'center', justifyContent:'center', gap:9}}>Minting status: <Circle fill={color} color={color} /> {text} <OpenSeaLink  /> {chainId && (
            <a style={{ color: "#FFF", zIndex: 99999 }} href={getExplorerLink(chainId, KIBA_NFT_CONTRACT, ExplorerDataType.ADDRESS)}><ExternalLink
              href={getExplorerLink(chainId, KIBA_NFT_CONTRACT, ExplorerDataType.ADDRESS)}
              style={{ fontSize: '14px'}}
            >
              <Trans>(View on Explorer)</Trans>
            </ExternalLink>
            </a>
          )}</div>
    }, [isWhitelistMintingLive, currentSupply, isMintingLive])
    //callbacks
    const mintAmount = React.useCallback(async (amount: number) => {
        if (account && amount && (isMintingLive || accountWhitelisted && isWhitelistMintingLive)) {
            console.log(`They should mint one or the other`)
            if (isWhitelistMintingLive && accountWhitelisted) {
                console.log(`Try Whitelist Mint`)
                try {
                    setMinting(true)
                    const tx = await kibaNftContract.whitelistMint()
                    const txConfirmed = await tx.wait();
                    tx.hash = txConfirmed.transactionHash
                    addTransaction(tx, {
                        summary: `Whitelist Mint Kiba Inu Genesis NFT `,
                      })
                    setMinting(false)
                    setMintedTx(txConfirmed)
                    } catch (ex) {
                        console.error(ex)
                        setMinting(false)
                    }
            } else  {
                console.log(`Try Normal mint..`)
                try {
                    setMinting(true)
                    
                    const tx = await kibaNftContract.normalMint()
                    const txConfirmed = await tx.wait();
                    tx.hash = txConfirmed.transactionHash
                    addTransaction(tx, {
                        summary: `Mint Kiba Inu Genesis NFT Successfully`
                    })
                    console.log(txConfirmed)
                    setMinting(false)
                    setMintedTx(txConfirmed)
                } catch (ex) {
                    console.error(ex)
                    setMinting(false)
                }
            }
        }
    }, [kibaNftContract, account, isMintingLive, isWhitelistMintingLive, accountWhitelisted])

    const onMintClick = React.useCallback(async () => {
        if (isMintingDisabled) return
        await mintAmount(amountToMint)
    }, [isMintingDisabled])

    function noop() { return }

    return (
        <DarkCard style={{
            overflow:
                'hidden',
            maxWidth: 1200,
            
        }}>
            <TYPE.largeHeader>Kiba NFTs</TYPE.largeHeader>
            <div style={{ border: '1px solid #222', position: 'relative', zIndex: 10000000, marginTop: 15, background: "rgba(0,0,0,.25)", width: '100%', display: 'flex', flexFlow: flex.flexFlow, justifyContent: 'space-between', alignItems: 'center' }}>
                <Panel onClick={() => setActiveTab('mint')} active={activeTab === 'mint'}>
                    Mint {activeTab === 'mint' && <Star height={15} />}
                    {activeTab !== 'mint' && <ExternalLink height={15} />}
                </Panel>
                <Panel onClick={() => setActiveTab('nfts')} active={activeTab === 'nfts'}>
                    My NFTs {activeTab === 'nfts' && <Star height={15} scale={1} fontSize={12} />}
                    {activeTab !== 'nfts' && <ExternalLink height={15} />}
                </Panel>
            </div>
            <TYPE.body className="m-b-sm" style={{ marginTop: 5, color: '#F76C1D' }}>
                {activeTab === 'nfts' ? "View your NFTs" : "Mint your NFTs"}
            </TYPE.body>
            <ConfirmOrLoadingWrapper activeBG={true}>

                <CardNoise />
                <CardBGImage desaturate />

                <CardWrapper>

                    {activeTab === 'nfts' && (
                        <NoNfts>
                            <TYPE.body color={theme.text3}>
                                <div style={{display:'flex', flexFlow: 'column wrap', justifyContent:'start', alignItems:'center'}}>
                                    <NftGrid floorPrice={floorPrice} account={account} /> 
                                </div>
                            </TYPE.body>
                        </NoNfts>
                    )}

                    {activeTab === 'mint' && (
                        <>
                            {referrerText}
                            {activeText}
                            <div style={{ justifyContent: 'space-between', alignItems: 'center', display: 'flex', flexFlow: 'column wrap', gap: 5 }}>
                                <p style={{ margin: 0 }}>Total Supply: {currentSupply}/{totalSupply}</p>
                                <Marquee direction={'ltr'}
                                    resetAfterTries={200}
                                    scatterRandomly={false}
                                    onInit={noop}
                                    onFinish={noop}
                                    velocity={10}>
                                    <></>
                                    <div className="punks-slider_content"><div className="punks-slider_list"><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23caff-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb01-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb03-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb05-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb07-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb09-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0b-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0d-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0f-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb11-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb13-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11.png 640w" alt="" className="punks-slider_image" /></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb15-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12.png 640w" alt="" className="punks-slider_image" /></div></div></div></Marquee>
                                <div style={{ display: 'flex', alignItems: 'center', }}>
                                    <Badge style={{ marginRight: window.innerWidth <= 768 ? 20 : 15 }}>Amount to Mint </Badge>

                                    <input
                                        readOnly
                                        id="mintRef"
                                        style={{ height: '50px', fontSize: 18, zIndex: 500000 }}
                                        type="number"
                                        width={'100%'}
                                        height={'50px'}
                                        value={amountToMint}
                                        onInput={e => {
                                            if (parseInt(e.currentTarget.value) && parseInt(e.currentTarget.value) <= 5)
                                                setAmountToMint(parseInt(e.currentTarget.value))
                                            else if (parseInt(e.currentTarget.value) > 5 && confirm(`You are trying to mint more than the maximum allowed (5) at a time. Would you like to just mint the max?`))
                                                setAmountToMint(5)
                                        }} />
                                </div>
                                {/* <div style={{ columnGap: 15, display: 'flex', flexFlow: 'column', marginTop: 25, zIndex: 123123 }}>
                                    <label className="input-range-label"><input type="range"
                                        style={getBackgroundSize()}
                                        max={1}
                                        min={1}
                                        onInput={value => setAmountToMint((parseInt(value.currentTarget.value.toString(), 10) as any as number))}
                                        value={amountToMint} />
                                        {amountToMint} Kiba NFT{amountToMint > 1 && 's'}</label>
                                </div>
 */}
                                <div style={{ maxWidth: 400, marginTop: 15 }}>
                                    <ButtonPrimary

                                        onClick={onMintClick}
                                        disabled={minting || isMintingDisabled}>
                                        {minting ? "Minting..." : "MINT"}
                                    </ButtonPrimary>
                                </div>

                                {!canMint && (
                                    <Badge style={{marginTop: 15, marginBottom: 15}}>1 Mint Per Wallet is allowed. You&apos;ve already minted 1 NFT.</Badge>
                                )}


                                {Boolean(mintedTx && mintedTx?.transactionHash) && (
                                    <div style={{marginTop: 10, zIndex: 100}}>
                                        <Transaction style={{}} hash={mintedTx.transactionHash} /> 
                                    </div>
                                )}
                            </div>
                        </>)}

                </CardWrapper>
            </ConfirmOrLoadingWrapper>
        </DarkCard>
    )
}