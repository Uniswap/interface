import { useState } from 'react'
import { Slash } from 'react-feather'
import { ImageProps } from 'rebass'

import useTheme from '../../hooks/useTheme'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, style, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const theme = useTheme()

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

  return <Slash {...rest} style={{ ...style, color: theme.bg4 }} />
}
