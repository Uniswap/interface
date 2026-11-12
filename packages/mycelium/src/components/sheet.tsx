import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'
import { FlexCompat as Flex } from '../flex-compat/FlexCompat'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn('overlay-backdrop fixed inset-0 z-50 bg-black/50', className)}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

// Floating panel: 12px viewport offset on every side (per-side insets, since a
// single `inset-3` would stretch the panel across the whole viewport) and a
// 28px radius on all four corners. h-full/w-full are deliberately absent —
// opposing insets size the panel, so a full-length dimension would overflow by
// the offset.
const sheetVariants = cva('fixed z-50 gap-4 rounded-28 bg-surface1 p-6 shadow-lg', {
  variants: {
    side: {
      top: 'inset-x-3 top-3 border border-surface3 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      bottom:
        'inset-x-3 bottom-3 border border-surface3 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      left: 'inset-y-3 left-3 h-auto w-80 border border-surface3 data-[state=closed]:animate-sheet-out-left data-[state=open]:animate-sheet-in-left',
      right:
        'inset-y-3 right-3 h-auto w-80 border border-surface3 data-[state=closed]:animate-sheet-out-right data-[state=open]:animate-sheet-in-right',
    },
  },
  defaultVariants: {
    side: 'right',
  },
})

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
  hideClose?: boolean
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, hideClose, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        {/* Rendered after `children`, as dialog.tsx's Close is: FlexCompat's
            `relative` frame default makes SheetHeader/SheetFooter positioned with
            z-index:auto, so a Close rendered BEFORE them would paint underneath
            and lose the pointer hit test -- being later in tree order restores it. */}
        {!hideClose && (
          <SheetPrimitive.Close
            // TODO(INFRA-4589): keeps the close button out of the tab order, so keyboard users can only close with Escape.
            tabIndex={-1}
            className="absolute right-4 top-4 cursor-pointer rounded-8 p-1 text-neutral2 transition-all duration-80 ease-in-out hover:text-neutral1 hover:bg-surface2 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none active:scale-90"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
)
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <Flex justifyContent="flex-start" flexDirection="column" className={cn('gap-1.5', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <Flex
    flexDirection="row"
    justifyContent="flex-start"
    className={cn('flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-heading-3 text-neutral1', className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-body-3 text-neutral2', className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
