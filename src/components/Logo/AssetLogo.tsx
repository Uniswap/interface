import { ChainId } from '@thinkincoin-libs/sdk-core'
import { getChainInfo } from 'constants/chainInfo'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import styled, { css } from 'styled-components/macro'

export const MissingImageLogo = styled.div<{ size?: string }>`
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

export const LogoImage = styled.img<{ size: string; useBG?: boolean }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;

  ${({ useBG }) =>
    useBG &&
    css`
      background: radial-gradient(white 60%, #ffffff00 calc(70% + 1px));
      box-shadow: 0 0 1px white;
    `}
`

export type AssetLogoBaseProps = {
  symbol?: string | null
  backupImg?: string | null
  size?: string
  style?: React.CSSProperties
  hideL2Icon?: boolean
}
type AssetLogoProps = AssetLogoBaseProps & { isNative?: boolean; address?: string | null; chainId?: number }

const LogoContainer = styled.div`
  position: relative;
  display: flex;
`

const L2NetworkLogo = styled.div<{ networkUrl?: string; parentSize: string }>`
  --size: ${({ parentSize }) => `calc(${parentSize} / 2)`};
  width: var(--size);
  height: var(--size);
  position: absolute;
  left: 50%;
  bottom: 0;
  background: url(${({ networkUrl }) => networkUrl});
  background-repeat: no-repeat;
  background-size: ${({ parentSize }) => `calc(${parentSize} / 2) calc(${parentSize} / 2)`};
  display: ${({ networkUrl }) => !networkUrl && 'none'};
`

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */
export default function AssetLogo({
  isNative,
  address,
  chainId = ChainId.MAINNET,
  symbol,
  backupImg,
  size = '24px',
  style,
  hideL2Icon = false,
}: AssetLogoProps) {
  const imageProps = {
    alt: `${symbol ?? 'token'} logo`,
    size,
  }

  const [src, nextSrc] = useTokenLogoSource(address, chainId, isNative, backupImg)
  const L2Icon = getChainInfo(chainId)?.circleLogoUrl

  return (
    <LogoContainer style={style}>
      {src ? (
        <LogoImage {...imageProps} src={src} onError={nextSrc} useBG={true} />
      ) : (
        <MissingImageLogo size={size}>
          {/* use only first 3 characters of Symbol for design reasons */}
          {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
        </MissingImageLogo>
      )}
      {!hideL2Icon && <L2NetworkLogo networkUrl={L2Icon} parentSize={size} />}
    </LogoContainer>
  )
}
