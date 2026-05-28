import React, { PropsWithChildren, useMemo } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { ColorTokens, Flex, flexStyles } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

type ScreenWithHeaderProps = {
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  fullScreen?: boolean // Expand to device edges
  backgroundColor?: ColorTokens
  backButtonColor?: ColorTokens
  edges?: Edge[]
}

export function ScreenWithHeader({
  centerElement,
  rightElement,
  fullScreen = false,
  backgroundColor = '$surface1',
  backButtonColor,
  edges = ['top', 'left', 'right'],
  children,
}: PropsWithChildren<ScreenWithHeaderProps>): JSX.Element {
  return (
    <Screen backgroundColor={backgroundColor} edges={edges} noInsets={fullScreen}>
      <ScreenHeader
        backButtonColor={backButtonColor}
        backgroundColor={backgroundColor}
        centerElement={centerElement}
        fullScreen={fullScreen}
        rightElement={rightElement}
      />
      <Flex style={flexStyles.fill}>{children}</Flex>
      <HorizontalEdgeGestureTarget />
    </Screen>
  )
}

type ScreenHeaderProps = {
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  fullScreen?: boolean // Expand to device edges
  backgroundColor?: ColorTokens
  backButtonColor?: ColorTokens
}

/**
 * Fixed header component that can be used in any screen context.
 * Supports customization of center and right elements, and can expand to device edges.
 */
function ScreenHeader({
  centerElement,
  rightElement = <Flex width={iconSizes.icon24} />,
  fullScreen = false,
  backgroundColor,
  backButtonColor,
}: ScreenHeaderProps): JSX.Element {
  const insets = useAppInsets()
  const headerRowStyles = useMemo(() => {
    return fullScreen
      ? {
          paddingTop: insets.top,
        }
      : { paddingTop: 0 }
  }, [fullScreen, insets.top])

  return (
    <HeaderWrapper backgroundColor={backgroundColor} fullScreen={fullScreen}>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        mx="$spacing16"
        my="$spacing12"
        style={headerRowStyles}
      >
        <BackButton color={backButtonColor} />
        <Flex shrink gap="$spacing16">
          {centerElement}
        </Flex>
        {rightElement}
      </Flex>
      <Flex borderBottomColor={backgroundColor ?? '$surface3'} borderBottomWidth={0.25} height={1} />
    </HeaderWrapper>
  )
}

// If full screen, extend content to edge of device screen
function HeaderWrapper({
  fullScreen,
  children,
  backgroundColor = '$surface1',
}: PropsWithChildren<{
  fullScreen: boolean
  backgroundColor?: ColorTokens
}>): JSX.Element {
  if (!fullScreen) {
    return <Flex backgroundColor={backgroundColor}>{children}</Flex>
  }
  return (
    <Flex backgroundColor={backgroundColor} left={0} position="absolute" right={0} top={0}>
      {children}
    </Flex>
  )
}
