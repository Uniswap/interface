import React from 'react'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { NetworkLabelProps } from 'src/components/Network/NetworkButtonGroup'
import { Pill } from 'src/components/text/Pill'
import { CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'

export function NetworkPill({
  chainId,
  showBorder,
  showIcon = true,
  height = 36,
  ...rest
}: NetworkLabelProps) {
  const info = CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      customBackgroundColor={colors?.background}
      customBorderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      height={height}
      icon={showIcon ? <NetworkLogo chainId={chainId} mr="xs" size={16} /> : null}
      label={info.label}
      {...rest}
    />
  )
}

export function InlineNetworkPill(props: NetworkLabelProps) {
  return (
    <NetworkPill
      borderRadius="xs"
      height={16}
      px="xxs"
      py="none"
      showIcon={false}
      textVariant="badge"
      {...props}
    />
  )
}
