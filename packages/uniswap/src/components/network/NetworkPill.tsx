import { ComponentProps } from 'react'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useNetworkColors } from 'uniswap/src/utils/colors'

export type NetworkPillProps = {
  chainId: UniverseChainId
  showBackgroundColor?: boolean
  showBorder?: boolean
  showIcon?: boolean
  iconSize?: number
} & ComponentProps<typeof Pill>

export function NetworkPill({
  chainId,
  showBackgroundColor = true,
  showBorder,
  showIcon = false,
  iconSize = iconSizes.icon16,
  ...rest
}: NetworkPillProps): JSX.Element {
  const info = UNIVERSE_CHAIN_INFO[chainId]
  const colors = useNetworkColors(chainId)

  return (
    <Pill
      customBackgroundColor={showBackgroundColor ? colors?.background : undefined}
      customBorderColor={showBorder ? colors.foreground : 'transparent'}
      foregroundColor={colors.foreground}
      icon={showIcon ? <NetworkLogo chainId={chainId} size={iconSize} /> : null}
      label={info.label}
      {...rest}
    />
  )
}

export function InlineNetworkPill(props: NetworkPillProps): JSX.Element {
  return <NetworkPill borderRadius="$rounded8" px="$spacing4" py="$none" textVariant="buttonLabel3" {...props} />
}
