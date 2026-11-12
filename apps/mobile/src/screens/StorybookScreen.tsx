// oxlint-disable typescript/no-var-requires
import { Flex } from '@universe/mycelium'
import { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

/**
 * True only in the device-farm storybook artifacts: release-mode bundles (__DEV__ false)
 * that ship Storybook and boot straight into it. process.env is used directly so the
 * bundler can statically evaluate this at build time; must stay in sync with the
 * metro.config.js withStorybook gate.
 */
// oxlint-disable-next-line eslint-js/no-restricted-syntax
export const isStorybookBuild = process.env.STORYBOOK_ENABLED === 'true'

// Dev builds keep the Storybook screen too (reached via the dev menu).
export const storybookScreenEnabled = isStorybookBuild || __DEV__

// Storybook artifacts boot straight into this screen, so none of the product screens
// that normally dismiss the splash ever mounts. onLayout fires on the wrapper's first
// layout and again on relayout; BootSplash.hide() is idempotent, so re-fires are harmless.
export function StorybookScreen(): JSX.Element {
  const hideSplashScreen = useHideSplashScreen()
  let storybook: JSX.Element | null = null
  // This gate must be spelled out from the inlinable atoms (process.env.*, __DEV__): metro's
  // constant folding then deletes the whole branch — the .rnstorybook require and every story it
  // pulls in, ~2MB — from product bundles. Testing the exported storybookScreenEnabled instead
  // does not fold (the export transform keeps its binding from evaluating statically).
  // oxlint-disable-next-line eslint-js/no-restricted-syntax
  if (process.env.STORYBOOK_ENABLED === 'true' || __DEV__) {
    const StorybookUIRoot = require('src/../.rnstorybook').default
    storybook = <StorybookUIRoot />
  }
  return (
    <Flex flex={1} onLayout={hideSplashScreen}>
      {storybook}
    </Flex>
  )
}

/** Adds a "Toggle Storybook" item to the app's dev menu in debug builds. */
export function useStorybookDevMenuItem(): void {
  const navigation = useAppStackNavigation()

  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Storybook', () => {
        if (navigationRef.getCurrentRoute()?.name === MobileScreens.Storybook) {
          navigation.goBack()
        } else {
          navigation.navigate(MobileScreens.Storybook)
        }
      })
    }
  }, [navigation])
}
