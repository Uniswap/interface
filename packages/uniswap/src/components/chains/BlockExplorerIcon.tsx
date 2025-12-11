import React from 'react'
import type { SvgProps } from 'react-native-svg'
import { IconSizeTokens } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type IconComponentProps = SvgProps & { size?: IconSizeTokens | number | { width: number; height: number } }

const iconsCache = new Map<UniverseChainId, React.FC<IconComponentProps>>()

function buildIconComponent(chainId: UniverseChainId): React.FC<IconComponentProps> {
  const explorer = getChainInfo(chainId).explorer

  const Component = ({ size }: IconComponentProps): JSX.Element => {
    const Logo = useBlockExplorerLogo(chainId)
    return <Logo size={size} />
  }
  Component.displayName = `BlockExplorerIcon_${explorer.name}`
  iconsCache.set(chainId, Component)
  return Component
}

export function getBlockExplorerIcon(chainId: UniverseChainId): React.FC<IconComponentProps> {
  return iconsCache.get(chainId) ?? buildIconComponent(chainId)
}
