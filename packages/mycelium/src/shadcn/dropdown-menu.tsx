/**
 * DropdownMenu — shadcn-style recipe on Base UI (`@base-ui/react/menu`),
 * styled with mycelium Tailwind tokens (INFRA-3021 shadcn set). Anatomy
 * mirrors the workbench app-chrome shadcn-on-Base-UI port, with the chrome's
 * `cn-*` theme classes replaced by mycelium token utilities.
 *
 * Anatomy: DropdownMenu / DropdownMenuTrigger / DropdownMenuContent /
 * DropdownMenuGroup / DropdownMenuLabel / DropdownMenuItem /
 * DropdownMenuCheckboxItem / DropdownMenuRadioGroup / DropdownMenuRadioItem /
 * DropdownMenuSeparator / DropdownMenuShortcut / DropdownMenuSub /
 * DropdownMenuSubTrigger / DropdownMenuSubContent / DropdownMenuPortal.
 *
 * The legacy Radix scaffolding in `src/components/dropdown-menu.tsx` stays
 * untouched for its existing consumers (dev-portal, labs/rh-cca); this is
 * the forward-facing layer — the FilterSelect compat adapters ride it.
 *
 * Class strings are FULL literals collected in
 * `DROPDOWN_MENU_RECIPE_CLASS_NAMES` (static extraction + the recipes
 * classes-existence suite).
 */
'use client'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '../cn'

export const DROPDOWN_MENU_RECIPE_CLASS_NAMES = {
  positioner: 'isolate z-50 outline-none',
  content:
    'z-50 max-h-(--available-height) min-w-[128px] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[16px] border border-surface3 bg-surface1 p-[8px] text-neutral1 shadow-md outline-none transition-[transform,opacity] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0',
  label: 'px-[8px] py-[6px] text-[12px] leading-[16px] font-medium text-neutral2 data-inset:pl-[32px]',
  item: 'relative flex cursor-pointer items-center gap-[8px] rounded-[8px] px-[8px] py-[8px] text-[16px] leading-[24px] text-neutral1 outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-60 data-highlighted:bg-surface2 data-inset:pl-[32px] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  itemDestructive: 'text-critical data-highlighted:bg-critical-secondary data-highlighted:text-critical',
  checkableItem: 'pl-[32px]',
  indicator: 'pointer-events-none absolute left-[8px] flex size-[16px] items-center justify-center',
  subTrigger:
    'flex cursor-pointer items-center gap-[8px] rounded-[8px] px-[8px] py-[8px] text-[16px] leading-[24px] text-neutral1 outline-hidden select-none data-highlighted:bg-surface2 data-inset:pl-[32px] data-popup-open:bg-surface2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  separator: 'my-[6px] -mx-[8px] h-px bg-surface3',
  shortcut: 'ml-auto text-[12px] leading-[16px] tracking-widest text-neutral3',
} as const

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props): React.JSX.Element {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props): React.JSX.Element {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props): React.JSX.Element {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  collisionAvoidance,
  positionerProps,
  className,
  unstyled = false,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionAvoidance'> & {
    /** Base UI extension point: extra Positioner props (e.g. anchor, data-*, style). */
    positionerProps?: MenuPrimitive.Positioner.Props & { [key: `data-${string}`]: string | undefined }
    /**
     * Headless popup: skip the recipe chrome and apply `className` verbatim
     * (no tailwind-merge). The compat layers own their popup classes
     * byte-for-byte (legacy prop→class compilation).
     */
    unstyled?: boolean
  }): React.JSX.Element {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        className={DROPDOWN_MENU_RECIPE_CLASS_NAMES.positioner}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
        {...positionerProps}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={unstyled ? className : cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.content, className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props): React.JSX.Element {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<'div'> & { inset?: boolean }): React.JSX.Element {
  // A plain presentational label (Base UI's GroupLabel demands a Group
  // ancestor; shadcn's label is standalone) — use DropdownMenuGroupLabel
  // inside DropdownMenuGroup for the aria-labelled grouping form.
  return (
    // oxlint-disable-next-line react/forbid-elements -- the recipe IS the raw DOM boundary
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset ? '' : undefined}
      role="presentation"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.label, className)}
      {...props}
    />
  )
}

function DropdownMenuGroupLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props): React.JSX.Element {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-group-label"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.label, className)}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  unstyled = false,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: 'default' | 'destructive'
  /** Headless item: skip the recipe chrome and apply `className` verbatim (compat layers). */
  unstyled?: boolean
}): React.JSX.Element {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset ? '' : undefined}
      data-variant={variant}
      className={
        unstyled
          ? className
          : cn(
              DROPDOWN_MENU_RECIPE_CLASS_NAMES.item,
              variant === 'destructive' && DROPDOWN_MENU_RECIPE_CLASS_NAMES.itemDestructive,
              className,
            )
      }
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props): React.JSX.Element {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.item, DROPDOWN_MENU_RECIPE_CLASS_NAMES.checkableItem, className)}
      checked={checked}
      {...props}
    >
      <span data-slot="dropdown-menu-checkbox-item-indicator" className={DROPDOWN_MENU_RECIPE_CLASS_NAMES.indicator}>
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-[16px]" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props): React.JSX.Element {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props): React.JSX.Element {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.item, DROPDOWN_MENU_RECIPE_CLASS_NAMES.checkableItem, className)}
      {...props}
    >
      <span data-slot="dropdown-menu-radio-item-indicator" className={DROPDOWN_MENU_RECIPE_CLASS_NAMES.indicator}>
        <MenuPrimitive.RadioItemIndicator>
          <CircleIcon className="size-[8px] fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props): React.JSX.Element {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & { inset?: boolean }): React.JSX.Element {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset ? '' : undefined}
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.subTrigger, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-[16px] text-neutral2" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>): React.JSX.Element {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props): React.JSX.Element {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.separator, className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(DROPDOWN_MENU_RECIPE_CLASS_NAMES.shortcut, className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
