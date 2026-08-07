/**
 * Type-level drop-in contract for the Base-UI-backed filter-select compat
 * (INFRA-3021 dropdown set): every prop accepted by the legacy
 * `DropdownSelector` (`apps/web/src/components/Dropdowns/DropdownSelector`)
 * is either covered by the compat contract or listed in the explicit
 * exclusion union below, and the real call-site payload shapes stay
 * assignable. The `dropdownStyle`/`buttonStyle` FlexProps leaks follow the
 * menu-compat containerStyles approach: key coverage lives with the Flex
 * compat contract, value-level fragments pin the live payloads here.
 *
 * Compiled by `tsconfig.type-parity.json` (driven from
 * `type-parity.test.ts`), which maps the apps/web-internal `~` alias so the
 * REAL legacy types participate.
 */
import type { ComponentProps } from 'react'
// Relative cross-package imports on purpose: type-only legacy references
// compiled by the dedicated tsconfig.type-parity.json program (see the menu
// type-parity file for the package-boundary rationale).
// nx-ignore-next-line
import type { DropdownSelector, SelectOption } from '../../../../../apps/web/src/components/Dropdowns/DropdownSelector'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  FilterSelectCompatProps,
  FilterSelectOptionCompat,
} from '../../../../mycelium/src/filter-select-compat/types'

type LegacyDropdownSelectorProps = ComponentProps<typeof DropdownSelector>

// ── Key coverage ─────────────────────────────────────────────────────────

/** Compile-time-only assert: fails with the offending key names when a legacy key goes uncovered. */
type AssertNoUncoveredKeys<T extends never> = T

type UncoveredDropdownSelectorKeys = Exclude<keyof LegacyDropdownSelectorProps, keyof FilterSelectCompatProps>
export type DropdownSelectorPropsFullyCovered = AssertNoUncoveredKeys<UncoveredDropdownSelectorKeys>

// ── Value-level fragments (live call-site payloads) ─────────────────────

// The options map (SelectOption: label + GeneratedIcon | null) must fit the
// compat vocabulary as a whole.
declare const legacyOptions: Record<string, SelectOption>
export const optionsAssignable: Record<string, FilterSelectOptionCompat> = legacyOptions

type AcceptsFragment<T extends Partial<FilterSelectCompatProps>> = T
export type FilterSelectValueLevelChecks = [
  AcceptsFragment<
    Pick<
      LegacyDropdownSelectorProps,
      'selectedValue' | 'onSelect' | 'isOpen' | 'toggleOpen' | 'dataTestId' | 'dropdownTestId' | 'optionTestIdPrefix'
    >
  >,
  AcceptsFragment<
    Pick<
      LegacyDropdownSelectorProps,
      | 'adaptToSheet'
      | 'tooltipText'
      | 'alignRight'
      | 'allowFlip'
      | 'forceFlipUp'
      | 'matchTriggerWidth'
      | 'positionFixed'
    >
  >,
  AcceptsFragment<Pick<LegacyDropdownSelectorProps, 'containerStyle'>>,
  // The DropdownSelector default buttonStyle payload, verbatim.
  AcceptsFragment<{
    buttonStyle: {
      minWidth: 140
      height: 40
      borderRadius: '$rounded12'
      borderWidth: '$spacing1'
      borderColor: '$surface3'
    }
  }>,
  // The DropdownSelector default dropdownStyle payload, verbatim.
  AcceptsFragment<{ dropdownStyle: { minWidth: 200 } }>,
]

// ── Sanity tripwires ─────────────────────────────────────────────────────

type RequiredLegacyKey =
  | 'options'
  | 'selectedValue'
  | 'onSelect'
  | 'ButtonIcon'
  | 'isOpen'
  | 'toggleOpen'
  | 'matchTriggerWidth'
  | 'positionFixed'
declare const requiredLegacyKeysPresent: RequiredLegacyKey extends keyof LegacyDropdownSelectorProps
  ? true
  : { missingFromDropdownSelectorProps: Exclude<RequiredLegacyKey, keyof LegacyDropdownSelectorProps> }
export const dropdownSelectorLegacySanity: true = requiredLegacyKeysPresent
