import { createTamagui } from '@tamagui/core'
import { animations } from 'ui/src/theme/animations-css'
import { configWithoutAnimations } from 'ui/src/theme/config'

const {
  // lets have our own settings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings,
  ...defaultConfig
} = configWithoutAnimations

export const config = createTamagui({
  ...defaultConfig,
  animations,
  settings: {
    // leaving out allowedStyleValues - we want looser string values for most
    // styles (so you can use "1rem", "calc(...)" and other CSS goodies):
    autocompleteSpecificTokens: 'except-special',
  },
})

type Conf = typeof config

declare module '@tamagui/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}
}

export default config
