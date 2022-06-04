import './styles.css'

import { ButtonPrimary, ButtonSecondary } from 'components/Button'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import { ExternalLink, Info, Star } from 'react-feather'
import React, { useEffect } from 'react'

import Badge from 'components/Badge'
import { DarkCard } from 'components/Card'
import Marquee from "react-marquee-slider";
import { TYPE } from 'theme'
import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from 'hooks/web3'
import { useKibaNFTContract } from 'hooks/useContract'
import { useParams } from 'react-router-dom'
import useTheme from 'hooks/useTheme'

const CardWrapper = styled.div`
min-width: 190px;
width:100%;
margin-right: 16px;
padding:3px;
display:block;
`
const ConfirmOrLoadingWrapper = styled.div<{ activeBG: boolean }>`
  width: 100%;
  padding: 24px;
  position: relative;
  background: #252632;
`


const NoNfts = styled.div`
  align-items: center;
  display: flex;
  flex-direction: ${() => window.innerWidth <= 768 ? 'column' : 'row'};
  justify-content: center;
  margin: auto;
  max-width: 500px;
  min-height: 25vh;
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

export const Mint: React.FC<any> = () => {
    const theme = useTheme()
    const { account, library } = useActiveWeb3React()
    const kibaNftContract = useKibaNFTContract()
    const params = useParams<{referrer: string}>()

    
    //state
    const [hasEnoughTokensForEarlyMint, setHasEnoughTokensForEarlyMint] = React.useState(false)
    const [amountToMint, setAmountToMint] = React.useState(1)
    const [activeTab, setActiveTab] = React.useState<'mint' | 'nfts'>('mint')
    const [isMintingLive, setIsMintingLive] = React.useState(false)
    const [flex, setFlex] = React.useState({flexFlow: 'row wrap'})
    const[totalSupply,setTotalSupply] = React.useState(5000);
    const [currentSupply, setCurrentSupply] = React.useState(0);
    const MAX = 5;
    const getBackgroundSize = () => {
        return {
            backgroundSize: `${(amountToMint * 100) / MAX}% 100%`,
            height: `auto`,
            marginLeft: 30
        };
    };
    //sideffects
    useEffect(() => {
        if (kibaNftContract && account) {
            // determine if early minting is available for the connected account
            kibaNftContract.hasEnoughTokensForEarlyMint(account).then((response: any) => {
                if (!response) setHasEnoughTokensForEarlyMint(false)
                else setHasEnoughTokensForEarlyMint(true)
            })

            // determine if minting is live for everyone
            kibaNftContract.mintingLive().then((response:any) => setIsMintingLive(new Date(response) >= new Date()))
        }
    }, [account, kibaNftContract])

    useEffect(() => {
        if (kibaNftContract && currentSupply == 0) {
            kibaNftContract.totalSupply().then((response: any) => {
                setCurrentSupply(response)
            })
        }
    }, [kibaNftContract, currentSupply])

    useEffect(() => {
        // initially focus the mint textbox
        if (activeTab === 'mint' && document.getElementById('mintRef'))
            document.getElementById("mintRef")?.focus()
    }, [activeTab])

    useEffect(() => {
        const flexStyle = window.innerWidth <= 768 ? 'column wrap' : 'row wrap';
        setFlex({flexFlow: flexStyle})
    }, [window.innerWidth])

    // memos
    const isMintingDisabled = React.useMemo(() => {
        if (amountToMint == 0 || amountToMint > 5) return true;
        if (!isMintingLive) return true;
        return false;
    }, [isMintingLive, amountToMint])

    const referrerText = React.useMemo(() => {
        return !params.referrer ? null : <>Referral Address <Badge>{params.referrer}</Badge></>
    },[params.referrer])
    //callbacks
    const mintAmount = React.useCallback(async (amount: number) => {
        if (account && amount) {
            const tx = {
                from: account,
                to: kibaNftContract.address,
                amount,
                data: amount.toString(),
                referrer: params && params.referrer ? params.referrer : 0
            }

            console.log(`sample mint tx`, tx)

            const response = await library?.getSigner()
                ?.sendTransaction(tx);
            if (response) {
                alert("Minting successful")
            }
        }
    }, [library])

    const onMintClick = React.useCallback(async () => {
        if (isMintingDisabled) return 
        await mintAmount(amountToMint)
    }, [isMintingDisabled])
    
function noop () { return }

    return (
        <DarkCard style={{
            overflow:
                'hidden', 
                maxWidth: 1200
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
            <TYPE.body style={{ marginTop: 5, color: '#F76C1D' }}>
                {activeTab === 'nfts' ? "View your NFTs" : "Mint your NFTs"}
            </TYPE.body>
            <ConfirmOrLoadingWrapper activeBG={true}>

                <CardNoise />
                <CardBGImage desaturate />

                <CardWrapper>

                    {activeTab === 'nfts' && (
                        <NoNfts>
                            <Info size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                            <TYPE.body color={theme.text3} textAlign="center">
                                {account && <div style={{marginBottom:10}}>
                                    <>Connected Account <Badge>{account}</Badge></>
                                </div>}
                                <div>
                                    <Trans>Your Minted Kiba Inu NFTs will Appear Here.</Trans>
                                </div>
                            </TYPE.body>
                        </NoNfts>
                    )}

                    {activeTab === 'mint' && (
                        <>
                        {referrerText}
                        <div style={{ padding: window.innerWidth <= 768 ? 0 : `9px 14px`, justifyContent: 'space-between', alignItems: 'center', display: 'flex', flexFlow: 'column wrap', gap: 5 }}>
                            <p style={{margin:0}}>Total Supply: {currentSupply}/5000</p>
                            <Marquee direction={'ltr'} 
                           resetAfterTries={200} 
                           scatterRandomly={false} 
                            onInit={noop}
                           onFinish={noop}
                           velocity={10}>
                    <></>
                    <div className="punks-slider_content"><div className="punks-slider_list"><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23caff-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbdaa618315612_nft10.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb01-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835fcc89052847fa0d8_nft8.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb03-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835cb8fb9affc530f42_nft9.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb05-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d4f84104f1771b19_nft1.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb07-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835a696a555a46ff1ce_nft6.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb09-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835d3d34c66d491544a_nft3.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0b-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908351a33c2163bd4d100_nft5.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0d-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590835dd14c228970e3a3e_nft2.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb0f-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590834fccbda727f315613_nft7.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb11-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/625908354b316c839be408de_nft4.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb13-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/6259094b7852ac005ac98f16_nft11.png 640w" alt="" className="punks-slider_image"/></div><div id="w-node-_20257ea0-8b21-f1dd-5945-6c5abc23cb15-5bd195dd" className="punks-slider_image-wrapper"><img src="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12.png" loading="lazy" sizes="160px" srcSet="https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12-p-500.png 500w, https://assets.website-files.com/6258d681a5d8ce7f406b2c21/62590960d654fc80cfbe9672_nft12.png 640w" alt="" className="punks-slider_image"/></div></div></div></Marquee>
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
                            <div style={{columnGap: 15, display:'flex', flexFlow: 'column', marginTop:25, zIndex: 123123}}>
                                <label className="input-range-label"><input type="range"	
                                        style={getBackgroundSize()}
                                        max={5} 
                                        min={1}  
                                        onInput={value => setAmountToMint((parseInt(value.currentTarget.value.toString(), 10) as any as number))} 
                                        value={amountToMint}  />
                                {amountToMint} Kiba NFT{amountToMint > 1 && 's'}</label>
                            </div>

                            <div style={{ maxWidth: 400, marginTop: 15 }}>
                                <ButtonPrimary

                                    onClick={onMintClick}
                                    disabled={isMintingDisabled}>
                                    MINT
                                </ButtonPrimary>
                            </div>
                        </div>
                        </>)}

                </CardWrapper>
            </ConfirmOrLoadingWrapper>
        </DarkCard>
    )
}