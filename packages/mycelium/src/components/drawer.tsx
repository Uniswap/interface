import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '../cn'
import { Flex } from './flex'

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>): React.JSX.Element => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = 'Drawer'

/**
 * Root for a drawer stacked inside an open drawer. An independent Root layered
 * over another drawer renders fine but vaul never engages its swipe-dismiss
 * drag — nested drawers must ride vaul's NestedRoot, which also choreographs
 * the parent drawer while the child drags.
 */
const DrawerNested = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.NestedRoot>): React.JSX.Element => (
  <DrawerPrimitive.NestedRoot shouldScaleBackground={shouldScaleBackground} {...props} />
)
DrawerNested.displayName = 'DrawerNested'

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-[4px]', className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

/**
 * vaul (1.1.2) releases an in-flight swipe drag on any pointerout that bubbles
 * to its content — including boundary moves between the sheet's own children,
 * which fire while the sheet translates under a captured pointer (mouse drags,
 * emulated touch). Contain those; a genuine exit (relatedTarget outside the
 * sheet) still reaches vaul's release fallback.
 */
const containBoundaryPointerOut = (event: React.PointerEvent<HTMLDivElement>): void => {
  const related = event.relatedTarget
  if (
    related instanceof Element &&
    (event.currentTarget.contains(related) || related.closest('[data-vaul-overlay], [data-vaul-drawer]') !== null)
  ) {
    event.stopPropagation()
  }
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col outline-none"
      {...props}
    >
      <Flex
        direction="column"
        onPointerOut={containBoundaryPointerOut}
        className={cn('rounded-t-20 bg-surface1 border border-surface3 overflow-y-auto', className)}
      >
        {/* oxlint-disable-next-line react/forbid-elements -- drawer handle indicator */}
        <div
          className="mx-auto mt-3 h-1.5 w-8 shrink-0 rounded-full bg-surface3"
          aria-hidden="true"
          role="presentation"
        />
        {children}
      </Flex>
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <Flex direction="column" className={cn('gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <Flex direction="column" gap={2} className={cn('mt-auto p-4', className)} {...props} />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerNested,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
