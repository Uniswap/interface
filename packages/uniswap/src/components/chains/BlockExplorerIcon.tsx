import { UniverseChainId } from '@universe/chains'
import type { IconProps } from '@universe/mycelium/icons'
import React from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'

type IconComponentProps = Pick<IconProps, 'size' | 'color'>

const iconsCache = new Map<UniverseChainId, React.FC<IconComponentProps>>()

function buildIconComponent(chainId: UniverseChainId): React.FC<IconComponentProps> {
  const explorer = getChainInfo(chainId).explorer

  const Component = ({ size, color }: IconComponentProps): JSX.Element => {
    const Logo = useBlockExplorerLogo(chainId)
    return <Logo size={size} color={color} />
  }
  Component.displayName = `BlockExplorerIcon_${explorer.name}`
  iconsCache.set(chainId, Component)
  return Component
}

export function getBlockExplorerIcon(chainId: UniverseChainId): React.FC<IconComponentProps> {
  return iconsCache.get(chainId) ?? buildIconComponent(chainId)
}
