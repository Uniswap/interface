import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'
import { SupportedChainId } from '../constants/chains'
import { useActiveWeb3React } from '../hooks/web3'

const backgroundResetStyles = {
  width: '100vw',
  height: '100vh',
  transform: 'unset',
}
const reset = (target: Record<string, any>) =>
  Object.entries(backgroundResetStyles).forEach(([key, value]) => (target[key] = value))

const backgroundRadialGradientElement = document.getElementById('background-radial-gradient')
export default function RadialGradientByChainUpdater(): null {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  // manage background color
  useEffect(() => {
    if (!backgroundRadialGradientElement) {
      return
    }

    if (chainId === SupportedChainId.ARBITRUM_ONE) {
      reset(backgroundRadialGradientElement.style)
      const arbitrumLightGradient =
        'radial-gradient(153.32% 100% at 47.26% 0%, rgba(40, 160, 240, 0.24) 0%, rgba(255, 0, 122, 0) 100%, rgba(255, 0, 122, 0.036) 100%), #FFFFFF'
      const arbitrumDarkGradient =
        'radial-gradient(147.96% 96.5% at 48.06% 0%, #28A0F0 0%, rgba(251, 59, 152, 0) 100%), #1F2128'
      backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
      // @ts-ignore
      backgroundRadialGradientElement.style.backgroundBlendMode = darkMode ? 'overlay, normal' : 'multiply, normal'
    } else {
      backgroundRadialGradientElement.style.background = ''
    }
  }, [darkMode, chainId])
  return null
}
