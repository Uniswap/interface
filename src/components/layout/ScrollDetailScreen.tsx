import { useNavigation } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import React, { PropsWithChildren, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { theme } from 'src/styles/theme'

const CONTENT_MAX_SCROLL_Y = 50

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Types for React Native View prop pointerEvents, necessary typing for AnimatedBlurView's animatedProps
type PointerEvent = 'auto' | 'none'

type ScrollDetailScreenProps = {
  title?: string
  titleElement?: ReactElement
  contentHeader?: ReactElement
}

export function ScrollDetailScreen({
  title,
  titleElement,
  contentHeader,
  children,
}: PropsWithChildren<ScrollDetailScreenProps>) {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // On scroll, ListContentHeader fades out and FixedHeaderBar fades in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      pointerEvents: (scrollY.value === 0 ? 'none' : 'auto') as PointerEvent,
    }
  })

  const contentHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [1, 0], Extrapolate.CLAMP),
    }
  })

  const ContentHeader = (
    <AnimatedFlex mt="sm" mx="md" style={contentHeaderStyle}>
      <Button
        onPress={() => {
          navigation.goBack()
        }}>
        <Flex row alignItems="center" gap="xs">
          <Chevron color={theme.colors.textSecondary} direction="w" height={18} width={18} />
          <Text color="textSecondary" variant={'subHead1'}>
            {t('Back')}
          </Text>
        </Flex>
      </Button>
      {contentHeader}
    </AnimatedFlex>
  )

  const FixedHeaderBar = (
    <AnimatedBlurView
      animatedProps={blurViewProps}
      intensity={95}
      style={[
        headerStyle,
        BlurHeaderStyle,
        {
          paddingTop: insets.top,
        },
      ]}
      tint={isDarkMode ? 'dark' : 'default'}>
      <Flex row alignItems="center" justifyContent="space-between" px="md" py="sm">
        <BackButton color="textPrimary" size={18} />
        {titleElement ? (
          titleElement
        ) : title ? (
          <Text mx="xs" variant="subHead1">
            {title}
          </Text>
        ) : null}
        <Box width={18} />
      </Flex>
    </AnimatedBlurView>
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      {FixedHeaderBar}
      <Animated.ScrollView
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}>
        {ContentHeader}
        {children}
      </Animated.ScrollView>
    </Screen>
  )
}

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  zIndex: 10,
}
