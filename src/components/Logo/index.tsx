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
  return (
    <svg height={numberSize} width={numberSize} {...rest} fill="none">
      <circle cx={numberSize / 2} cy={numberSize / 2} r="50%" fill={theme.white} />
      <text
        height={numberSize}
        width={numberSize}
        fill={theme.black}
        stroke="none"
        fontSize={Math.floor(numberSize / 4)}
        fontWeight="600"
        y="60%"
        x="50%"
        textAnchor="middle"
      >
        {defaultText.length > 4 ? `${defaultText.slice(0, 3).toUpperCase()}...` : defaultText.toUpperCase()}
      </text>
    </svg>
  )
}
