import React, { useState } from 'react'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { useInterval } from 'src/utils/timing'

const PromiseThrower = ({ ms }: { ms: number }) => {
  const [isLoading, setIsLoading] = useState(false)
  const frequency = ms

  useInterval(() => setIsLoading((prev) => !prev), frequency)

  if (isLoading) {
    throw new Promise(() => {})
  }
  return null
}

// make this componpent a child of a Suspense component to toggle its fallback every [ms] milliseconds
export const LoadingFallbackTrigger = ({ ms = 2000 }: { ms?: number }) => {
  return (
    // this should never be checked in but just in case
    <DevelopmentOnly>
      <PromiseThrower ms={ms} />
    </DevelopmentOnly>
  )
}
