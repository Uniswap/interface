import React, { useContext, useState } from 'react'
import { ImageProps } from 'rebass'
import { ThemeContext } from 'styled-components'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

export interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  size?: string
  defaultText: string
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, size, defaultText, ...rest }: LogoProps) {
  const theme = useContext(ThemeContext)
  const [, refresh] = useState<number>(0)

  const src: string | undefined = srcs.find(src => !BAD_SRCS[src])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh(i => i + 1)
        }}
      />
    )
  }

  const numberSize = size ? parseInt(size) : 24
  const fontSize = Math.ceil(numberSize / 4.5)
  return (
    <svg height={numberSize} width={numberSize} {...rest} fill="none">
      <circle cx={numberSize / 2} cy={numberSize / 2} r={numberSize / 2} fill={theme.white} />
      <text
        fill={theme.black}
        stroke="none"
        fontSize={fontSize}
        fontWeight="600"
        x={numberSize / 2}
        y={numberSize / 2 + Math.floor(fontSize / 2)}
        textAnchor="middle"
      >
        {defaultText.length > 4 ? `${defaultText.slice(0, 4).toUpperCase()}...` : defaultText.toUpperCase()}
      </text>
    </svg>
  )
}
