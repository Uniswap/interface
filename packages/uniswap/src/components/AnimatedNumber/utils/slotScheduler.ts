import type { Dispatch, SetStateAction } from 'react'

export type SlotState = {
  current: string
  prev: string | null
  gen: number
}

export function schedulePrevClear(
  setSlot: Dispatch<SetStateAction<SlotState>>,
  delayMs: number,
): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    setSlot((s) => ({ ...s, prev: null }))
  }, delayMs)
}

export function scheduleSlotTransition({
  delayMs,
  clearDelayMs,
  setSlot,
  computeNext,
}: {
  delayMs: number
  clearDelayMs: number
  setSlot: Dispatch<SetStateAction<SlotState>>
  computeNext: (slot: SlotState) => SlotState
}): () => void {
  let prevClearId: ReturnType<typeof setTimeout> | undefined
  const startId = setTimeout(() => {
    setSlot(computeNext)
    prevClearId = schedulePrevClear(setSlot, clearDelayMs)
  }, delayMs)
  return () => {
    clearTimeout(startId)
    clearTimeout(prevClearId)
  }
}
