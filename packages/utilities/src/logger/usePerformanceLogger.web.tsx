import { datadogRum } from '@datadog/browser-rum'
import { DependencyList, useEffect } from 'react'
import { DDRumAction } from 'utilities/src/logger/datadog/datadogEvents'
import { logger } from 'utilities/src/logger/logger'

/**
 * Hook for measuring performance between renders on target dependencies.
 *
 * Web implementation using datadogRum.addAction() and requestAnimationFrame
 * to wait for paint before measuring.
 *
 * @param eventName - The name of the event to log.
 * @param dependencyList - The DependencyList that will start tracking the performance.
 */
export function usePerformanceLogger(eventName: string, dependencyList: DependencyList): void {
  useEffect(() => {
    const start = performance.now()
    const triggers = dependencyList.map((dep) => (typeof dep === 'string' ? dep.slice(0, 100) : dep))

    // wait for the next frame to ensure the state change that triggers a re-render has fired
    const rafId = requestAnimationFrame(() => {
      try {
        const end = performance.now()
        const duration = end - start

        datadogRum.addAction(DDRumAction.ManualTiming, { duration, eventName, triggers })
      } catch (error) {
        logger.error(error, {
          tags: { file: 'usePerformanceLogger.web.tsx', function: 'logPerformance' },
        })
      }
    })

    return () => cancelAnimationFrame(rafId)
    // eventName is required and should never change so it's safe to ignore it
    // dependencyList is a DependencyList which is the object a useEffect hook takes
    // biome-ignore lint/correctness/useExhaustiveDependencies: dependencyList is externally provided
    // oxlint-disable-next-line react/exhaustive-deps -- dependencyList is externally provided
  }, dependencyList)
}
