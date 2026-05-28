import { config, TamaguiGroupNames } from 'ui/src/tamagui.config'

type Conf = typeof config

declare module 'tamagui' {
  // oxlint-disable-next-line typescript/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): TamaguiGroupNames
  }
}
