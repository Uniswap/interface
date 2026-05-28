import React, { Suspense, useDeferredValue } from 'react'

/**
 * This is useful for keeping the "last rendered" components on-screen while any suspense
 * is triggered below this component.
 *
 * It stores a reference to the current children, and then returns them as the fallback.
 */

export const SuspenseWithPreviousRenderAsFallback = (props: { children: React.ReactNode }) => {
  const previousChildren = useDeferredValue(props.children)

  return <Suspense fallback={previousChildren ?? null}>{props.children}</Suspense>
}
