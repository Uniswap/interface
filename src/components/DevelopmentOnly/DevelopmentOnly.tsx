import React, { PropsWithChildren } from 'react'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'

export function DevelopmentOnly<T>({ children }: PropsWithChildren<T>): JSX.Element | null {
  const showDevSettings = isEnabled(TestConfig.ShowDevSettings)

  if (!showDevSettings || !children) return null

  return <>{children}</>
}
