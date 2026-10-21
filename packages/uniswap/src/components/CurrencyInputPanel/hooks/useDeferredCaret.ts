import { useRef, useState } from 'react'

type Selection = { start: number; end: number }
type PendingCaret = Selection & { forValue?: string; setAtValue?: string }

export type SetCaret = (caret: { start: number; end?: number; value?: string }) => void

/**
 * Controlled caret for a text input whose `value` may arrive a commit after the caret was moved.
 *
 * The panel's `value` arrives one commit after the caller moved the caret -- the screen store
 * is synced from an effect -- so a caret handed to the native input right away lands on the
 * text it is replacing, and iOS then drags it by recomputing from that old text
 * (`newLength - distanceFromEnd`). Hold it until the render that carries the value it belongs
 * to, so react-native pushes the text and the caret as one `setTextAndSelection`.
 */
export function useDeferredCaret(value: string | undefined): {
  selection: Selection | undefined
  /** Echoes a caret the user moved natively; bypasses the deferral, so only for `onSelectionChange`. */
  followNativeSelection: (selection: Selection) => void
  setCaret: SetCaret
} {
  const pendingCaretRef = useRef<PendingCaret | undefined>(undefined)
  const [selection, setSelection] = useState<Selection | undefined>(undefined)

  const setCaret: SetCaret = ({ start, end, value: forValue }) => {
    const caret = { start, end: end ?? start }

    // Callers that move the caret within the value already on screen (presets, fiat toggle,
    // focus sync) can have it right away; the rest name the value still on its way.
    if (forValue === undefined || forValue === value) {
      // A caret stashed for a value that never arrived (e.g. a rejected keypress) is superseded
      // here; left in place it would be flushed onto whatever value comes next.
      pendingCaretRef.current = undefined
      setSelection(caret)
      return
    }

    pendingCaretRef.current = { ...caret, forValue, setAtValue: value }
  }

  const pendingCaret = pendingCaretRef.current

  if (
    pendingCaret &&
    // no value was named, the value it named has arrived, or the value moved on without it
    (pendingCaret.forValue === undefined || pendingCaret.forValue === value || pendingCaret.setAtValue !== value)
  ) {
    pendingCaretRef.current = undefined
    setSelection({ start: pendingCaret.start, end: pendingCaret.end })
  }

  return { selection, followNativeSelection: setSelection, setCaret }
}
