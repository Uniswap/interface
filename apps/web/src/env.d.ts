// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../index.d.ts" />
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../packages/ui/src/env.d.ts" />

import { config, TamaguiGroupNames } from '~/tamagui.config'

type Conf = typeof config

declare module 'tamagui' {
  // oxlint-disable-next-line typescript/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): TamaguiGroupNames
  }
}
