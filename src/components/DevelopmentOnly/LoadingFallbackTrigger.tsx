import React, { useState } from 'react'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { useInterval } from 'src/utils/timing'

const PromiseThrower = ({ ms }: { ms: number }): null => {
  const [isLoading, setIsLoading] = useState(false)
  const frequency = ms

  useInterval(() => setIsLoading((prev) => !prev), frequency)

  if (isLoading) {
    throw new Promise(() => undefined)
  }
  return null
}

// make this componpent a child of a Suspense component to toggle its fallback every [ms] milliseconds
export const LoadingFallbackTrigger = ({ ms = 2000 }: { ms?: number }): JSX.Element => {
  return (
    // this should never be checked in but just in case
    <DevelopmentOnly>
      <PromiseThrower ms={ms} />
    </DevelopmentOnly>
  )
}

export const useLoadingTrigger = (ms = 2000): boolean => {
  const [isLoading, setIsLoading] = useState(false)
  const frequency = ms

  useInterval(() => setIsLoading((prev) => !prev), frequency)

  return isLoading
}
