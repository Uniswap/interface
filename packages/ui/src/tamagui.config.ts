import { createTamagui } from 'tamagui'
import { animations } from 'ui/src/theme/animations'
import { configWithoutAnimations } from 'ui/src/theme/config'

export type { TamaguiGroupNames } from 'ui/src/theme/config'

export const config = createTamagui({
  animations,
  ...configWithoutAnimations,
})

export default config
