// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../index.d.ts" />

import { config } from 'ui/src/tamagui.config'

type Conf = typeof config

declare module 'tamagui' {
  // oxlint-disable-next-line typescript/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'item' | 'card'
  }
}

export {}
