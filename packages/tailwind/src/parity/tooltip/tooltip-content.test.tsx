// @vitest-environment jsdom
/**
 * Tooltip content-frame binding of the shared parity suite (INFRA-3021):
 * proves the compat tooltip card (the styled `ContentInner` defaults from
 * `ui/src/components/tooltip/Tooltip.web.tsx` + the style overrides repo call
 * sites pass) emits equivalent CSS from the Tailwind compiler, per prop,
 * theme, and scope — including the per-theme shadow split.
 */
import { createElement } from 'react'
import { Flex } from 'ui/src'
import type { FlexProps } from 'ui/src/components/layout/Flex'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { tooltipContentFrameClassName } from '../../../../mycelium/src/tooltip-compat/compile'
import { describeParity } from '../core/run-parity'
import { TOOLTIP_PARITY_EXCLUSIONS } from './exclusions'
import { expectedContentDiffs } from './expectations'
import { buildContentMatrix, type TooltipContentMatrixProps } from './matrix'

/**
 * The legacy content-frame defaults, verbatim from Tooltip.web.tsx
 * `ContentInner` — call-site props spread over exactly these.
 */
const LEGACY_CONTENT_FRAME_DEFAULTS: FlexProps = {
  gap: '$spacing8',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  maxWidth: 350,
  px: '$spacing12',
  py: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  '$theme-dark': {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: '$none',
  },
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: '$spacing12',
  },
}

describeParity<TooltipContentMatrixProps>({
  label: 'Tooltip content frame — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildContentMatrix(),
  matrixMinSize: 18,
  className: tooltipContentFrameClassName,
  renderTwin: (props) => createElement('div', { className: tooltipContentFrameClassName(props) }),
  tamaguiElement: (props) => createElement(Flex, { ...LEGACY_CONTENT_FRAME_DEFAULTS, ...(props as FlexProps) }),
  expectedScopedDiffs: expectedContentDiffs,
  exclusions: TOOLTIP_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
