import { ReactElement } from 'react'
import { LinearGradient, Stop } from 'react-native-svg'
import { useIsDarkMode } from 'ui/src'

// Exported from figma
export function InnerCircleGradient({ id }: { id: string }): ReactElement<LinearGradient> {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <LinearGradient id={id} x1="0.194" x2="1" y1="0.190" y2="0.671">
      <Stop stopColor="#999999" stopOpacity="0" />
      <Stop offset="0.47" stopColor="#999999" />
      <Stop offset="1" stopColor="#999999" stopOpacity="0" />
    </LinearGradient>
  ) : (
    <LinearGradient id={id} x1="0.722" x2="0.318" y1="0.0473" y2="0.974">
      <Stop stopColor="#E1E1E1" />
      <Stop offset="0.239583" stopColor="#FFFFFF" />
      <Stop offset="0.802083" stopColor="#FFFFFF" />
      <Stop offset="1" stopColor="#E1E1E1" />
    </LinearGradient>
  )
}

export function OuterCircleGradient({ id }: { id: string }): ReactElement<LinearGradient> {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <LinearGradient id={id} x1="-0.0229" x2="1.0686" y1="0.525" y2="0.599">
      <Stop stopColor="#999999" stopOpacity="0" />
      <Stop offset="0.47" stopColor="#999999" />
      <Stop offset="1" stopColor="#999999" stopOpacity="0" />
    </LinearGradient>
  ) : (
    <LinearGradient id={id} x1="0.5" x2="0.5" y1="0" y2="1">
      <Stop stopColor="#E1E1E1" />
      <Stop offset="0.119792" stopColor="#FFFFFF" />
      <Stop offset="0.880208" stopColor="#FFFFFF" />
      <Stop offset="1" stopColor="#E1E1E1" />
    </LinearGradient>
  )
}
