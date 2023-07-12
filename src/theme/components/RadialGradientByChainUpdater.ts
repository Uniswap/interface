import { ChainId } from '@thinkincoin-libs/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useEffect } from 'react'
import { useDarkModeManager } from 'theme/components/ThemeToggle'

import { darkTheme, lightTheme } from '../colors'

const initialStyles = {
  width: '200vw',
  height: '200vh',
  transform: 'translate(-50vw, -100vh)',
}
const backgroundResetStyles = {
  width: '100vw',
  height: '100vh',
  transform: 'unset',
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
  const isNftPage = useIsNftPage()

  // manage background color
  useEffect(() => {
    if (!backgroundRadialGradientElement) {
      return
    }

    if (isNftPage) {
      setBackground(initialStyles)
      backgroundRadialGradientElement.style.background = darkMode
        ? darkTheme.backgroundBackdrop
        : lightTheme.backgroundBackdrop
      return
    }

    switch (chainId) {
      case ChainId.ARBITRUM_ONE:
      case ChainId.ARBITRUM_GOERLI: {
        setBackground(backgroundResetStyles)
        const arbitrumLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(205, 232, 251, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const arbitrumDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(10, 41, 75, 0.7) 0%, rgba(34, 30, 48, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
        break
      }
      case ChainId.OPTIMISM:
      case ChainId.OPTIMISM_GOERLI: {
        setBackground(backgroundResetStyles)
        const optimismLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(255, 251, 242, 0.8) 0%, rgba(255, 244, 249, 0.6958) 50.52%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const optimismDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(62, 46, 56, 0.8) 0%, rgba(44, 31, 45, 0.6958) 50.52%, rgba(31, 33, 40, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? optimismDarkGradient : optimismLightGradient
        break
      }
      case ChainId.POLYGON:
      case ChainId.POLYGON_MUMBAI: {
        setBackground(backgroundResetStyles)
        const polygonLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #FFFFFF'
        const polygonDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? polygonDarkGradient : polygonLightGradient
        break
      }
      case ChainId.CELO:
      case ChainId.CELO_ALFAJORES: {
        setBackground(backgroundResetStyles)
        const celoLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(186, 228, 210, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const celoDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(20, 49, 37, 0.29) 0%, rgba(12, 31, 23, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%, rgba(31, 33, 40, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? celoDarkGradient : celoLightGradient
        break
      }
      case ChainId.BNB: {
        setBackground(backgroundResetStyles)
        const bscLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(242 , 186, 8, 0.1) 0%, rgba(238, 182, 6, 0.08) 50%, rgba(140, 185, 11, 0) 100%), #FFFFFF'
        const bscDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(169, 132, 17, 0.1) 0%, rgba(128, 100, 14, 0.08) 50%, rgba(140, 185, 11, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? bscDarkGradient : bscLightGradient
        break
      }
      case ChainId.AVALANCHE: {
        setBackground(backgroundResetStyles)
        const avaxLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(255, 251, 242, 0.8) 0%, rgba(255, 244, 249, 0.6958) 50.52%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const avaxDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(62, 46, 56, 0.8) 0%, rgba(68, 17, 71, 0.6958) 50.52%, rgba(140, 18, 35, 0) 100%), #240408'
        backgroundRadialGradientElement.style.background = darkMode ? avaxDarkGradient : avaxLightGradient
        break
      }
      case ChainId.HARMONY: {
        setBackground(backgroundResetStyles)
        const harmonyLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(219, 219, 219, 0.8) 0%, rgba(255, 244, 249, 0.6958) 50.52%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const harmonyDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(33, 184, 148, 0.1) 0%, rgba(9, 71, 28, 0.08) 50%, rgba(29, 181, 91, 0) 100%), #051f0b'
        backgroundRadialGradientElement.style.background = darkMode ? harmonyDarkGradient : harmonyLightGradient
        break
      }
      default: {
        setBackground(initialStyles)
        const defaultLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(184, 255, 208, 0.51) 10%, rgba(255, 255, 255, 0) 90%), #dbdbdb'
        const defaultDarkGradient = 'linear-gradient(180deg, #102b18 10%, #0c2111 90%) #091f10'
        backgroundRadialGradientElement.style.background = darkMode ? defaultDarkGradient : defaultLightGradient
      }
    }
  }, [darkMode, chainId, isNftPage])
  return null
}
