import { SupportedChainId } from 'constants/chains'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import styled from 'styled-components/macro'

import { MissingImageLogo } from './BaseLogo'

const LogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px black;
  -webkit-box-shadow: 0 0 1px black;
  box-shadow: 0 0 1px black;
  border: 0px solid rgba(255, 255, 255, 0);
`

const NativeLogoImage = styled(LogoImage)`
  -mox-box-shadow: 0 0 1px white;
  -webkit-box-shadow: 0 0 1px white;
  box-shadow: 0 0 1px white;
`

export type AssetLogoBaseProps = { symbol?: string | null; size?: string; style?: React.CSSProperties }
type AssetLogoProps = AssetLogoBaseProps & { isNative?: boolean; address?: string | null; chainId?: number }

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */
export function AssetLogo({
  isNative,
  address,
  chainId = SupportedChainId.MAINNET,
  symbol,
  size = '24px',
  style,
  ...rest
}: AssetLogoProps) {
  const imageProps = {
    alt: `${symbol ?? 'token'} logo`,
    size,
    style,
    ...rest,
  }

  const [src, nextSrc] = useTokenLogoSource(address, chainId, isNative)

  if (src) {
    return isNative ? (
      <LogoImage {...imageProps} src={src} onError={nextSrc} />
    ) : (
      <NativeLogoImage {...imageProps} src={src} onError={nextSrc} />
    )
  } else {
    return (
      <MissingImageLogo size={size}>
        {/* use only first 3 characters of Symbol for design reasons */}
        {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
      </MissingImageLogo>
    )
  }
}
