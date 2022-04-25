import { ButtonPrimary, ButtonSecondary } from 'components/Button'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import { ExternalLink, Info, Star } from 'react-feather'
import React, { useEffect } from 'react'

import Badge from 'components/Badge'
import { DarkCard } from 'components/Card'
import { TYPE } from 'theme'
import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from 'hooks/web3'
import { useKibaNFTContract } from 'hooks/useContract'
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

    //state
    const [hasEnoughTokensForEarlyMint, setHasEnoughTokensForEarlyMint] = React.useState(false)
    const [amountToMint, setAmountToMint] = React.useState(0)
    const [activeTab, setActiveTab] = React.useState<'mint' | 'nfts'>('mint')
    const [isMintingLive, setIsMintingLive] = React.useState(false)
    const [flex, setFlex] = React.useState({flexFlow: 'row wrap'})

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

    //callbacks
    const mintAmount = React.useCallback(async (amount: number) => {
        if (account && amount) {
            const tx = {
                from: account,
                to: kibaNftContract.address,
                amount,
                data: amount.toString()
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
            <TYPE.body style={{ marginTop: 15, color: '#F76C1D' }}>
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
                                    <Trans>Connected Account <Badge>{account}</Badge></Trans>
                                </div>}
                                <div>
                                    <Trans>Your Minted Kiba Inu NFTs will Appear Here.</Trans>
                                </div>
                            </TYPE.body>
                        </NoNfts>
                    )}

                    {activeTab === 'mint' && (
                        <div style={{ padding: window.innerWidth <= 768 ? 0 : `9px 14px`, justifyContent: 'space-between', alignItems: 'center', display: 'flex', flexFlow: 'column wrap', gap: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', }}>
                                <Badge style={{ marginRight: window.innerWidth <= 768 ? 20 : 15 }}>Amount to Mint </Badge>

                                <input
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
                            <div style={{ maxWidth: 400, marginTop: 15 }}>
                                <ButtonPrimary
                                    onClick={onMintClick}
                                    disabled={isMintingDisabled}>
                                    MINT
                                </ButtonPrimary>
                            </div>
                        </div>)}

                </CardWrapper>
            </ConfirmOrLoadingWrapper>
        </DarkCard>
    )
}