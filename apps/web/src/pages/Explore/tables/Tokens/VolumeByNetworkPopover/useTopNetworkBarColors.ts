import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSrcColor } from '~/hooks/useColor'
import { getChainLogoUrl } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/utils'

interface TopChainForBarColor {
  chainId: UniverseChainId
  name: string
}

/**
 * Derives bar/legend accent colors for the top N chains from each chain’s logo (with gray fallback).
 */
export function useTopNetworkBarColors(topChains: TopChainForBarColor[]): string[] {
  const colors = useSporeColors()
  const gray = colors.neutral3.val

  const chainId0 = topChains[0]?.chainId
  const chainId1 = topChains[1]?.chainId
  const chainId2 = topChains[2]?.chainId
  const logoUrl0 = getChainLogoUrl(chainId0)
  const logoUrl1 = getChainLogoUrl(chainId1)
  const logoUrl2 = getChainLogoUrl(chainId2)
  const chainName0 = topChains[0]?.name
  const chainName1 = topChains[1]?.name
  const chainName2 = topChains[2]?.name

  const color0 = useSrcColor({ src: logoUrl0, currencyName: chainName0 })
  const color1 = useSrcColor({ src: logoUrl1, currencyName: chainName1 })
  const color2 = useSrcColor({ src: logoUrl2, currencyName: chainName2 })

  return useMemo(
    () => [color0.tokenColor ?? gray, color1.tokenColor ?? gray, color2.tokenColor ?? gray],
    [gray, color0.tokenColor, color1.tokenColor, color2.tokenColor],
  )
}
