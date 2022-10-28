import * as utils from 'ethers'

import Badge, { BadgeVariant } from 'components/Badge'
import { BigintIsh, CurrencyAmount, Token, WETH9 } from '@uniswap/sdk-core';
import { CardBGImage, CardNoise, CardSection } from 'components/earn/styled'
import { LinkStyledButton, StyledInternalLink, TYPE } from 'theme'
import { OpenSeaLink, useFloorPrice } from 'components/Nft/mint';
import { useKiba, useKibaBalanceUSD, useTotalSwapVolumeBnbToUsd } from 'pages/Vote/VotePage'

import { AutoColumn } from 'components/Column'
import Confetti from 'components/Confetti'
import { DarkCard } from 'components/Card'
import Lottie from 'react-lottie';
import { NetworkInfo } from 'components/Header/NetworkCard';
import React from 'react'
import { Style } from 'util';
import { SupportedChainId } from 'constants/chains'
import { Wrapper } from 'pages/Pool/styleds'
import { Zap } from 'react-feather'
import _ from 'lodash'
import { alignItems } from 'styled-system';
import animationData from '../../../src/lotties/fire.json';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components/macro'
import { useBlockNumber } from 'state/application/hooks';
import { useCurrency } from 'hooks/Tokens'
import { useCurrencyBalance } from 'state/wallet/hooks'
import useInterval from 'hooks/useInterval';
import { useSwapVolumeContext } from 'context/SwapVolumeContext';
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useV2RouterContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

export const useTotalSwapVolume = () => {
  return useSwapVolumeContext();
}
const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
}


const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  overflow:hidden;
`
export function abbreviateNumber(value: any) {
  return Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value)
}
export const BurntKiba = ({ showDetails, style }: { showDetails?: boolean, style?: Record<string, string> }) => {
  const deadWalletKibaBalance = useKiba('0x000000000000000000000000000000000000dead')
  const { chainId } = useWeb3React()
  const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
  const kibaCoin = React.useMemo(() => new Token(
    isBinance ? 56 : 1,
    isBinance ? '0xc3afde95b6eb9ba8553cdaea6645d45fb3a7faf5' : "0x005d1123878fc55fbd56b54c73963b234a64af3c",
    18,
    "Kiba",
    "Kiba Inu"
  ), [isBinance])
  const kibaCurrency = useCurrency(kibaCoin.address)
  const currencyBalance = useCurrencyBalance('0x000000000000000000000000000000000000dead', kibaCurrency ?? undefined)
  const burntValue = useUSDCValue(currencyBalance)
  const bscBurntValue = useKibaBalanceUSD('0x000000000000000000000000000000000000dead', chainId)
  const {
    volumeInEth,
    volumeInEthBn,
    volumeInUsd,
    volumeInUsdFormatted
  } = useTotalSwapVolume()
  const floorPriceForGenesisCollection = useFloorPrice()
  const [volume, setVolume] = useTotalSwapVolumeBnbToUsd()
  const FloorPrice = Boolean(floorPriceForGenesisCollection) ? (
    <div style={{ width: '100%', borderTop: isMobile ? 'none' : "1px solid #444", padding: '1rem', gap: 5, display: 'flex', alignItems: 'center', flexFlow: 'column wrap' }}>
      <div style={{ height: 50, padding: 15 }}><TYPE.subHeader>Kiba Inu Genesis NFT Collection</TYPE.subHeader></div>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge>
          {`${floorPriceForGenesisCollection} ETH Floor Price`}
        </Badge>
        <OpenSeaLink />
      </div>
    </div>) : null
  return (
    deadWalletKibaBalance ?
      showDetails ?
        <ContentWrapper gap="lg" style={{ maxWidth: 550, overflow: 'hidden' }}>
          <CardBGImage desaturate />
          <CardNoise />
          <DarkCard style={{ display: 'flex', rowGap: 15, flexFlow: 'row wrap', justifyContent: 'space-between', padding: 5, columnGap: 5, alignItems: 'start', width: '100%' }}>
            <div style={{ width: 250, borderRight: isMobile ? 'none' : "1px solid #444", padding: '1rem', gap: 5, display: 'flex', alignItems: 'center', flexFlow: 'column wrap' }}>
              <div style={{ height: 50, padding: 15 }}>
                <TYPE.subHeader>Burnt Kiba {isBinance ? "(BSC)" : "(ETH)"}</TYPE.subHeader>
              </div>

              <p style={{ textAlign: 'center', color: '#F76C1D' }}><h1 style={{ display: 'block', margin: 0, color: '#F76C1D', fontWeight: 'bold' }}>{abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</h1>   <small>({(Number(+deadWalletKibaBalance.toFixed(18)).toLocaleString())}) Tokens</small></p>
              {burntValue && isBinance === false && <p style={{ color: '#F76C1D' }}><Badge>Burnt Value ${Number(burntValue?.toFixed(2)).toLocaleString()} USD</Badge></p>}
              {bscBurntValue && isBinance === true && <p style={{ color: '#F76C1D' }}><Badge>Burnt Value ${bscBurntValue} USD</Badge></p>}
              <small style={{ marginTop: 5 }}>
                Value includes price impact
              </small>
            </div>
            {true && (
              <div style={{ width: 225, padding: '1rem', gap: 5, display: 'flex', alignItems: 'center', flexFlow: 'column wrap' }}>
                <div style={{ height: 50, padding: 15 }}><TYPE.subHeader style={{ whiteSpace: 'nowrap' }}>Total Swap Volume (in {isBinance ? "BNB" : "ETH"})</TYPE.subHeader></div>
                <p style={{ color: '#F76C1D' }}><h1 style={{ display: 'block', margin: 0, color: '#F76C1D', fontWeight: 'bold' }}>{abbreviateNumber(parseFloat(volumeInEth as string)?.toFixed(2))} {!isBinance ? <>Ξ</> : <>BNB</>} </h1>   <small style={{}}>({(Number(parseFloat(volumeInEth as string)?.toFixed(18)).toLocaleString())}) {isBinance ? 'BNB' : 'ETH'}</small></p>

                <p><Badge> Total Volume Value
                  {!isBinance && <>{volumeInUsd && volumeInUsd !== 0 && volumeInUsdFormatted && <> (${volumeInUsdFormatted} USD)</>}</>}
                  {isBinance && <>{volume && volume !== '0' && <> (${volume} USD)</>}</>}

                </Badge>
                </p>
              </div>
            )}
            {FloorPrice}
          </DarkCard>
        </ContentWrapper> :
        <StyledInternalLink style={{ ...style }} to="/dashboard">

          <NetworkInfo style={{ alignItems: 'center', justifyContent: 'center', paddingRight: '.5rem' }} chainId={chainId as any}>
            <div style={{ marginBottom: 10 }}>
              <Lottie
                options={defaultOptions}
                height={28}
                width={28} />
            </div>
            {abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}
          </NetworkInfo>
        </StyledInternalLink>
      : null

  )
}