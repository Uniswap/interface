import { BAD_SRCS } from 'constants/TokenLogoLookupTable'
import { useState } from 'react'
import { ImageProps } from 'rebass'
import styled from 'styled-components/macro'

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  src?: string | null
  symbol?: string | null
  size?: string
}

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

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ src, srcs, alt, style, size, symbol, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const currentSrc: string | undefined = src ?? srcs.find((src) => !BAD_SRCS[src])

  if (currentSrc) {
    return (
      <img
        {...rest}
        alt={alt}
        src={currentSrc}
        style={style}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh((i) => i + 1)
        }}
      />
    )
  }

  return (
    <MissingImageLogo size={size}>
      {/* use only first 3 characters of Symbol for design reasons */}
      {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}
