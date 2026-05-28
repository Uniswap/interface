import { ExpandedState } from '@tanstack/react-table'
import { useCallback, useState } from 'react'

export function useTableExpandedState(singleExpandedRow: boolean) {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const onExpandedChange = useCallback(
    (updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      setExpanded((old) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(old) : updaterOrValue
        if (!singleExpandedRow || typeof next !== 'object') {
          return next
        }
        const prevExpanded = Object.keys(old).filter((k) => (old as Record<string, boolean>)[k])
        const nextExpanded = Object.keys(next).filter((k) => (next as Record<string, boolean>)[k])
        if (nextExpanded.length <= 1) {
          return next
        }
        const newlyExpanded = nextExpanded.find((k) => !prevExpanded.includes(k))
        return newlyExpanded ? ({ [newlyExpanded]: true } as ExpandedState) : next
      })
    },
    [singleExpandedRow],
  )

  return { expanded, onExpandedChange }
}
