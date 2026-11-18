/**
 * Web-leg imperative behaviors for the Input compat, transcribed from RNW's
 * TextInput (via the ui/src INFRA-3318 rebuild): the controlled `selection`
 * prop applied via setSelectionRange, `onLayout` delivered from a
 * ResizeObserver measuring the border-box like UIManager.measure, the
 * keydown/select handler transcriptions, and the :focus-visible probe.
 */
import { type KeyboardEvent as ReactKeyboardEvent, type RefObject, type SyntheticEvent, useEffect } from 'react'

// Older selector engines (headless test DOMs) throw on :focus-visible.
export function matchesFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}

/**
 * RNW TextInput's keydown, transcribed: the IME isComposing/keyCode-229 guard, preventDefault
 * before onSubmitEditing (Enter must not submit a wrapping <form> or insert a newline), and
 * blurOnSubmit ?? !multiline blurring. Deliberate RNW divergence between the two conditions: with
 * blurOnSubmit === false on a single-line input, Enter still SUBMITS but does not blur.
 *
 * RNW also stopped propagation of every keydown (RNW #612) so a wrapping pressable would not
 * react to keys typed in the field. That is dropped: pressables only act on keys from their own
 * element, and the keydown has to reach the document for Escape to close the overlay the input
 * sits in and for page shortcuts to yield to it.
 */
export function createInputKeyDownHandler({
  onKeyPress,
  onSubmitEditing,
  blurOnSubmit,
  multiline,
}: {
  onKeyPress?: (e: unknown) => void
  onSubmitEditing?: (e: unknown) => void
  blurOnSubmit?: boolean
  multiline?: boolean
}): (e: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
  return (e) => {
    const hostNode = e.currentTarget
    const nativeEvent = e.nativeEvent as KeyboardEvent & { text?: string }
    const isComposing = nativeEvent.isComposing || nativeEvent.keyCode === 229
    // DOM KeyboardEvent already exposes nativeEvent.key, so RN-shaped handlers read it directly.
    onKeyPress?.(e)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.isDefaultPrevented()) {
      const shouldBlurOnSubmit = blurOnSubmit ?? multiline !== true
      const shouldSubmitOnEnter = blurOnSubmit === true || multiline !== true
      if (shouldSubmitOnEnter && onSubmitEditing !== undefined) {
        e.preventDefault()
        nativeEvent.text = hostNode.value
        onSubmitEditing(e)
      }
      if (shouldBlurOnSubmit) {
        setTimeout(() => hostNode.blur(), 0)
      }
    }
  }
}

/** RNW delivered onSelectionChange from the DOM select event, with selection + text populated. */
export function createInputSelectHandler(
  onSelectionChange: ((e: unknown) => void) | undefined,
): (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
  return (e) => {
    try {
      const node = e.currentTarget
      const native = e.nativeEvent as Event & {
        selection?: { start: number | null; end: number | null }
        text?: string
      }
      native.selection = { start: node.selectionStart, end: node.selectionEnd }
      native.text = node.value
      onSelectionChange?.(e)
    } catch {
      // selectionStart throws on selection-less input types — RNW swallowed this too.
    }
  }
}

export function useAppliedSelection({
  elementRef,
  start,
  end,
  value,
}: {
  elementRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  start?: number
  end?: number
  value?: string
}): void {
  useEffect(() => {
    const node = elementRef.current
    if (node !== null && start !== undefined) {
      try {
        node.setSelectionRange(start, end ?? start)
      } catch {
        // Some input types (email, number) refuse selection APIs — RNW swallowed this too.
      }
    }
  }, [elementRef, start, end, value])
}

export function useOnLayout({
  elementRef,
  onLayout,
}: {
  elementRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  onLayout?: (e: unknown) => void
}): void {
  useEffect(() => {
    const node = elementRef.current
    if (onLayout === undefined || node === null || typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const observer = new ResizeObserver(() => {
      const { left, top, width, height } = node.getBoundingClientRect()
      onLayout({ nativeEvent: { layout: { x: left, y: top, width, height, left, top } }, timeStamp: Date.now() })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [elementRef, onLayout])
}
