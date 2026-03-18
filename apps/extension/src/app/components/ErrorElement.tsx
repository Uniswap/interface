import { PropsWithChildren } from 'react'
import { useRouteError } from 'react-router'

export function ErrorElement({ children }: PropsWithChildren<unknown>): JSX.Element {
  const error = useRouteError()

  if (!error) {
    return <>{children}</>
  }

  // Need to throw here to propagate to the ErrorBoundary
  throw error
}
