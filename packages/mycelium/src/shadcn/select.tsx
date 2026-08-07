/**
 * Select — shadcn-style recipe on Base UI (`@base-ui/react/select`), styled
 * with mycelium Tailwind tokens (INFRA-3021 shadcn set).
 *
 * Anatomy: Select / SelectTrigger / SelectValue / SelectContent /
 * SelectGroup / SelectLabel / SelectItem / SelectSeparator /
 * SelectScrollUpButton / SelectScrollDownButton.
 *
 * The legacy Radix Select in `src/components/select.tsx` stays untouched —
 * mission-control consumes its exported surface (SelectProps et al.); the
 * migration is a follow-up documented in the INFRA-3021 shadcn PR.
 *
 * Class strings are FULL literals collected in `SELECT_RECIPE_CLASS_NAMES`
 * (static extraction + the recipes classes-existence suite).
 */
'use client'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '../cn'

export const SELECT_RECIPE_CLASS_NAMES = {
  trigger:
    'flex h-[40px] min-w-[140px] cursor-pointer items-center justify-between gap-[8px] rounded-[12px] border border-surface3 bg-surface1 px-[12px] text-[16px] leading-[24px] whitespace-nowrap text-neutral1 outline-none select-none hover:bg-surface2 focus-visible:bg-surface2 data-disabled:cursor-default data-disabled:opacity-60 data-popup-open:bg-surface2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  triggerIcon: 'size-[20px] text-neutral2 transition-transform duration-200 ease-in-out',
  positioner: 'isolate z-50 outline-none',
  content:
    'z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[16px] border border-surface3 bg-surface1 p-[8px] text-neutral1 shadow-md outline-none transition-[transform,opacity] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0',
  label: 'px-[8px] py-[6px] text-[12px] leading-[16px] font-medium text-neutral2',
  item: 'relative flex cursor-pointer items-center gap-[8px] rounded-[8px] py-[8px] pr-[32px] pl-[8px] text-[16px] leading-[24px] text-neutral1 outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-60 data-highlighted:bg-surface2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  itemIndicator: 'pointer-events-none absolute right-[8px] flex size-[16px] items-center justify-center text-accent1',
  separator: 'my-[6px] -mx-[8px] h-px bg-surface3',
  scrollButton: 'flex w-full cursor-default items-center justify-center py-[4px] text-neutral2',
} as const

function Select<Value>({ ...props }: SelectPrimitive.Root.Props<Value>): React.JSX.Element {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props): React.JSX.Element {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(SELECT_RECIPE_CLASS_NAMES.trigger, className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon" className={SELECT_RECIPE_CLASS_NAMES.triggerIcon}>
        <ChevronDownIcon className="size-[20px]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ ...props }: SelectPrimitive.Value.Props): React.JSX.Element {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 8,
  collisionAvoidance,
  positionerProps,
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionAvoidance'> & {
    /** Base UI extension point: extra Positioner props (e.g. alignItemWithTrigger, data-*). */
    positionerProps?: SelectPrimitive.Positioner.Props & { [key: `data-${string}`]: string | undefined }
  }): React.JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        data-slot="select-positioner"
        className={SELECT_RECIPE_CLASS_NAMES.positioner}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
        alignItemWithTrigger={false}
        {...positionerProps}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(SELECT_RECIPE_CLASS_NAMES.content, className)}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
        <SelectScrollDownButton />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectGroup({ ...props }: SelectPrimitive.Group.Props): React.JSX.Element {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props): React.JSX.Element {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(SELECT_RECIPE_CLASS_NAMES.label, className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props): React.JSX.Element {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={cn(SELECT_RECIPE_CLASS_NAMES.item, className)} {...props}>
      <SelectPrimitive.ItemText data-slot="select-item-text">{children}</SelectPrimitive.ItemText>
      <span data-slot="select-item-indicator" className={SELECT_RECIPE_CLASS_NAMES.itemIndicator}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-[16px]" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    // oxlint-disable-next-line react/forbid-elements -- recipe separator is a raw presentational rule
    <div
      data-slot="select-separator"
      role="separator"
      className={cn(SELECT_RECIPE_CLASS_NAMES.separator, className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props): React.JSX.Element {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(SELECT_RECIPE_CLASS_NAMES.scrollButton, className)}
      {...props}
    >
      <ChevronUpIcon className="size-[16px]" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props): React.JSX.Element {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(SELECT_RECIPE_CLASS_NAMES.scrollButton, className)}
      {...props}
    >
      <ChevronDownIcon className="size-[16px]" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
