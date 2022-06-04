import * as utils from 'ethers'

import Badge, { BadgeVariant } from 'components/Badge'
import { BigintIsh, CurrencyAmount, Token, WETH9 } from '@uniswap/sdk-core';
import { CardBGImage, CardNoise, CardSection } from 'components/earn/styled'
import { LinkStyledButton, StyledInternalLink } from 'theme'
import { useKiba, useKibaBalanceUSD, useTotalSwapVolumeBnbToUsd } from 'pages/Vote/VotePage'

import { AutoColumn } from 'components/Column'
import Confetti from 'components/Confetti'
import { DarkCard } from 'components/Card'
import Lottie from 'react-lottie';
import React from 'react'
import { Style } from 'util';
import { SupportedChainId } from 'constants/chains'
import { Wrapper } from 'pages/Pool/styleds'
import {Zap} from 'react-feather'
import _ from 'lodash'
import { alignItems } from 'styled-system';
import animationData from '../../../src/lotties/fire.json';
import styled from 'styled-components/macro'
import { useBlockNumber } from 'state/application/hooks';
import { useCurrency } from 'hooks/Tokens'
import { useCurrencyBalance } from 'state/wallet/hooks'
import useInterval from 'hooks/useInterval';
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useV2RouterContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

export const useTotalSwapVolume = () => {
  const relayer = useV2RouterContract()
  const blockNumber = useBlockNumber()
    const [ethRelayed, setEthRelayed] = React.useState({formatted:'0', value: 0})
    const intervalFn = React.useCallback( async (isIntervalledCallback: boolean ) => {
      console.log('interval function->totalSwapVolume->', ethRelayed.formatted)
      if (relayer && (isIntervalledCallback || !ethRelayed.value)) {
        relayer.totalEthRelayed().then((response:any) => {
        if (!_.isEqual(ethRelayed.value, response)) {
          const formattedEth = parseFloat(utils.utils.formatEther(response)).toFixed(6);
          setEthRelayed({formatted: formattedEth, value: response})
        }
      })
    }
    }, [relayer, ethRelayed])
    const intervalledFunction  = async () => await intervalFn(true)
    useInterval(intervalledFunction, 120000, true)

    const ethCurrency = useCurrency(WETH9[1].address)

    const rawCurrencyAmount = React.useMemo(() => {
      if (!ethRelayed.value || ethRelayed.formatted === '0' || !ethCurrency)
      return undefined

      return CurrencyAmount.fromRawAmount(ethCurrency ?? undefined, ethRelayed.value)
    }, [ethRelayed, ethCurrency])

    const usdcValue = useUSDCValue(rawCurrencyAmount)
    const formattedUsdcValue = usdcValue ? usdcValue?.toFixed(6) : '0';
    return { 
      volumeInEth: ethRelayed.formatted,
      volumeInEthBn: ethRelayed.value,
      volumeInUsd: parseFloat(formattedUsdcValue)
    }
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
export const BurntKiba = ({showDetails, style}:{showDetails?:boolean, style?: Record<string, string> }) => {
    const deadWalletKibaBalance = useKiba('0x000000000000000000000000000000000000dead')
    const { chainId} = useWeb3React()
    const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
    const kibaCoin = React.useMemo(() => new Token(
      isBinance ? 56 : 1,
      isBinance ? '0xc3afde95b6eb9ba8553cdaea6645d45fb3a7faf5' : "0x005d1123878fc55fbd56b54c73963b234a64af3c",
      18,
      "Kiba",
      "Kiba Inu"
    ), [isBinance])
    const kibaCurrency = useCurrency(kibaCoin.address)
    const currencyBalance =useCurrencyBalance('0x000000000000000000000000000000000000dead', kibaCurrency ?? undefined)
    const burntValue = useUSDCValue(currencyBalance)
    const bscBurntValue = useKibaBalanceUSD('0x000000000000000000000000000000000000dead', chainId)
    
    
    const {
volumeInEth, 
volumeInEthBn,
volumeInUsd
    } = useTotalSwapVolume()
    const [volume, setVolume] = useTotalSwapVolumeBnbToUsd()
    return (
        deadWalletKibaBalance ? 
        showDetails ? 
        <ContentWrapper gap="lg" style={{overflow: 'hidden'}}>
            <Confetti start={false} variant={'bottom'} />
            <CardBGImage desaturate />
            <CardNoise />
            <DarkCard>
              <div>
                <h1>Burnt Kiba {isBinance ? "(BSC)" : "(ETH)"}</h1>
                
                <p style={{color: '#F76C1D'}}><h1 style={{display:'block', margin: 0, color: '#F76C1D', fontWeight: 'bold'}}>{abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</h1>   <small>({(Number(+deadWalletKibaBalance.toFixed(18)).toLocaleString())}) Tokens</small></p>
               {burntValue && isBinance === false && <p style={{color: '#F76C1D'}}><Badge>Burnt Value ${Number(burntValue?.toFixed(2)).toLocaleString()} USD</Badge></p>}
               {bscBurntValue && isBinance === true && <p style={{color: '#F76C1D'}}><Badge>Burnt Value ${bscBurntValue} USD</Badge></p>}
            <small style={{marginTop: 5}}>
                Value includes price impact
            </small>
            </div>
            {true && (
            <div>
              <h1>Total Swap Volume (in {isBinance ? "BNB" : "ETH"})</h1>
              <p><Badge>{volumeInEth} {isBinance ? "BNB" :"ETH"} 
              {!isBinance && <>{volumeInUsd && volumeInUsd !== 0 && <> (${volumeInUsd} USD)</>}</>}
              {isBinance && <>{volume && volume !== '0' && <> (${volume} USD)</>}</>}

              </Badge>
              </p>
            </div>
            )}
            </DarkCard> 
              </ContentWrapper>   :
            <StyledInternalLink style={{...style}} to="/dashboard">
            <Badge   style={{display: 'flex', justifyContent: style && style.justifyContent ? style.justifyContent : 'center', color: '#fff', border:'transparent', fontFamily: 'Bangers'}} variant={BadgeVariant.HOLLOW}> <div style = {{marginBottom: 10 }}><Lottie 
  options={defaultOptions}
    height={28}
    width={28}></Lottie></div>
    {abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</Badge>
        </StyledInternalLink> : null
         
    )
}