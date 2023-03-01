import { ChainId } from '@kyberswap/ks-sdk-core'
import React, { CSSProperties, useState } from 'react'
import { HelpCircle } from 'react-feather'
import { ImageProps } from 'rebass'

import { NETWORKS_INFO } from 'constants/networks'
import { useIsDarkMode } from 'state/user/hooks'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
}

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, ...rest }: LogoProps) {
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

  return <HelpCircle {...rest} />
}

export function NetworkLogo({ chainId, style = {} }: { chainId: ChainId; style?: CSSProperties }) {
  const isDarkMode = useIsDarkMode()
  const { iconDark, icon } = NETWORKS_INFO[chainId]
  const iconSrc = isDarkMode && iconDark ? iconDark : icon
  if (!iconSrc) return null
  return <img src={iconSrc} alt="Switch Network" style={style} />
}
