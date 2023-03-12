import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'

import { darkTheme } from '../colors'

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
        : darkTheme.backgroundBackdrop
      return
    }

    switch (chainId) {
      case SupportedChainId.FUJI: {
        setBackground(backgroundResetStyles)
        const polygonDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
        backgroundRadialGradientElement.style.background = polygonDarkGradient
        break
      }
      case SupportedChainId.TESTNET: {
        setBackground(backgroundResetStyles)
        const polygonDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
        backgroundRadialGradientElement.style.background = polygonDarkGradient
        break
      }
      default: {
        setBackground(initialStyles)
        const defaultDarkGradient =
          'radial-gradient(100% 100% at 50% 0%, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.05) 52.6%, rgba(0, 0, 0, 0) 100%), #0D0E0E'
        backgroundRadialGradientElement.style.background = defaultDarkGradient
      }
    }
  }, [darkMode, chainId, isNftPage])
  return null
}
