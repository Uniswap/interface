import React, { Suspense, useEffect, useRef } from 'react'

/**
 * This is useful for keeping the "last rendered" components on-screen while any suspense
 * is triggered below this component.
 *
 * It stores a reference to the current children, and then returns them as the fallback.
 */
export const SuspenseFallbackToPreviousContents = (props: { children: React.ReactNode }) => {
  const lastContents = useRef(props.children)

  useEffect(() => {
    lastContents.current = props.children
  }, [props.children])

  return <Suspense fallback={lastContents.current}>{props.children}</Suspense>
}
