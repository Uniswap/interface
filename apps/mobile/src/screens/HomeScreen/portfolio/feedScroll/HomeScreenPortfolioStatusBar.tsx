import { interpolateColor, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { useHomeScreenPortfolioScroll } from 'src/screens/HomeScreen/portfolio/context/HomeScreenPortfolioScrollContext'
import { useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

interface HomeScreenPortfolioStatusBarProps {
  heightCollapsed: number
  heightExpanded: number
}

export function HomeScreenPortfolioStatusBar({
  heightCollapsed,
  heightExpanded,
}: HomeScreenPortfolioStatusBarProps): JSX.Element {
  const colors = useSporeColors()
  const insets = useAppInsets()
  const { feedScrollValue } = useHomeScreenPortfolioScroll()
  const headerHeightDiff = heightExpanded - heightCollapsed
  const currentScrollValue = useDerivedValue(() => feedScrollValue.value, [feedScrollValue.value])

  const statusBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      currentScrollValue.value,
      [0, headerHeightDiff],
      [colors.surface1.val, colors.surface1.val],
    ),
  }))

  return (
    <AnimatedFlex
      height={insets.top}
      position="absolute"
      style={statusBarStyle}
      top={0}
      width="100%"
      zIndex="$sticky"
    />
  )
}
