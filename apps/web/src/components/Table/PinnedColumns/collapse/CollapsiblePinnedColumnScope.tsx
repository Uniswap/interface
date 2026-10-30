import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { createContext, type PropsWithChildren, useCallback, useContext, useRef, useState } from 'react'
import { useCollapsiblePinnedColumn } from '~/components/Table/PinnedColumns/collapse/useCollapsiblePinnedColumn'
import type { PinnedColumnWidths } from '~/components/Table/PinnedColumns/collapse/utils'

/** Registers a table's collapsible column widths with the scope; returns the unregister. */
type RegisterCollapsibleColumn = (widths: PinnedColumnWidths) => () => void

const CollapsiblePinnedColumnScopeContext = createContext<RegisterCollapsibleColumn | undefined>(undefined)

/** The enclosing scope's registration, for a `Table` rendered inside `CollapsiblePinnedColumnScope`. */
export function useCollapsiblePinnedColumnScope(): RegisterCollapsibleColumn | undefined {
  return useContext(CollapsiblePinnedColumnScopeContext)
}

/**
 * One pinned-column collapse shared by several scroll-synced `Table`s (e.g. a table and the
 * hidden-rows table below it). The progress is written here, above all of them, so their columns
 * paint the same width and a gesture on any one of them drives it. Each `Table` still names its
 * column with `collapsiblePinnedColumnId`; inside a scope it registers that column's widths here
 * instead of running its own collapse.
 */
export function CollapsiblePinnedColumnScope({
  children,
  ...flexProps
}: PropsWithChildren<FlexCompatProps>): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const registrationsRef = useRef<PinnedColumnWidths[]>([])
  const [widths, setWidths] = useState<PinnedColumnWidths | undefined>(undefined)

  // Tables mount and unmount independently (the hidden-rows table is lazy), so the collapse follows
  // the latest registration and only switches off once every table has gone.
  const register = useCallback<RegisterCollapsibleColumn>((registered) => {
    registrationsRef.current = [...registrationsRef.current, registered]
    setWidths(registered)
    return () => {
      registrationsRef.current = registrationsRef.current.filter((entry) => entry !== registered)
      setWidths(registrationsRef.current.at(-1))
    }
  }, [])

  useCollapsiblePinnedColumn({ rootRef, widths })

  return (
    <CollapsiblePinnedColumnScopeContext.Provider value={register}>
      <Flex ref={rootRef} {...flexProps}>
        {children}
      </Flex>
    </CollapsiblePinnedColumnScopeContext.Provider>
  )
}
