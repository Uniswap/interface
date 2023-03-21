import { Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import { LogoImage, MissingImageLogo } from 'components/Logo/AssetLogo'
import { Unicon } from 'components/Unicon'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import useENSAvatar from 'hooks/useENSAvatar'
import React from 'react'
import { Loader } from 'react-feather'
import styled from 'styled-components/macro'
const UnknownContract = styled(UnknownStatus)`
  color: ${({ theme }) => theme.textSecondary};
`

const DoubleLogoContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  ${LogoImage}:nth-child(n) {
    width: 19px;
    height: 40px;
    object-fit: cover;
  }
  ${LogoImage}:nth-child(1) {
    border-radius: 20px 0 0 20px;
    object-position: 0 0;
  }
  ${LogoImage}:nth-child(2) {
    border-radius: 0 20px 20px 0;
    object-position: 100% 0;
  }
`

type MultiLogoProps = {
  chainId: SupportedChainId
  accountAddress?: string
  currencies?: Currency[]
  images?: (string | undefined)[]
  size?: string
  style?: React.CSSProperties
}

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

const StyledChainLogo = styled.img<{ isSquare: boolean }>`
  height: ${({ isSquare }) => (isSquare ? '16px' : '14px')};
  width: ${({ isSquare }) => (isSquare ? '16px' : '14px')};
  margin-top: ${({ isSquare }) => (isSquare ? '0px' : '1px')};
  margin-left: ${({ isSquare }) => (isSquare ? '0px' : '1px')};
  position: absolute;
  top: 68%;
  left: 68%;
`

const ChainLogoSquareBackground = styled.div`
  height: 18px;
  width: 18px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  position: absolute;
  top: 60%;
  left: 60%;
`

const SquareBackgroundForNonSquareLogo = styled.div`
  height: 16px;
  width: 16px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.textPrimary};
  position: absolute;
  top: 68%;
  left: 68%;
`

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */
export function PortfolioLogo({
  chainId = SupportedChainId.MAINNET,
  accountAddress,
  currencies,
  images,
  size = '40px',
  style,
}: MultiLogoProps) {
  const { squareLogoUrl, logoUrl } = getChainInfo(chainId)
  const chainLogo = squareLogoUrl ?? logoUrl
  const { avatar, loading } = useENSAvatar(accountAddress, false)

  const [src, nextSrc] = useTokenLogoSource(currencies?.[0]?.wrapped.address, chainId, currencies?.[0]?.isNative)
  const [src2, nextSrc2] = useTokenLogoSource(currencies?.[1]?.wrapped.address, chainId, currencies?.[1]?.isNative)

  let component
  if (accountAddress) {
    component = loading ? (
      <Loader size={size} />
    ) : avatar ? (
      <ENSAvatarImg src={avatar} alt="avatar" />
    ) : (
      <Unicon size={40} address={accountAddress} />
    )
  } else if (currencies && currencies.length) {
    const logo1 = <LogoImage size={size} src={src ?? blankTokenUrl} onError={nextSrc} />

    const logo2 = <LogoImage size={size} src={src2 ?? blankTokenUrl} onError={nextSrc2} />

    component =
      currencies.length > 1 ? (
        <DoubleLogoContainer style={style}>
          {logo1}
          {logo2}
        </DoubleLogoContainer>
      ) : src ? (
        logo1
      ) : (
        <MissingImageLogo size={size}>
          {currencies[0]?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
        </MissingImageLogo>
      )
  } else if (images && images.length) {
    component =
      images.length > 1 ? (
        <DoubleLogoContainer style={style}>
          <LogoImage size={size} src={images[0]} />
          <LogoImage size={size} src={images[images.length - 1]} />
        </DoubleLogoContainer>
      ) : (
        <LogoImage size={size} src={images[0]} />
      )
  } else {
    return <UnknownContract width={size} height={size} />
  }

  const L2Logo =
    chainId === SupportedChainId.MAINNET ? null : (
      <div>
        {chainLogo && <ChainLogoSquareBackground />}
        {!squareLogoUrl && logoUrl && <SquareBackgroundForNonSquareLogo />}
        {chainLogo && <StyledChainLogo isSquare={!!squareLogoUrl} src={chainLogo} alt="chainLogo" />}
      </div>
    )

  return (
    <StyledLogoParentContainer>
      {component}
      {L2Logo}
    </StyledLogoParentContainer>
  )
}
