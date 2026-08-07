import { isProdEnv } from '@universe/environment'
import { type ReactElement, useEffect } from 'react'
import { VirtualList } from './internal/VirtualList'
import type { UniversalListPropsWithRef } from './types'
import { warnOnDuplicateKeys } from './utils'

let isProd: boolean | undefined

/**
 * Cross-platform virtualized list. One API across web, extension, and mobile;
 * the platform-specific virtualization engine lives in
 * internal/VirtualList.{native,web}. This shared entry owns the dev-only
 * stable-key guard; the engine owns slots, styling and scroll behavior.
 */
export function UniversalList<T>(props: UniversalListPropsWithRef<T>): ReactElement {
  useDuplicateKeyGuard(props.data, props.keyExtractor)

  return <VirtualList {...props} />
}

/** Dev-only duplicate-key check, re-run only when the data or keyExtractor identity changes. */
function useDuplicateKeyGuard<T>(data: ReadonlyArray<T>, keyExtractor: (item: T, index: number) => string): void {
  useEffect(() => {
    // Check env once and cache
    isProd ??= isProdEnv()
    if (isProd) {
      return
    }
    warnOnDuplicateKeys(data.map((item, index) => keyExtractor(item, index)))
  }, [data, keyExtractor])
}
