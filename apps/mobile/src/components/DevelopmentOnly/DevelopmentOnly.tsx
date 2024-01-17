import React, { PropsWithChildren } from 'react'

export function DevelopmentOnly<T>({ children }: PropsWithChildren<T>): JSX.Element | null {
  if (!__DEV__ || !children) {
    return null
  }

  return <>{children}</>
}
