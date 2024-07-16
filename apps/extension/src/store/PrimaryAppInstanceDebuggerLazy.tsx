import { lazy } from 'react'

const PrimaryAppInstanceDebugger = lazy(() => import('src/store/PrimaryAppInstanceDebugger'))

export function PrimaryAppInstanceDebuggerLazy(): JSX.Element | null {
  return __DEV__ ? <PrimaryAppInstanceDebugger /> : null
}
