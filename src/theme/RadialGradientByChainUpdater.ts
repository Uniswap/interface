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

    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
        reset(backgroundRadialGradientElement.style)
        const arbitrumLightGradient =
          'radial-gradient(150% 100% at 50% 0%, rgba(40, 160, 240, 0.25) 0%, rgba(255, 0, 122, 0) 100%, rgba(255, 0, 122, 0.03) 100%), #FFFFFF'
        const arbitrumDarkGradient =
          'radial-gradient(150% 96% at 50% 0%, #28A0F0 0%, rgba(251, 59, 152, 0) 100%), #1F2128'
        backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
        // @ts-ignore
        backgroundRadialGradientElement.style.backgroundBlendMode = darkMode ? 'overlay, normal' : 'multiply, normal'
        break
      case SupportedChainId.OPTIMISM:
        reset(backgroundRadialGradientElement.style)
        const optimismLightGradient =
          'radial-gradient(150% 100% at 50% 0%, rgba(255, 180, 180, 0.25) 0%, rgba(255, 0, 122, 0) 100%, rgba(255, 0, 122, 0.03) 100%), #FFFFFF'
        const optimismDarkGradient =
          'radial-gradient(150% 95% at 50% 0%, #FFB4B4 0%, rgba(251, 59, 152, 0) 100%), #1F2128'
        backgroundRadialGradientElement.style.background = darkMode ? optimismDarkGradient : optimismLightGradient
        // @ts-ignore
        backgroundRadialGradientElement.style.backgroundBlendMode = darkMode ? 'overlay, normal' : 'multiply, normal'
        break
      default:
        backgroundRadialGradientElement.style.background = ''
    }
  }, [darkMode, chainId])
  return null
}
