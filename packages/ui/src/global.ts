import { config } from './tamagui.config'

type Conf = typeof config

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}

  // TODO @nate: need to fix this in tamagui to allow for % and other string types
  // interface ThemeValueFallback {
  //   value: never
  // }
}
