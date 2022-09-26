import { useWeb3React } from '@web3-react/core'
import { BaseVariant } from 'featureFlags'
import { useRedesignFlag } from 'featureFlags/flags/redesign'
import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'

import { SupportedChainId } from '../constants/chains'

const initialStyles = {
  width: '200vw',
  height: '200vh',
  transform: 'translate(-50vw, -100vh)',
  backgroundBlendMode: '',
}
const backgroundResetStyles = {
  width: '100vw',
  height: '100vh',
  transform: 'unset',
  backgroundBlendMode: '',
}

type TargetBackgroundStyles = typeof initialStyles | typeof backgroundResetStyles

const backgroundRadialGradientElement = document.getElementById('background-radial-gradient')
const setBackground = (newValues: TargetBackgroundStyles) =>
  Object.entries(newValues).forEach(([key, value]) => {
    if (backgroundRadialGradientElement) {
      backgroundRadialGradientElement.style[key as keyof typeof backgroundResetStyles] = value
    }
  })
export default function RadialGradientByChainUpdater(): null {
  const { chainId } = useWeb3React()
  const [darkMode] = useDarkModeManager()
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === BaseVariant.Enabled
  // manage background color
  useEffect(() => {
    if (!backgroundRadialGradientElement) {
      return
    }

    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
      case SupportedChainId.ARBITRUM_RINKEBY:
        setBackground(backgroundResetStyles)
        const arbitrumLightGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(205, 232, 251, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
          : 'radial-gradient(150% 100% at 50% 0%, #CDE8FB 0%, #FCF3F9 50%, #FFFFFF 100%)'
        const arbitrumDarkGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(10, 41, 75, 0.7) 0%, rgba(34, 30, 48, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
          : 'radial-gradient(150% 100% at 50% 0%, #0A294B 0%, #221E30 50%, #1F2128 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
        break
      case SupportedChainId.OPTIMISM:
      case SupportedChainId.OPTIMISM_GOERLI:
        setBackground(backgroundResetStyles)
        const optimismLightGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(255, 251, 242, 0.8) 0%, rgba(255, 244, 249, 0.6958) 50.52%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
          : 'radial-gradient(150% 100% at 50% 0%, #FFFBF2 2%, #FFF4F9 53%, #FFFFFF 100%)'
        const optimismDarkGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(62, 46, 56, 0.8) 0%, rgba(44, 31, 45, 0.6958) 50.52%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
          : 'radial-gradient(150% 100% at 50% 0%, #3E2E38 2%, #2C1F2D 53%, #1F2128 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? optimismDarkGradient : optimismLightGradient
        break
      case SupportedChainId.POLYGON:
      case SupportedChainId.POLYGON_MUMBAI:
        setBackground(backgroundResetStyles)
        const polygonLightGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #FFFFFF'
          : 'radial-gradient(153.32% 100% at 47.26% 0%, rgba(130, 71, 229, 0.0864) 0%, rgba(0, 41, 255, 0.06) 48.19%, rgba(0, 41, 255, 0.012) 100%), #FFFFFF'
        const polygonDarkGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
          : 'radial-gradient(150.6% 98.22% at 48.06% 0%, rgba(130, 71, 229, 0.6) 0%, rgba(200, 168, 255, 0) 100%), #1F2128'
        backgroundRadialGradientElement.style.background = darkMode ? polygonDarkGradient : polygonLightGradient
        backgroundRadialGradientElement.style.backgroundBlendMode = redesignFlagEnabled
          ? 'none'
          : darkMode
          ? 'overlay,normal'
          : 'multiply,normal'
        break
      case SupportedChainId.CELO:
      case SupportedChainId.CELO_ALFAJORES:
        setBackground(backgroundResetStyles)
        const celoLightGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(186, 228, 210, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
          : 'radial-gradient(150% 100% at 50% 0%,#35D07F35 0, #FBCC5C35 100%)'
        const celoDarkGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(20, 49, 37, 0.29) 0%, rgba(12, 31, 23, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
          : 'radial-gradient(150% 100% at 50% 0%, rgb(2 80 47) 2%, rgb(12 41 28) 53%, rgb(31, 33, 40) 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? celoDarkGradient : celoLightGradient
        backgroundRadialGradientElement.style.backgroundBlendMode = redesignFlagEnabled
          ? 'none'
          : darkMode
          ? 'overlay,normal'
          : 'multiply,normal'
        break
      default:
        setBackground(initialStyles)
        const defaultLightGradient = redesignFlagEnabled
          ? 'radial-gradient(100% 100% at 50% 0%, rgba(255, 184, 226, 0.51) 0%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
          : 'radial-gradient(50% 50% at 50% 50%,#fc077d10 0,rgba(255,255,255,0) 100%)'
        const defaultDarkGradient = redesignFlagEnabled
          ? 'linear-gradient(180deg, #202738 0%, #070816 100%)'
          : 'radial-gradient(50% 50% at 50% 50%,#fc077d10 0,rgba(255,255,255,0) 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? defaultDarkGradient : defaultLightGradient
        backgroundRadialGradientElement.style.backgroundBlendMode = redesignFlagEnabled
          ? 'none'
          : darkMode
          ? 'overlay,normal'
          : 'multiply,normal'
    }
  }, [darkMode, chainId, redesignFlagEnabled])
  return null
}
