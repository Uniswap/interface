// Explicit import and (later) local export of Tamagui overrides
import { Text } from './components/text/Text'

export * from 'tamagui'
export * as Icons from './components/icons'
export * as Logos from './components/logos'
export { config } from './tamagui.config'
export { namedIconSizes } from './theme/iconSizes'
export { Text }
