import { config } from 'ui'

type Conf = typeof config

declare module 'tamagui' {
  type TamaguiCustomConfig = Conf
}

export default config
