import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import { MissingImageLogo } from 'components/Logo/AssetLogo'
import { Unicon } from 'components/Unicon'
import { getChainInfo } from 'constants/chainInfo'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import useENSAvatar from 'hooks/useENSAvatar'
import React from 'react'
import { Loader } from 'react-feather'
import styled from 'styled-components'

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

const StyledChainLogo = styled.img`
  height: 14px;
  width: 14px;
`

const SquareChainLogo = styled.img`
  height: 100%;
  width: 100%;
`

const CircleLogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
`

const L2LogoContainer = styled.div<{ hasChainLogo?: boolean }>`
  background-color: ${({ theme, hasChainLogo }) => (hasChainLogo ? theme.backgroundSurface : theme.textPrimary)};
  border-radius: 2px;
  height: 16px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.backgroundSurface};
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`

type DoubleLogoProps = {
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

type DoubleCurrencyLogoProps = {
  chainId: ChainId
  currencies: Array<Currency | undefined>
  backupImages?: (string | undefined)[]
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

  return currencies.length > 1 ? (
    <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} size={size} />
  ) : currencies.length === 1 && src ? (
    <CircleLogoImage size={size} src={src} onError={nextSrc} />
  ) : (
    <MissingImageLogo size={size}>
      {currencies[0]?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}

function PortfolioAvatar({ accountAddress, size }: { accountAddress: string; size: string }) {
  const { avatar, loading } = useENSAvatar(accountAddress, false)

  return loading ? (
    <Loader size={size} />
  ) : avatar ? (
    <ENSAvatarImg src={avatar} alt="avatar" />
  ) : (
    <Unicon size={40} address={accountAddress} />
  )
}

type PortfolioLogoProps = {
  chainId: ChainId
  accountAddress?: string
  currencies?: Array<Currency | undefined>
  images?: (string | undefined)[]
  size?: string
  style?: React.CSSProperties
}

function SquareL2Logo({ chainId }: { chainId: ChainId }) {
  if (chainId === ChainId.MAINNET) return null
  const { squareLogoUrl, logoUrl } = getChainInfo(chainId)

  const chainLogo = squareLogoUrl ?? logoUrl

  return (
    <L2LogoContainer hasChainLogo={!!squareLogoUrl}>
      {squareLogoUrl ? (
        <SquareChainLogo src={chainLogo} alt="chainLogo" />
      ) : (
        <StyledChainLogo src={chainLogo} alt="chainLogo" />
      )}
    </L2LogoContainer>
  )
}

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback contract icon
 */
export function PortfolioLogo({ chainId, accountAddress, currencies, images, size = '40px' }: PortfolioLogoProps) {
  let logo
  if (accountAddress) {
    logo = <PortfolioAvatar accountAddress={accountAddress} size={size} />
  } else if (currencies && currencies.length) {
    logo = <DoubleCurrencyLogo chainId={chainId} currencies={currencies} backupImages={images} size={size} />
  } else if (images?.length === 1) {
    logo = <CircleLogoImage size={size} src={images[0] ?? blankTokenUrl} />
  } else if (images && images?.length >= 2) {
    logo = <DoubleLogo logo1={images[0]} logo2={images[images.length - 1]} size={size} />
  } else {
    logo = <UnknownContract width={size} height={size} />
  }

  return (
    <StyledLogoParentContainer>
      {logo}
      <SquareL2Logo chainId={chainId} />
    </StyledLogoParentContainer>
  )
}
