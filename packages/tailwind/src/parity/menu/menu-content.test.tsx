// @vitest-environment jsdom
/**
 * MenuContent container binding of the shared parity suite (INFRA-3021):
 * proves the compat menu card (the `Flex` the legacy
 * `uniswap/src/components/menus/ContextMenuContent.tsx` renders with its
 * defaults + `containerStyles` overrides) emits equivalent CSS from the
 * Tailwind compiler, per prop, theme, and scope — including the
 * MENU_CONTENT_SHEET_CONTAINER_STYLES payload the sheet leg will reuse.
 */
import { createElement } from 'react'
import { Flex } from 'ui/src'
import { animationsEnter } from 'ui/src/animations/presets'
import type { FlexProps } from 'ui/src/components/layout/Flex'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT,
  menuContentContainerClassName,
} from '../../../../mycelium/src/menu-compat/compile'
import { describeParity } from '../core/run-parity'
import { MENU_PARITY_EXCLUSIONS } from './exclusions'
import { expectedContainerDiffs } from './expectations'
import { buildContainerMatrix, type ContainerMatrixProps } from './matrix'

/**
 * The legacy container defaults (verbatim from ContextMenuContent.tsx),
 * consumed from the shared compat constant so the legacy twin can never
 * drift from what the compat compiler bakes in — MenuContent spreads
 * containerStyles over exactly these.
 */
const LEGACY_CONTAINER_DEFAULTS: FlexProps = MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT

describeParity<ContainerMatrixProps>({
  label: 'Menu content container — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildContainerMatrix(),
  matrixMinSize: 22,
  className: menuContentContainerClassName,
  renderTwin: (props) => createElement('div', { className: menuContentContainerClassName(props) }),
  tamaguiElement: (props) => createElement(Flex, { ...LEGACY_CONTAINER_DEFAULTS, ...(props as FlexProps) }),
  expectedScopedDiffs: expectedContainerDiffs,
  exclusions: MENU_PARITY_EXCLUSIONS,
  animationsEnter: { fadeIn: animationsEnter.fadeIn },
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
