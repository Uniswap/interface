import React, { ComponentProps } from 'react'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Pill } from 'src/components/text/Pill'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { iconSizes } from 'src/styles/sizing'
import { useNetworkColors } from 'src/utils/colors'

export type NetworkPillProps = {
  chainId: ChainId
  showBackgroundColor?: boolean
  showBorder?: boolean
  showIcon?: boolean
} & ComponentProps<typeof Pill>

export function NetworkPill({
  chainId,
  showBackgroundColor = true,
  showBorder,
  showIcon = true,
  ...rest
}: NetworkPillProps): JSX.Element {
  const info = CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      customBackgroundColor={showBackgroundColor ? colors?.background : undefined}
      customBorderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      icon={
        showIcon ? <NetworkLogo chainId={chainId} mr="spacing8" size={iconSizes.icon16} /> : null
      }
      label={info.label}
      {...rest}
    />
  )
}

export function InlineNetworkPill(props: NetworkPillProps): JSX.Element {
  return (
    <NetworkPill
      borderRadius="rounded12"
      px="spacing8"
      py="spacing2"
      showIcon={false}
      textVariant="buttonLabelMicro"
      {...props}
    />
  )
}
