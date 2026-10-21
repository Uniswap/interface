import { useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'

/**
 * Idle-prefetches a component's chunk. `enabled: false` keeps the chunk off the wire entirely —
 * use it to keep flag-gated features out of every page load.
 */
export function useDeferredComponent<T extends React.ComponentType<any>>({
  importFn,
  // Gates FETCHING, not rendering: this is a load-once latch, so flipping back to false keeps the
  // already-imported component returned. A caller wanting a live show/hide gate needs its own
  // render condition on top.
  enabled = true,
}: {
  importFn: () => Promise<{ default: T }>
  enabled?: boolean
}) {
  const [Component, setComponent] = useState<T | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

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
    // `enabled` (not []) so a late-resolving gate still kicks off the import. `importFn` is
    // deliberately out: call sites pass inline arrows, so it changes identity every render.
    /* oxlint-disable-next-line react-hooks/exhaustive-deps -- see above */
  }, [enabled])

  return Component
}
