import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import styled from 'styled-components/macro'

const MissingImageLogo = styled.div<{ size?: string }>`
  --size: ${({ size }) => size};
  border-radius: 100px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: calc(var(--size) / 3);
  font-weight: 500;
  height: ${({ size }) => size ?? '24px'};
  line-height: ${({ size }) => size ?? '24px'};
  text-align: center;
  width: ${({ size }) => size ?? '24px'};
`

const LogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 60%, #ffffff00 calc(70% + 1px));
  border-radius: 50%;
  box-shadow: 0 0 1px white;
`

export type AssetLogoBaseProps = {
  symbol?: string | null
  backupImg?: string | null
  size?: string
  style?: React.CSSProperties
  showL2Logo?: boolean
}
type AssetLogoProps = AssetLogoBaseProps & { isNative?: boolean; address?: string | null; chainId?: number }

// TODO(cartcrom): add prop to optionally render an L2Icon w/ the logo
/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */

const LogoContainer = styled.div`
  position: relative;
  align-items: center;
  display: flex;
`

const L2NetworkLogo = styled.div<{ networkUrl?: string; parentSize: string }>`
  width: ${({ parentSize }) => `calc(${parentSize} / 2)`};
  height: ${({ parentSize }) => `calc(${parentSize} / 2)`};
  position: absolute;
  left: 50%;
  bottom: 0;
  background: url(${({ networkUrl }) => networkUrl});
  background-repeat: no-repeat;
  background-size: ${({ parentSize }) => `calc(${parentSize} / 2) calc(${parentSize} / 2)`};
  display: ${({ networkUrl }) => !networkUrl && 'none'};
`

export default function AssetLogo({
  isNative,
  address,
  chainId = SupportedChainId.MAINNET,
  symbol,
  backupImg,
  size = '24px',
  style,
  showL2Logo = true,
  ...rest
}: AssetLogoProps) {
  const imageProps = {
    alt: `${symbol ?? 'token'} logo`,
    size,
    style,
    ...rest,
  }

  const [src, nextSrc] = useTokenLogoSource(address, chainId, isNative, backupImg)
  const L2Icon = getChainInfo(chainId)?.circleLogoUrl

  return (
    <LogoContainer>
      {src ? (
        <LogoImage {...imageProps} src={src} onError={nextSrc} />
      ) : (
        <MissingImageLogo size={size}>
          {/* use only first 3 characters of Symbol for design reasons */}
          {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
        </MissingImageLogo>
      )}
      {showL2Logo && <L2NetworkLogo networkUrl={L2Icon} parentSize={size} />}
    </LogoContainer>
  )
}
