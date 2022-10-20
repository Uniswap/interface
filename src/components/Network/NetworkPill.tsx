import React, { ComponentProps } from 'react'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Pill } from 'src/components/text/Pill'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useNetworkColors } from 'src/utils/colors'

export type NetworkPillProps = {
  chainId: ChainId
  height?: number
  showBorder?: boolean
  showIcon?: boolean
} & ComponentProps<typeof Pill>

export function NetworkPill({
  chainId,
  showBorder,
  showIcon = true,
  height = 36,
  ...rest
}: NetworkPillProps) {
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

export function InlineNetworkPill(props: NetworkPillProps) {
  return (
    <NetworkPill
      borderRadius="xs"
      px="xxs"
      py="xxxs"
      showIcon={false}
      textVariant="buttonLabelMicro"
      {...props}
    />
  )
}
