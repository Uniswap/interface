import { createTamagui } from '@tamagui/core'
import { animations } from 'ui/src/theme/animations-css'
import { configWithoutAnimations } from 'ui/src/theme/config'

export const config = createTamagui({
  animations,
  ...configWithoutAnimations,
})

export default config
