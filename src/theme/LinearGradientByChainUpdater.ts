import { useActiveWeb3React } from 'hooks/web3'
import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'

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

const backgroundLinearGradientElement = document.getElementById('background-linear-gradient')

const setBackground = (newValues: TargetBackgroundStyles) =>
  Object.entries(newValues).forEach(([key, value]) => {
    if (backgroundLinearGradientElement) {
      backgroundLinearGradientElement.style[key as keyof typeof backgroundResetStyles] = value
    }
  })

export default function LinearGradientByChainUpdater(): null {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  // manage background color
  useEffect(() => {
    if (!backgroundLinearGradientElement) {
      return
    }
    setBackground(initialStyles)
    const defaultLightGradient = 'linear-gradient(to right bottom, #CDE8FB 0%, #F4F6FF 40%, #FFFFFF 100%)'
    const defaultDarkGradient =
      'linear-gradient(to right bottom, rgba(29, 24, 32, 0.8) 0%, rgba(29, 26, 31, 0.8) 47.92%, rgba(26, 31, 38, 0.8) 100%)'
    backgroundLinearGradientElement.style.background = darkMode ? defaultDarkGradient : defaultLightGradient
  }, [darkMode, chainId])
  return null
}
