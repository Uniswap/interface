// @vitest-environment jsdom
/**
 * Option-list bindings of the shared parity suite (INFRA-3021 dropdown set):
 * proves the compat option-row frame/label and tier section-header
 * frame/title emit CSS equivalent to the legacy Tamagui elements rendered
 * with the verbatim prop payloads from
 * `uniswap/src/components/network/NetworkOption.tsx` and
 * `uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent.tsx`,
 * per prop, theme, and scope (hover included). Same binding approach as the
 * menu container matrix: the legacy twin is the Flex/Text element carrying
 * the exact legacy props, consumed from shared compat constants so the twin
 * can never drift from what the compilers bake in.
 */
import { createElement } from 'react'
import { Flex, Text } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  OPTION_LIST_SECTION_HEADER_FRAME_PROPS_COMPAT,
  OPTION_LIST_SECTION_HEADER_STICKY_PROPS_COMPAT,
  OPTION_LIST_SECTION_HEADER_TITLE_PROPS_COMPAT,
  OPTION_ROW_FRAME_PROPS_COMPAT,
  OPTION_ROW_LABEL_PROPS_COMPAT,
  optionListSectionHeaderClassName,
  optionListSectionHeaderTitleClassName,
  optionRowFrameClassName,
  optionRowLabelClassName,
} from '../../../../mycelium/src/option-list-compat/compile'
import { describeParity } from '../core/run-parity'
import { OPTION_LIST_PARITY_EXCLUSIONS } from './exclusions'
import {
  expectedOptionRowFrameDiffs,
  expectedOptionRowLabelDiffs,
  expectedSectionHeaderDiffs,
  expectedSectionHeaderTitleDiffs,
} from './expectations'
import {
  buildOptionRowFrameMatrix,
  buildOptionRowLabelMatrix,
  buildSectionHeaderMatrix,
  buildSectionHeaderTitleMatrix,
  type OptionRowFrameMatrixProps,
  type OptionRowLabelMatrixProps,
  type SectionHeaderMatrixProps,
  type SectionHeaderTitleMatrixProps,
} from './matrix'

describeParity<OptionRowFrameMatrixProps>({
  label: 'Option row frame (NetworkOption root Flex) — Tamagui CSS ≡ compiled Tailwind CSS, per scope',
  matrix: buildOptionRowFrameMatrix(),
  matrixMinSize: 4,
  className: optionRowFrameClassName,
  renderTwin: (props) => createElement('div', { className: optionRowFrameClassName(props) }),
  tamaguiElement: (props) =>
    createElement(Flex, {
      ...OPTION_ROW_FRAME_PROPS_COMPAT,
      hoverStyle: { backgroundColor: '$surface2', borderRadius: props.borderRadius ?? '$rounded8' },
    }),
  expectedScopedDiffs: expectedOptionRowFrameDiffs,
  exclusions: OPTION_LIST_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})

describeParity<OptionRowLabelMatrixProps>({
  label: 'Option row label (NetworkOption Text body2/$neutral1) — Tamagui CSS ≡ compiled Tailwind CSS',
  matrix: buildOptionRowLabelMatrix(),
  matrixMinSize: 2,
  className: () => optionRowLabelClassName(),
  renderTwin: () => createElement('span', { className: optionRowLabelClassName() }),
  tamaguiElement: () => createElement(Text, OPTION_ROW_LABEL_PROPS_COMPAT),
  expectedScopedDiffs: expectedOptionRowLabelDiffs,
  exclusions: OPTION_LIST_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})

describeParity<SectionHeaderMatrixProps>({
  label: 'Tier section header frame (NetworkFilterContent SectionHeader Flex) — Tamagui CSS ≡ compiled Tailwind CSS',
  matrix: buildSectionHeaderMatrix(),
  matrixMinSize: 4,
  className: optionListSectionHeaderClassName,
  renderTwin: (props) => createElement('div', { className: optionListSectionHeaderClassName(props) }),
  tamaguiElement: (props) =>
    createElement(Flex, {
      ...OPTION_LIST_SECTION_HEADER_FRAME_PROPS_COMPAT,
      ...(props.sticky === true ? OPTION_LIST_SECTION_HEADER_STICKY_PROPS_COMPAT : {}),
    }),
  expectedScopedDiffs: expectedSectionHeaderDiffs,
  exclusions: OPTION_LIST_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})

describeParity<SectionHeaderTitleMatrixProps>({
  label: 'Tier section header title (SectionHeader Text body4/$neutral2) — Tamagui CSS ≡ compiled Tailwind CSS',
  matrix: buildSectionHeaderTitleMatrix(),
  matrixMinSize: 2,
  className: () => optionListSectionHeaderTitleClassName(),
  renderTwin: () => createElement('span', { className: optionListSectionHeaderTitleClassName() }),
  tamaguiElement: () => createElement(Text, OPTION_LIST_SECTION_HEADER_TITLE_PROPS_COMPAT),
  expectedScopedDiffs: expectedSectionHeaderTitleDiffs,
  exclusions: OPTION_LIST_PARITY_EXCLUSIONS,
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [],
  layerBProps: [],
})
