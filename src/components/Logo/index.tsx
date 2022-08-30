import { useState } from 'react'
import { ImageProps } from 'rebass'
import styled from 'styled-components/macro'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  symbol?: string
  size?: string
}

const getFontSize = (size?: string) => {
  switch (size) {
    case '48px':
      return '16px'
    case '36px':
      return '12px'
    case '24px':
      return '8px'
    default:
      return '12px'
  }
}

const MissingImageLogo = styled.div<{ size?: string; getFontSize: (size?: string) => string }>`
  border-radius: 100px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: ${({ getFontSize, size }) => getFontSize(size)};
  height: ${({ size }) => size ?? '24px'};
  line-height: ${({ size }) => size ?? '24px'};
  text-align: center;
  width: ${({ size }) => size ?? '24px'};
`

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, style, size, symbol, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const src: string | undefined = srcs.find((src) => !BAD_SRCS[src])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        style={style}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh((i) => i + 1)
        }}
      />
    )
  }

  return (
    <MissingImageLogo size={size} getFontSize={getFontSize}>
      {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}
