import * as ethers from 'ethers'

import {
  ArbitrumWrapperBackgroundDarkMode,
  ArbitrumWrapperBackgroundLightMode,
  OptimismWrapperBackgroundDarkMode,
  OptimismWrapperBackgroundLightMode,
} from 'components/NetworkAlert/NetworkAlert'
import { ArrowDownCircle, CheckCircle } from 'react-feather'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { useArbitrumAlphaAlert, useDarkModeManager } from 'state/user/hooks'

import { OpenSeaLink } from 'components/Nft/mint'
import React from 'react'
import { ReadMoreLink } from './styles'
import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from 'hooks/web3'
import { useKibaNFTContract } from 'hooks/useContract'

const L2Icon = styled.img`
  display: none;
  height: 40px;
  margin: auto 20px auto 4px;
  width: 40px;
  border-radius:60px;
  border:1px solid #eee;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`
const DesktopTextBreak = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`
const Wrapper = styled.div<{ chainId: SupportedL2ChainId; darkMode: boolean; logoUrl: string }>`
  ${({ chainId, darkMode }) =>
    [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)
      ? darkMode
        ? OptimismWrapperBackgroundDarkMode
        : OptimismWrapperBackgroundLightMode
      : darkMode
        ? ArbitrumWrapperBackgroundDarkMode
        : ArbitrumWrapperBackgroundLightMode};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  position: relative;
  width: 100%;

  :before {
    background-image: url(${({ logoUrl }) => logoUrl});
    background-repeat: no-repeat;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -1;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    flex-direction: row;
    padding: 12px;
    margin-top:-30px;
  }
  @media screen and (max-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin-top:-20px;
  }
`
const Body = styled.div`
  font-size: 12px;
  line-height: 143%;
  margin: 12px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    flex: 1 1 auto;
    margin: auto 0;
  }
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 20px;
  height: 20px;
  margin-left: 12px;
`
const LinkInToNfts = styled(StyledInternalLink)`
align-items: center;
font-family: Sans-serif;
  background-color: black;
  border-radius: 16px;
  color: white;
  display: flex;
  font-size: 14px;
  justify-content: space-between;
  margin: 0;
  max-height: 47px;
  padding: 16px 12px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    margin: auto 0 auto auto;
    padding: 14px 16px;
    min-width: 226px;
  }
`
const LinkOutToBridge = styled(ExternalLink)`
  align-items: center;
  background-color: black;
  border-radius: 16px;
  color: white;
  display: flex;
  font-size: 14px;
  justify-content: space-between;
  margin: 0;
  max-height: 47px;
  padding: 16px 12px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: black;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    margin: auto 0 auto auto;
    padding: 14px 16px;
    min-width: 226px;
  }
`

export function KibaNftAlert() {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [arbitrumAlphaAcknowledged, setAlertAcknowledged] = useArbitrumAlphaAlert()
  const [mintingLive, setMintingLive] = React.useState(false)
  const [whitelstLive, setWhitelistLive] = React.useState(false)
  //const kibaNftContract = useKibaNFTContract()
  //   //sideffects
  //   React.useEffect(() => {
  //     if (kibaNftContract) {
  //         // determine if minting is live for everyone
  //         kibaNftContract.isActive().then((response: any) => {
  //             console.log(`$minting active?`, response)
  //             const mintLiveResponse = Boolean(response)
  //             if (mintLiveResponse) {
  //               kibaNftContract.totalSupply().then((totalSupply:any) => {
  //                   const tsNumber = ethers.BigNumber.from(totalSupply).toNumber()
  //                   const mintingIsActive = Boolean(tsNumber < 111)
  //                   setMintingLive(mintingIsActive)
  //               })
  //             } else {  
  //               setMintingLive(false)
  //             }
  //         })
  //         // determine if whitelist minting is available for the connected account
  //         kibaNftContract.isWhitelistActive().then((response:any) => {
  //             console.log(`Whitelist minting active?`, response)
  //             setWhitelistLive(Boolean(response))
  //         })
  //     }
  // }, [kibaNftContract])

  return null;
  // const info = CHAIN_INFO[chainId as SupportedL2ChainId]
  // return Boolean(mintingLive || whitelstLive) ? (
  //   <Wrapper style={{width: '90%', marginBottom: 10}} chainId={chainId} darkMode={darkMode} logoUrl={info.logoUrl}>
  //     <L2Icon src={'https://openseauserdata.com/files/260d4d4d0ee4a561f25d2d61a4bc25c9.png'} />
  //     <Body>
  //       <Trans>This is an alpha release of Kiba Inu Genesis NFTs <CheckCircle size={'10px'} fontSize={10} /> </Trans>
  //       <DesktopTextBreak /> <Trans> If you have minting access, you can mint yours now.</Trans>{' '}
  //       <ReadMoreLink href="https://docs.kiba.tools/nfts/kiba-inu-nfts/nft-minting">
  //         <Trans>Read more</Trans>
  //       </ReadMoreLink>
  //     </Body>
  //     <div style={{display:'flex', alignItems:'center'}}>
  //     <LinkInToNfts to={'/nfts'}>
  //       <Trans>Mint yours now</Trans>
  //       <LinkOutCircle />
  //     </LinkInToNfts>
  //       <div style={{marginLeft:5}}>
  //         <OpenSeaLink />
  //       </div>
  //     </div>
  //   </Wrapper>
  // ) : null
}
export function AddLiquidityNetworkAlert() {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [arbitrumAlphaAcknowledged] = useArbitrumAlphaAlert()

  if (!chainId || !L2_CHAIN_IDS.includes(chainId) || arbitrumAlphaAcknowledged) {
    return null
  }
  const info = CHAIN_INFO[chainId as SupportedL2ChainId]
  const depositUrl = [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)
    ? `${info.bridge}?chainId=1`
    : info.bridge
  return (
    <Wrapper darkMode={darkMode} chainId={chainId} logoUrl={info.logoUrl}>
      <L2Icon src={info.logoUrl} />
      <Body>
        <Trans>This is an alpha release of Uniswap on the {info.label} network.</Trans>
        <DesktopTextBreak /> <Trans>You must bridge L1 assets to the network to use them.</Trans>{' '}
        <ReadMoreLink href="https://help.uniswap.org/en/articles/5392809-how-to-deposit-tokens-to-optimism">
          <Trans>Read more</Trans>
        </ReadMoreLink>
      </Body>
      <LinkOutToBridge href={depositUrl}>
        <Trans>Deposit to {info.label}</Trans>
        <LinkOutCircle />
      </LinkOutToBridge>
    </Wrapper>
  )
}
