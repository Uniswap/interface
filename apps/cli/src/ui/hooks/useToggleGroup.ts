import { useCallback, useState } from 'react'

interface UseToggleGroupOptions<T> {
  items: Array<{ key: T; label: string }>
  initialSelected?: Set<T>
  minSelection?: number // Minimum number of items that must be selected
}

interface UseToggleGroupReturn<T> {
  selected: Set<T>
  toggle: (key: T) => void
  isSelected: (key: T) => boolean
  selectAll: () => void
  deselectAll: () => void
}

/**
 * Hook for managing a group of toggles/checkboxes
 * Useful for multiple selection scenarios like output options
 */
export function useToggleGroup<T extends string | number>({
  items,
  initialSelected = new Set(),
  minSelection = 0,
}: UseToggleGroupOptions<T>): UseToggleGroupReturn<T> {
  const [selected, setSelected] = useState<Set<T>>(initialSelected)

  const toggle = useCallback(
    (key: T) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          // Don't allow unchecking if it would violate minSelection
          if (next.size > minSelection) {
            next.delete(key)
          }
        } else {
          next.add(key)
        }
        return next
      })
    },
    [minSelection],
  )

  const isSelected = useCallback(
    (key: T) => {
      return selected.has(key)
    },
    [selected],
  )

  const selectAll = useCallback(() => {
    setSelected(new Set(items.map((item) => item.key)))
  }, [items])

  const deselectAll = useCallback(() => {
    if (items.length >= minSelection) {
      setSelected(new Set(items.slice(0, minSelection).map((item) => item.key)))
    }
  }, [items, minSelection])

  return {
    selected,
    toggle,
    isSelected,
    selectAll,
    deselectAll,
  }
}
