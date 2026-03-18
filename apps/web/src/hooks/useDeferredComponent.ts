import { useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'

export function useDeferredComponent<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
  const [Component, setComponent] = useState<T | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only runs once on mount to set up deferred loading
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        async () => {
          try {
            const mod = await importFn()
            setComponent(() => mod.default)
          } catch (error) {
            logger.error(error, {
              tags: {
                file: 'useDeferredComponent.tsx',
                function: 'requestIdleCallback',
              },
            })
          }
        },
        { timeout: 100 },
      )
    } else {
      setTimeout(async () => {
        try {
          const mod = await importFn()
          setComponent(() => mod.default)
        } catch (error) {
          logger.error(error, {
            tags: {
              file: 'useDeferredComponent.tsx',
              function: 'setTimeout',
            },
          })
        }
      }, 1)
    }
  }, [])

  return Component
}
