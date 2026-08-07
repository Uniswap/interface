/**
 * Popover — shadcn-style recipe on Base UI (`@base-ui/react/popover`),
 * styled with mycelium Tailwind tokens (INFRA-3021 shadcn set).
 *
 * Anatomy: Popover / PopoverTrigger / PopoverAnchor / PopoverContent /
 * PopoverClose. The legacy Radix scaffolding in `src/components/popover.tsx`
 * stays untouched for its existing consumers (dev-portal, labs/rh-cca);
 * this is the forward-facing layer new web surfaces compose.
 *
 * Class strings are FULL literals collected in `POPOVER_RECIPE_CLASS_NAMES`
 * (static extraction + the recipes classes-existence suite).
 */
'use client'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import type * as React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cn } from '../cn'

export const POPOVER_RECIPE_CLASS_NAMES = {
  positioner: 'isolate z-50 outline-none',
  content:
    'z-50 max-h-(--available-height) w-72 origin-(--transform-origin) overflow-y-auto rounded-[16px] border border-surface3 bg-surface1 p-[16px] text-neutral1 shadow-md outline-none transition-[transform,opacity] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
} as const

/**
 * Base UI has no `Popover.Anchor` part — anchoring is the Positioner's
 * `anchor` prop — so the recipe carries the shadcn anchor semantics itself:
 * `PopoverAnchor` registers its element here and `PopoverContent` feeds it
 * to the Positioner (an explicit `positionerProps.anchor` still wins).
 */
interface PopoverAnchorContextValue {
  anchor: Element | null
  setAnchor: (element: Element | null) => void
}
const PopoverAnchorContext = createContext<PopoverAnchorContextValue | null>(null)

function Popover({ ...props }: PopoverPrimitive.Root.Props): React.JSX.Element {
  const [anchor, setAnchor] = useState<Element | null>(null)
  const anchorContext = useMemo(() => ({ anchor, setAnchor }), [anchor])
  return (
    <PopoverAnchorContext.Provider value={anchorContext}>
      <PopoverPrimitive.Root data-slot="popover" {...props} />
    </PopoverAnchorContext.Provider>
  )
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props): React.JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverAnchor({ ref, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  const anchorContext = useContext(PopoverAnchorContext)
  const setAnchor = anchorContext?.setAnchor
  const registerAnchor = useCallback(
    (element: HTMLDivElement | null) => {
      setAnchor?.(element)
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    },
    [ref, setAnchor],
  )
  // oxlint-disable-next-line react/forbid-elements -- the recipe anchor IS the raw DOM boundary
  return <div data-slot="popover-anchor" ref={registerAnchor} {...props} />
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props): React.JSX.Element {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverContent({
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 8,
  collisionAvoidance,
  positionerProps,
  className,
  unstyled = false,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionAvoidance'> & {
    /** Base UI extension point: extra Positioner props (e.g. anchor, positionMethod, data-*). */
    positionerProps?: PopoverPrimitive.Positioner.Props & { [key: `data-${string}`]: string | undefined }
    /**
     * Headless popup: skip the recipe chrome and apply `className` verbatim
     * (no tailwind-merge). The compat layers own their popup classes
     * byte-for-byte (legacy prop→class compilation).
     */
    unstyled?: boolean
  }): React.JSX.Element {
  const contextAnchor = useContext(PopoverAnchorContext)?.anchor
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        className={POPOVER_RECIPE_CLASS_NAMES.positioner}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
        anchor={contextAnchor ?? undefined}
        {...positionerProps}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={unstyled ? className : cn(POPOVER_RECIPE_CLASS_NAMES.content, className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger }
