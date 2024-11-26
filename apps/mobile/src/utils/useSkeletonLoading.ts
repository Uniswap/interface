import { useEffect, useState } from 'react'

/**
 * Utility hook used to delay rendering initially so that the screen render a skeleton of placeholders
 * to allow navigation to progress before rendering heavier components that may appear as lag
 */
export function useSkeletonLoading(): boolean {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setTimeout(() => setEnabled(false), 0)
  })

  return enabled
}
