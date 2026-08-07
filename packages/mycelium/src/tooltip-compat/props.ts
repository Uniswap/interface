/**
 * The tooltip-compat prop contracts (INFRA-3021): the legacy `ui/src` Tooltip
 * surface — Tamagui `TooltipProps` on the root (the popper vocabulary +
 * delay/restMs), the full leaked Tamagui stack surface on the trigger, and
 * the full `Tooltip.Content` surface (Popover.Content minus zIndex, plus
 * `animationDirection` and the zIndex escape hatch) — reproduced without the
 * Tamagui runtime. The style legs reuse the Flex compat contract; the parity
 * suite in `packages/tailwind/src/parity/tooltip` asserts key coverage
 * against the real legacy component up to a documented exclusion list.
 *
 * NOTE: this compat targets the LEGACY shared Tooltip
 * (`packages/ui/src/components/tooltip`). The existing Radix-based
 * `components/tooltip.tsx` (consumed by mission-control through the mycelium
 * barrel) is untouched and coexists — same arrangement as the Radix
 * popover/dropdown-menu scaffolding next to popover-compat/menu-compat.
 */
import type * as React from 'react'
import type { FlexCompatProps } from '../flex-compat/props'
import type { PopoverCompatOffset, PopoverCompatPlacement } from '../popover-compat/position'
import type {
  PopoverContentFocusScopeCompatProps,
  PopoverContentInertProps,
  PopoverContentStyledVariantProps,
} from '../popover-compat/props'

export type { PopoverCompatOffset, PopoverCompatPlacement }

export type TooltipCompatDelay = number | { open?: number; close?: number }

export type TooltipAnimationDirection = 'left' | 'right' | 'top' | 'bottom'

/**
 * Tamagui popper plumbing accepted on the root for drop-in compatibility but
 * inert on the Base UI engine (each documented in the tooltip parity
 * exclusions ledger).
 */
export interface TooltipRootInertProps {
  /** Inert: Base UI keeps the popup in frame via its default collision handling. */
  stayInFrame?: boolean | Record<string, unknown>
  /** Inert: Tamagui popper size-middleware; no legacy tooltip consumer drives it. */
  resize?: boolean | Record<string, unknown>
  /** Inert: Tamagui size token plumbing; the compat content frame carries the styled defaults. */
  size?: string | number
  /** Inert: the compat renders the styled (non-headless) variant, like the app-wide default. */
  unstyled?: boolean
  /** Inert: Base UI opens on trigger focus by default (legacy default behavior). */
  focus?: { enabled?: boolean; visibleOnly?: boolean }
  /** Inert: Tamagui delay-group plumbing; Base UI grouping arrives with TooltipProvider adoption. */
  groupId?: string
  /** Inert: Base UI closes on outside interaction; scroll-close tuning stays with the host. */
  disableAutoCloseOnScroll?: boolean
  /** Inert: RTL is handled by the document direction on the Base UI engine. */
  disableRTL?: boolean
  /** Inert: Tamagui render-pass-through plumbing. */
  passThrough?: boolean
}

/** The tooltip root surface: the legacy Tamagui `TooltipProps` vocabulary. */
export interface TooltipCompatProps extends TooltipRootInertProps {
  children?: React.ReactNode
  /** Fully controlled when set — exactly like the legacy `TooltipBase`. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: PopoverCompatPlacement
  /** floating-ui offset; the legacy ui/src default is `{ mainAxis: 16 }`. */
  offset?: PopoverCompatOffset
  /** When false, collision avoidance is disabled (legacy `allowFlip` default: on). */
  allowFlip?: boolean | Record<string, unknown>
  /** floating-ui strategy → Base UI positionMethod. */
  strategy?: 'absolute' | 'fixed'
  /** Hover open/close delays; the legacy ui/src default is `{ close: 500, open: 0 }`. */
  delay?: TooltipCompatDelay
  /** Pointer rest time before opening; the legacy ui/src default is 200. */
  restMs?: number
}

/**
 * The trigger surface: the legacy trigger is a Tamagui stack, so the full
 * stack style surface leaks (call sites pass `flex`, `width`, `position`, …).
 * Style props compile through the Flex compat contract; `asChild` renders the
 * child element as the trigger like the Tamagui `asChild`.
 */
export type TooltipCompatTriggerProps = Omit<FlexCompatProps, 'children' | 'asChild'> & {
  children?: React.ReactNode
  /**
   * Narrowed from the shared compat union: `'except-style'` /
   * `'except-style-web'` are rejected at compile time — the compat `asChild`
   * always clone-merges the compiled style classes onto the child, the
   * OPPOSITE of Tamagui's except-style semantics, and no repo tooltip trigger
   * passes them (grep 2026-07-29). `'web'` is equivalent to `true` here (the
   * compat is web-only).
   */
  asChild?: boolean | 'web'
}

/** The props the legacy `Tooltip.Content` adds on top of the Popover.Content surface. */
export interface TooltipContentOwnProps {
  children?: React.ReactNode
  /** Drives the enter/exit slide direction (legacy default: 'top'). */
  animationDirection?: TooltipAnimationDirection
  /**
   * Escape hatch for the stacking layer. When omitted, the content reads the
   * overlay z-index bridge and renders one layer above its host (floor:
   * tooltip 1080), exactly like the legacy `Tooltip.Content`.
   */
  zIndex?: number | (string & {}) | object | null
}

/**
 * The full content surface: the legacy `TooltipContentProps` — the leaked
 * Tamagui Popover.Content surface (style props via the Flex compat contract +
 * the popover plumbing) plus the tooltip's own props above.
 *
 * The ThemeableStack styled-variant shorthands and the FocusScope/Dismissable
 * hooks leak through the legacy Popover.Content surface too; on the tooltip
 * they are accepted for drop-in typing but INERT — no ui/src Tooltip.Content
 * call site drives them (grep 2026-07-29), and Base UI tooltips never trap
 * focus (matching the legacy default). Ledgered ("Content prop long tail").
 */
export type TooltipContentCompatProps = Omit<FlexCompatProps, 'children' | 'zIndex'> &
  PopoverContentInertProps &
  PopoverContentStyledVariantProps &
  PopoverContentFocusScopeCompatProps &
  TooltipContentOwnProps

/**
 * The arrow surface: the legacy `Tooltip.Arrow` is a styled Tamagui popper
 * arrow, but every call site in the repo renders it bare (`<Tooltip.Arrow />`).
 * The full style surface is accepted for drop-in typing; overrides beyond the
 * styled defaults are accepted-inert (ledgered).
 */
export type TooltipArrowCompatProps = Omit<FlexCompatProps, 'children'>
