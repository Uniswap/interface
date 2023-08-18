import React, { ComponentProps } from 'react'
import { Pill } from 'src/components/text/Pill'
import { useNetworkColors } from 'src/utils/colors'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

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
  showIcon = false,
  ...rest
}: NetworkPillProps): JSX.Element {
  const info = CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      customBackgroundColor={showBackgroundColor ? colors?.background : undefined}
      customBorderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      icon={showIcon ? <NetworkLogo chainId={chainId} size={iconSizes.icon16} /> : null}
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
      textVariant="buttonLabelMicro"
      {...props}
    />
  )
}
