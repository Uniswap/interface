import { config } from './tamagui.config'

export type Conf = typeof config

declare module '@tamagui/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}

  // interface ThemeValueFallback {
  //   value: never
  // }
}

export default config
