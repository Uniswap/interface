// @vitest-environment jsdom
/**
 * DropdownMenuSheetItem frame binding of the shared parity suite
 * (INFRA-3021): renders the REAL legacy `DropdownMenuSheetItem` (whose root
 * is a TouchableArea) under jsdom + react-native-web and diffs its extracted
 * CSSOM against the compat item-frame compiler, per variant/state/theme —
 * hover states included.
 */
import { createElement } from 'react'
import { DropdownMenuSheetItem } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { dropdownMenuSheetItemFrameClassName } from '../../../../mycelium/src/menu-compat/compile'
import { describeParity } from '../core/run-parity'
import { MENU_PARITY_EXCLUSIONS } from './exclusions'
import { expectedItemFrameDiffs } from './expectations'
import { buildItemFrameMatrix, type ItemFrameMatrixProps } from './matrix'

describeParity<ItemFrameMatrixProps>({
  label: 'DropdownMenuSheetItem frame — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildItemFrameMatrix(),
  matrixMinSize: 12,
  className: dropdownMenuSheetItemFrameClassName,
  renderTwin: (props) => createElement('div', { className: dropdownMenuSheetItemFrameClassName(props) }),
  tamaguiElement: (props) =>
    createElement(DropdownMenuSheetItem, {
      label: 'Item',
      onPress: (): void => undefined,
      ...props,
    }),
  expectedScopedDiffs: expectedItemFrameDiffs,
  exclusions: MENU_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
