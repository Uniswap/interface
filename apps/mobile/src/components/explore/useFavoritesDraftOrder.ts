import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseFavoritesDraftOrderParams<T extends string> {
  items: T[]
  persist: (items: T[]) => void
}

interface UseFavoritesDraftOrderResult<T extends string> {
  isEditing: boolean
  orderedItems: T[]
  setIsEditing: (isEditing: boolean) => void
  toggleEditing: () => void
  queueDraftOrder: (visibleOrder: T[]) => void
  settleDraftOrder: () => void
}

export function useFavoritesDraftOrder<T extends string>({
  items,
  persist,
}: UseFavoritesDraftOrderParams<T>): UseFavoritesDraftOrderResult<T> {
  const [isEditing, setIsEditingState] = useState(false)
  const [draftOrder, setDraftOrder] = useState<T[] | null>(null)

  const isEditingRef = useRef(isEditing)
  isEditingRef.current = isEditing
  const draftOrderRef = useRef(draftOrder)
  draftOrderRef.current = draftOrder
  const itemsRef = useRef(items)
  itemsRef.current = items
  const persistRef = useRef(persist)
  persistRef.current = persist

  // Applying the drag result before the active item settles reshuffles Sortable.Grid's data
  // while Fabric is still measuring it, which can leave the grid unable to reorder again.
  const pendingOrderRef = useRef<T[] | null>(null)

  const buildFullOrder = useCallback((visibleOrder: T[]): T[] => {
    const currentItems = itemsRef.current
    const currentItemSet = new Set(currentItems)
    const seen = new Set<T>()
    const result: T[] = []

    for (const item of visibleOrder) {
      if (currentItemSet.has(item) && !seen.has(item)) {
        seen.add(item)
        result.push(item)
      }
    }
    for (const item of currentItems) {
      if (!seen.has(item)) {
        seen.add(item)
        result.push(item)
      }
    }

    return result
  }, [])

  const orderedItems = useMemo(
    () => (draftOrder ? buildFullOrder(draftOrder) : items),
    [draftOrder, items, buildFullOrder],
  )

  const persistDraftOrder = useCallback(() => {
    const pendingOrder = pendingOrderRef.current
    if (pendingOrder) {
      pendingOrderRef.current = null
      setDraftOrder(pendingOrder)
      draftOrderRef.current = pendingOrder
    }

    const draft = draftOrderRef.current
    if (!draft) {
      return
    }

    persistRef.current(buildFullOrder(draft))
    setDraftOrder(null)
    draftOrderRef.current = null
  }, [buildFullOrder])

  const setIsEditing = useCallback(
    (nextIsEditing: boolean) => {
      if (!nextIsEditing) {
        persistDraftOrder()
      }
      setIsEditingState(nextIsEditing)
    },
    [persistDraftOrder],
  )

  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditingRef.current)
  }, [setIsEditing])

  const queueDraftOrder = useCallback(
    (visibleOrder: T[]) => {
      pendingOrderRef.current = buildFullOrder(visibleOrder)
    },
    [buildFullOrder],
  )

  const settleDraftOrder = useCallback(() => {
    const pendingOrder = pendingOrderRef.current
    if (!pendingOrder) {
      return
    }

    pendingOrderRef.current = null
    setDraftOrder(pendingOrder)
    draftOrderRef.current = pendingOrder
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      setIsEditingState(false)
      setDraftOrder(null)
      draftOrderRef.current = null
      pendingOrderRef.current = null
    }
  }, [items.length])

  return {
    isEditing,
    orderedItems,
    setIsEditing,
    toggleEditing,
    queueDraftOrder,
    settleDraftOrder,
  }
}
