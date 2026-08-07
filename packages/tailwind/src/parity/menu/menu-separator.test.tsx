// @vitest-environment jsdom
/**
 * Menu separator binding of the shared parity suite (INFRA-3021): proves the
 * compat divider (`menuSeparatorClassName`) against the legacy
 * `<Separator my="$spacing6" />` the MenuContent renders before flagged
 * items, per theme — the geometry deltas (legacy 0-height flex line vs the
 * compat's full-width auto-height div) are pinned in the expectations and
 * documented in the 'Menu separator geometry' ledger entry.
 */
import { createElement } from 'react'
import { Separator } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { menuSeparatorClassName } from '../../../../mycelium/src/menu-compat/compile'
import { describeParity } from '../core/run-parity'
import { MENU_PARITY_EXCLUSIONS } from './exclusions'
import { expectedSeparatorDiffs } from './expectations'
import { buildSeparatorMatrix, type SeparatorMatrixProps } from './matrix'

describeParity<SeparatorMatrixProps>({
  label: 'Menu separator — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildSeparatorMatrix(),
  matrixMinSize: 2,
  className: () => menuSeparatorClassName(),
  renderTwin: () => createElement('div', { className: menuSeparatorClassName() }),
  tamaguiElement: () => createElement(Separator, { my: '$spacing6' }),
  expectedScopedDiffs: expectedSeparatorDiffs,
  exclusions: MENU_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
