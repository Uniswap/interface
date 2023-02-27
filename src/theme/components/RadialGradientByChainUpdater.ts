import { useWeb3React } from '@web3-react/core'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'

import { SupportedChainId } from '../../constants/chains'
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
      // case SupportedChainId.ARBITRUM_ONE:
      // case SupportedChainId.ARBITRUM_RINKEBY:
      //   setBackground(backgroundResetStyles)
      //   const arbitrumLightGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(205, 232, 251, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
      //   const arbitrumDarkGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(10, 41, 75, 0.7) 0%, rgba(34, 30, 48, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
      //   backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
      //   break
      // case SupportedChainId.OPTIMISM:
      // case SupportedChainId.OPTIMISM_GOERLI:
      //   setBackground(backgroundResetStyles)
      //   const optimismLightGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(255, 251, 242, 0.8) 0%, rgba(255, 244, 249, 0.6958) 50.52%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
      //   const optimismDarkGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(62, 46, 56, 0.8) 0%, rgba(44, 31, 45, 0.6958) 50.52%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
      //   backgroundRadialGradientElement.style.background = darkMode ? optimismDarkGradient : optimismLightGradient
      //   break
      // case SupportedChainId.POLYGON:
      // case SupportedChainId.POLYGON_MUMBAI:
      //   setBackground(backgroundResetStyles)
      //   const polygonLightGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #FFFFFF'
      //   const polygonDarkGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(130, 71, 229, 0.2) 0%, rgba(200, 168, 255, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
      //   backgroundRadialGradientElement.style.background = darkMode ? polygonDarkGradient : polygonLightGradient
      //   break
      // case SupportedChainId.CELO:
      // case SupportedChainId.CELO_ALFAJORES:
      //   setBackground(backgroundResetStyles)
      //   const celoLightGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(186, 228, 210, 0.7) 0%, rgba(252, 243, 249, 0.6536) 49.48%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
      //   const celoDarkGradient =
      //     'radial-gradient(100% 100% at 50% 0%, rgba(20, 49, 37, 0.29) 0%, rgba(12, 31, 23, 0.6536) 49.48%, rgba(31, 33, 40, 0) 100%, rgba(31, 33, 40, 0) 100%), #0D0E0E'
      //   backgroundRadialGradientElement.style.background = darkMode ? celoDarkGradient : celoLightGradient
      //   break
      case SupportedChainId.SCROLL_ALPHA:
        setBackground(backgroundResetStyles)
        const scrollLightGradient = 'radial-gradient(142% 91% at 111% 84%, #EEE2D4FF 0%, #F8F2EAFF 100%), #FFFFFF'
        const scrollDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(110, 80, 120, 0.2) 0%, rgba(200, 148, 100, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
        backgroundRadialGradientElement.style.background = darkMode ? scrollDarkGradient : scrollLightGradient
        break
      default:
        setBackground(initialStyles)
        const defaultLightGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(255, 184, 226, 0.51) 0%, rgba(255, 255, 255, 0) 100%), #FFFFFF'
        const defaultDarkGradient = 'linear-gradient(180deg, #202738 0%, #070816 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? defaultDarkGradient : defaultLightGradient
    }
  }, [darkMode, chainId, isNftPage])
  return null
}
