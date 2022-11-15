import { SupportedChainId } from 'constants/chains'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import styled from 'styled-components/macro'

import { MissingImageLogo } from './BaseLogo'

const LogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 60%, #ffffff00 calc(70% + 1px));
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px white;
  -webkit-box-shadow: 0 0 1px white;
  box-shadow: 0 0 1px white;
`

export type AssetLogoBaseProps = {
  symbol?: string | null
  backupImg?: string | null
  print?: boolean
  size?: string
  style?: React.CSSProperties
}
type AssetLogoProps = AssetLogoBaseProps & { isNative?: boolean; address?: string | null; chainId?: number }

/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback triangle alert
 */
export default function AssetLogo({
  isNative,
  address,
  chainId = SupportedChainId.MAINNET,
  symbol,
  backupImg,
  print,
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

  const [src, nextSrc] = useTokenLogoSource(address, chainId, isNative, backupImg)

  if (src) {
    return <LogoImage {...imageProps} src={src} onError={nextSrc} />
  } else {
    return (
      <MissingImageLogo size={size}>
        {/* use only first 3 characters of Symbol for design reasons */}
        {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
      </MissingImageLogo>
    )
  }
}
