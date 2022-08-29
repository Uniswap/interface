import { useState } from 'react'
import { ImageProps } from 'rebass'
import styled from 'styled-components/macro'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  symbol: string | undefined
}

const MissingImageLogo = styled.div`
  border-radius: 100px;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: 12px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  width: 36px;
`

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, style, symbol, ...rest }: LogoProps) {
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

  return <MissingImageLogo>{symbol?.replace('$', '').slice(0, 3)}</MissingImageLogo>
}
