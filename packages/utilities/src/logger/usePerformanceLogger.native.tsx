import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { DependencyList, useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { DDRumAction } from 'utilities/src/logger/datadog/datadogEvents'
import { logger } from 'utilities/src/logger/logger'

/**
 * Hook for measuring performance between renders on target dependencies.
 *
 * @param eventName - The name of the event to log.
 * @param dependencyList - The DependencyList that will start tracking the performance.
 *
 * Example:
 *
 * usePerformanceLogger('render_activity_tab_list', [userStateThatTriggersRender])
 *
 **/
export function usePerformanceLogger(eventName: string, dependencyList: DependencyList): void {
  const isCurrentlyMeasuring = useRef<boolean>(false)

  useEffect(() => {
    try {
      if (isCurrentlyMeasuring.current) {
        return
      }

      isCurrentlyMeasuring.current = true
      const start = performance.now()

      // It's been difficult to get named fields while also making this hook
      // take in a DependencyList. For now we just record the values as
      // an unnamed list in favor of keeping the DependencyList as is.
      const triggers = dependencyList.map((dep) => (typeof dep === 'string' ? dep.slice(0, 100) : dep))

      // wait for the next frame to ensure the state change that triggers a re-render has fired
      requestAnimationFrame(async () => {
        await InteractionManager.runAfterInteractions(async (): Promise<void> => {
          const end = performance.now()
          const duration = end - start
          const eventObject = {
            duration,
            eventName,
            triggers,
          }

          await DdRum.addAction(RumActionType.CUSTOM, DDRumAction.ManualTiming, eventObject)
          isCurrentlyMeasuring.current = false
        })
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'usePerformanceLogger.native.tsx', function: 'logPerformance' },
      })
      isCurrentlyMeasuring.current = false
    }
    // eventName is required and should never change so it's safe to ignore it
    // dependencyList is a DependencyList which is the object a useEffect hook takes
    // biome-ignore lint/correctness/useExhaustiveDependencies: dependencyList is externally provided
  }, dependencyList)
}
