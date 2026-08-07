// @vitest-environment jsdom
/**
 * Item-label (MenuOptionItem vocabulary) binding of the shared parity suite
 * (INFRA-3021): the color/typography states a menu option can render —
 * default / destructive / disabled / token overrides across both variants,
 * with the disabled/hover color shift under the group-hover scope — diffed
 * between the legacy Tamagui `Text` (exactly as `DropdownMenuSheetItem`
 * composes it, colors via `getMenuItemColor`) and the compat label compiler.
 */
import { createElement } from 'react'
import { getMenuItemColor, Text } from 'ui/src'
import type { TextProps } from 'ui/src/components/text'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { dropdownMenuSheetItemLabelClassName } from '../../../../mycelium/src/menu-compat/compile'
import { describeParity } from '../core/run-parity'
import { MENU_PARITY_EXCLUSIONS } from './exclusions'
import { expectedItemLabelDiffs } from './expectations'
import { buildItemLabelMatrix, type ItemLabelMatrixProps } from './matrix'

/** The exact label Text props DropdownMenuSheetItem renders for a given state. */
function legacyLabelProps(props: ItemLabelMatrixProps): TextProps {
  const { variant, destructive, disabled, textColor, allowMultiline = false } = props
  return {
    flexShrink: 1,
    ...(allowMultiline ? {} : { numberOfLines: 1, ellipsizeMode: 'tail' as const }),
    variant: variant === 'small' ? 'buttonLabel3' : 'buttonLabel2',
    color: getMenuItemColor({ overrideColor: textColor as TextProps['color'], destructive, disabled }),
    '$group-hover': destructive ? undefined : { color: disabled ? '$neutral2' : '$neutral1Hovered' },
  }
}

describeParity<ItemLabelMatrixProps>({
  label: 'MenuOptionItem label vocabulary — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildItemLabelMatrix(),
  matrixMinSize: 18,
  className: dropdownMenuSheetItemLabelClassName,
  renderTwin: (props) => createElement('span', { className: dropdownMenuSheetItemLabelClassName(props) }),
  tamaguiElement: (props) => createElement(Text, legacyLabelProps(props), 'Item'),
  expectedScopedDiffs: expectedItemLabelDiffs,
  exclusions: MENU_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
