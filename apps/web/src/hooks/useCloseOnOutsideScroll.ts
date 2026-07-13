import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useEffect } from 'react'

interface UseCloseOnOutsideScrollParams {
  contentRef: RefObject<HTMLElement | null>
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

/**
 * Closes a hover card / popover when the user scrolls the page, while ignoring scrolls that
 * originate inside its own content (e.g. an internal scrollable list). `window` scroll listeners
 * must use `capture: true` to observe scroll events at all (scroll doesn't bubble), which also
 * surfaces descendant scrolls — `contentRef` filters those back out.
 */
export function useCloseOnOutsideScroll({ contentRef, isOpen, setIsOpen }: UseCloseOnOutsideScrollParams): void {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const handleScroll = (event: Event): void => {
      if (event.target instanceof Node && contentRef.current?.contains(event.target)) {
        return
      }
      setIsOpen(false)
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return (): void => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isOpen, setIsOpen, contentRef])
}
