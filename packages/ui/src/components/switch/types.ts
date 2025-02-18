import { SwitchProps as TamaguiSwitchProps } from 'tamagui'
import { SporeComponentVariant } from 'ui/src/components/types'

export type SwitchProps = TamaguiSwitchProps & {
  variant: SporeComponentVariant
}
