import { useEffect, useRef, useState, type RefObject } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

/**
 * Guards a window-scrolled list against browser scroll clamping when its content shrinks (filter,
 * sort, search): the document gets shorter, the browser clamps the window scroll, and it reads as
 * a jump to the top. While the user is scrolled into the list (root at or behind the sticky app
 * header), the root reserves a viewport of height so the clamp can never pull the list's controls
 * above the app header (sized so the clamp lands them exactly at the header line). The reservation
 * releases only when doing so can't move the page (the blank space sits fully below the viewport,
 * or the scroll is back at the top), so short content never pads the page at rest.
 *
 * Attach `rootRef` to the element receiving `minHeight` and `contentRef` to an inner wrapper whose
 * height is the natural content height, excluding the reserved blank space below it.
 */
export function useScrollClampGuard(enabled: boolean): {
  rootRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  minHeight: string | undefined
} {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerHeight = useAppHeaderHeight()
  const [active, setActive] = useState(false)

  const update = useEvent(() => {
    const top = rootRef.current?.getBoundingClientRect().top
    if (top === undefined) {
      return
    }
    if (window.scrollY > 0 && top <= headerHeight) {
      setActive(true)
      return
    }
    const contentBottom = contentRef.current?.getBoundingClientRect().bottom
    if (window.scrollY <= 0 || (contentBottom !== undefined && contentBottom >= window.innerHeight)) {
      setActive(false)
    }
  })

  useEffect(() => {
    if (!enabled) {
      // Drop any armed reservation: with the listeners detached nothing else would release it.
      setActive(false)
      return undefined
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [enabled, headerHeight, update])

  return { rootRef, contentRef, minHeight: active ? `calc(100dvh - ${headerHeight}px)` : undefined }
}
