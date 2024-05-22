import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useIsDarkMode } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'

type IconComponentProps = SvgProps & { size?: IconSizeTokens | number }

const iconsCache = new Map<ChainId, React.FC<IconComponentProps>>()

function buildIconComponent(chainId: ChainId): React.FC<IconComponentProps> {
  const explorer = CHAIN_INFO[chainId].explorer
  const Component = ({ size }: IconComponentProps): JSX.Element => {
    const isDarkMode = useIsDarkMode()
    return isDarkMode ? <explorer.logoDark size={size} /> : <explorer.logoLight size={size} />
  }
  Component.displayName = `BlockExplorerIcon_${explorer.name}`
  iconsCache.set(chainId, Component)
  return Component
}

export function getBlockExplorerIcon(chainId: ChainId): React.FC<IconComponentProps> {
  return iconsCache.get(chainId) ?? buildIconComponent(chainId)
}
