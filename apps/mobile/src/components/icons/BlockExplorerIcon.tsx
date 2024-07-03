import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useIsDarkMode } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { WalletChainId } from 'uniswap/src/types/chains'

type IconComponentProps = SvgProps & { size?: IconSizeTokens | number }

const iconsCache = new Map<WalletChainId, React.FC<IconComponentProps>>()

function buildIconComponent(chainId: WalletChainId): React.FC<IconComponentProps> {
  const explorer = UNIVERSE_CHAIN_INFO[chainId].explorer
  const exlorerLogos = UNIVERSE_CHAIN_LOGO[chainId].explorer

  const Component = ({ size }: IconComponentProps): JSX.Element => {
    const isDarkMode = useIsDarkMode()
    return isDarkMode ? <exlorerLogos.logoDark size={size} /> : <exlorerLogos.logoLight size={size} />
  }
  Component.displayName = `BlockExplorerIcon_${explorer.name}`
  iconsCache.set(chainId, Component)
  return Component
}

export function getBlockExplorerIcon(chainId: WalletChainId): React.FC<IconComponentProps> {
  return iconsCache.get(chainId) ?? buildIconComponent(chainId)
}
