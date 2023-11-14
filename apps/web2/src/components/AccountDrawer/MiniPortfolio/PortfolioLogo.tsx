import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import { MissingImageLogo } from 'components/Logo/AssetLogo'
import { ChainLogo, getDefaultBorderRadius } from 'components/Logo/ChainLogo'
import { Unicon } from 'components/Unicon'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import useENSAvatar from 'hooks/useENSAvatar'
import React from 'react'
import { Loader } from 'react-feather'
import styled from 'styled-components'

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

const StyledLogoParentContainer = styled.div`
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
  border-radius: ${getDefaultBorderRadius(16)}px;
  height: 16px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  width: 16px;
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
  backupImages?: Array<string | undefined>
  size: string
}

function DoubleCurrencyLogo({ chainId, currencies, backupImages, size }: DoubleCurrencyLogoProps) {
  const [src, nextSrc] = useTokenLogoSource(
    currencies?.[0]?.wrapped.address,
    chainId,
    currencies?.[0]?.isNative,
    backupImages?.[0]
  )
  const [src2, nextSrc2] = useTokenLogoSource(
    currencies?.[1]?.wrapped.address,
    chainId,
    currencies?.[1]?.isNative,
    backupImages?.[1]
  )

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

  if (loading) {
    return <Loader size={size} />
  }
  if (avatar) {
    return <ENSAvatarImg src={avatar} alt="avatar" />
  }
  return <Unicon size={40} address={accountAddress} />
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
      <ChainLogo chainId={chainId} />
    </L2LogoContainer>
  )
}

// TODO(WEB-2983)
/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback contract icon
 */
export function PortfolioLogo(props: PortfolioLogoProps) {
  return (
    <StyledLogoParentContainer style={props.style}>
      {getLogo(props)}
      <SquareL2Logo chainId={props.chainId} />
    </StyledLogoParentContainer>
  )
}

function getLogo({ chainId, accountAddress, currencies, images, size = '40px' }: PortfolioLogoProps) {
  if (accountAddress) {
    return <PortfolioAvatar accountAddress={accountAddress} size={size} />
  }
  if (currencies && currencies.length) {
    return <DoubleCurrencyLogo chainId={chainId} currencies={currencies} backupImages={images} size={size} />
  }
  if (images?.length === 1) {
    return <CircleLogoImage size={size} src={images[0] ?? blankTokenUrl} />
  }
  if (images && images?.length >= 2) {
    return <DoubleLogo logo1={images[0]} logo2={images[images.length - 1]} size={size} />
  }
  return <UnknownContract width={size} height={size} />
}
