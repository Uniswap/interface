import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useIsDarkMode } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type IconComponentProps = SvgProps & { size?: IconSizeTokens | number }

const iconsCache = new Map<UniverseChainId, React.FC<IconComponentProps>>()

function buildIconComponent(chainId: UniverseChainId): React.FC<IconComponentProps> {
  const explorer = getChainInfo(chainId).explorer
  const explorerLogos = UNIVERSE_CHAIN_LOGO[chainId].explorer

  const Component = ({ size }: IconComponentProps): JSX.Element => {
    const isDarkMode = useIsDarkMode()
    return isDarkMode ? <explorerLogos.logoDark size={size} /> : <explorerLogos.logoLight size={size} />
  }
  Component.displayName = `BlockExplorerIcon_${explorer.name}`
  iconsCache.set(chainId, Component)
  return Component
}

export function getBlockExplorerIcon(chainId: UniverseChainId): React.FC<IconComponentProps> {
  return iconsCache.get(chainId) ?? buildIconComponent(chainId)
}
