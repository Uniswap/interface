/**
 * The trigger-button chrome constants (INFRA-3021 dropdown set): FULL
 * LITERAL class strings mirroring the legacy dropdown trigger chrome —
 * `apps/web/src/components/Dropdowns/TriggerButton.tsx` (styled(Text):
 * rounded12, surface3 border, spacing2 padding, medium/24 type, pointer) and
 * the `NETWORK_FILTER_BUTTON_STYLES` size presets
 * (`apps/web/src/components/NetworkFilter/NetworkFilter.tsx`). Literal
 * strings only (never template-assembled) so Tailwind's static scanner can
 * extract them; the dropdown-set classes suite proves the CSS exists. The
 * legacy twins live inside the web-app import graph and cannot be rendered
 * by the parity harness — see the filter-select exclusions ledger.
 */

export type TriggerButtonCompatSize = 'large' | 'medium' | 'small' | 'xsmall'

/** TriggerButton base chrome, mirrored from the styled(Text) definition. */
export const TRIGGER_BUTTON_BASE_CLASS_NAME =
  'm-0 flex shrink-0 cursor-pointer flex-row items-center rounded-[12px] border-solid border-surface3 p-[2px] pl-[14px] pr-[6px] text-[16px] leading-[24px] font-normal whitespace-nowrap text-neutral1 select-none gap-[8px]'

/** The outlined / plain / active variants, mirrored from the styled() variants. */
export const TRIGGER_BUTTON_VARIANT_CLASS_NAMES = {
  outlined: 'border bg-surface1 hover:bg-surface2 focus-visible:bg-surface2',
  plain: 'border-0 bg-transparent',
  active: 'bg-surface2',
  disabled: 'cursor-default opacity-60',
} as const

/**
 * NETWORK_FILTER_BUTTON_STYLES, mirrored per size (heights 48/40/32/28;
 * small/xsmall tighten radius and gap exactly like the legacy record).
 */
export const TRIGGER_BUTTON_SIZE_CLASS_NAMES: Record<TriggerButtonCompatSize, string> = {
  large: 'h-[48px] pl-[16px] pr-[12px]',
  medium: 'h-[40px] pl-[12px] pr-[6px]',
  small: 'h-[32px] rounded-[12px] pl-[12px] pr-[6px] gap-[6px]',
  xsmall: 'h-[28px] rounded-[12px] pl-[6px] pr-[6px] gap-[4px]',
}

/** The rotating chevron (legacy RotatableChevron animation="200ms"): transform-only transition. */
export const TRIGGER_BUTTON_CHEVRON_CLASS_NAME =
  'flex shrink-0 text-neutral2 transition-transform duration-200 ease-in-out'

/** The expanded rotation (chevron points up while open). */
export const TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME = 'rotate-180'
