import React from 'react'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { NetworkLabelProps } from 'src/components/Network/NetworkButtonGroup'
import { Pill } from 'src/components/text/Pill'
import { CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'

export function NetworkPill({ chainId, showBorder = false }: NetworkLabelProps) {
  const info = CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      customBackgroundColor={colors?.background}
      customBorderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      icon={<NetworkLogo chainId={chainId} mr="xs" size={20} />}
      label={info.label}
    />
  )
}
