import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import { MissingImageLogo } from 'components/Logo/AssetLogo'
import { ChainLogo, getDefaultBorderRadius } from 'components/Logo/ChainLogo'
import { Unicon } from 'components/Unicon'
import { useUniconV2Flag } from 'featureFlags/flags/uniconV2'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import useENSAvatar from 'hooks/useENSAvatar'
import React from 'react'
import { Loader } from 'react-feather'
import styled from 'styled-components'
import { UniconV2 } from 'ui/src'

const UnknownContract = styled(UnknownStatus)`
  color: ${({ theme }) => theme.neutral2};
`

const DoubleLogoContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img:nth-child(n) {
    width: 19px;
    height: 40px;
    object-fit: cover;
  }
  img:nth-child(1) {
    border-radius: 20px 0 0 20px;
    object-position: 0 0;
  }
  img:nth-child(2) {
    border-radius: 0 20px 20px 0;
    object-position: 100% 0;
  }
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  top: 0;
  left: 0;
`

const ENSAvatarImg = styled.img`
  border-radius: 8px;
  height: 40px;
  width: 40px;
`

const CircleLogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
`

const L2LogoContainer = styled.div`
  position: absolute;
  border-radius: ${getDefaultBorderRadius(16)}px;
  left: 65%;
  top: 65%;
  outline: 1.5px solid ${({ theme }) => theme.surface1};
  width: 40%;
  height: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  size: string
  onError1?: () => void
  onError2?: () => void
}

function DoubleLogo({ logo1, onError1, logo2, onError2, size }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer>
      <CircleLogoImage size={size} src={logo1 ?? blankTokenUrl} onError={onError1} />
      <CircleLogoImage size={size} src={logo2 ?? blankTokenUrl} onError={onError2} />
    </DoubleLogoContainer>
  )
}

interface DoubleCurrencyLogoProps {
  chainId: ChainId
  currencies: Array<Currency | undefined>
  images?: Array<string | undefined>
  size: string
}

function DoubleCurrencyLogo({ chainId, currencies, images, size }: DoubleCurrencyLogoProps) {
  const [src, nextSrc] = useTokenLogoSource({
    address: currencies?.[0]?.wrapped.address,
    chainId,
    isNative: currencies?.[0]?.isNative,
    primaryImg: images?.[0],
  })
  const [src2, nextSrc2] = useTokenLogoSource({
    address: currencies?.[1]?.wrapped.address,
    chainId,
    isNative: currencies?.[1]?.isNative,
    primaryImg: images?.[1],
  })

  if (currencies.length === 1 && src) {
    return <CircleLogoImage size={size} src={src} onError={nextSrc} />
  }
  if (currencies.length > 1) {
    return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} size={size} />
  }
  return (
    <MissingImageLogo size={size}>
      {currencies[0]?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}

function PortfolioAvatar({ accountAddress, size }: { accountAddress: string; size: string }) {
  const { avatar, loading } = useENSAvatar(accountAddress, false)
  const uniconV2Enabled = useUniconV2Flag()

  if (loading) {
    return <Loader size={size} />
  }
  if (avatar) {
    return <ENSAvatarImg src={avatar} alt="avatar" />
  }
  return (
    <>
      {uniconV2Enabled ? (
        <UniconV2 address={accountAddress} size={40} />
      ) : (
        <Unicon address={accountAddress} size={40} />
      )}
    </>
  )
}

interface PortfolioLogoProps {
  chainId: ChainId
  accountAddress?: string
  currencies?: Array<Currency | undefined>
  images?: Array<string | undefined>
  size?: string
  style?: React.CSSProperties
}

function SquareL2Logo({ chainId }: { chainId: ChainId }) {
  if (chainId === ChainId.MAINNET) return null

  return (
    <L2LogoContainer>
      <ChainLogo fillContainer={true} chainId={chainId} />
    </L2LogoContainer>
  )
}

// TODO(WEB-2983)
/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback contract icon
 */
export function PortfolioLogo(props: PortfolioLogoProps) {
  return (
    <LogoContainer style={props.style}>
      {getLogo(props)}
      <SquareL2Logo chainId={props.chainId} />
    </LogoContainer>
  )
}

function getLogo({ chainId, accountAddress, currencies, images, size = '40px' }: PortfolioLogoProps) {
  if (accountAddress) {
    return <PortfolioAvatar accountAddress={accountAddress} size={size} />
  }
  if (currencies && currencies.length) {
    return <DoubleCurrencyLogo chainId={chainId} currencies={currencies} images={images} size={size} />
  }
  if (images?.length === 1) {
    return <CircleLogoImage size={size} src={images[0] ?? blankTokenUrl} />
  }
  if (images && images?.length >= 2) {
    return <DoubleLogo logo1={images[0]} logo2={images[images.length - 1]} size={size} />
  }
  return <UnknownContract width={size} height={size} />
}
