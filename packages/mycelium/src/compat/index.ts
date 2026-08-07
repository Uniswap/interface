/**
 * The component-agnostic Tamagui→Tailwind compat core. A migrated component
 * (Flex today; Text/Button next) defines its own style-prop surface `S` and
 * per-style-object compiler, then reuses everything here: token maps, the
 * universal style-object translation, pool orchestration, the DOM wrapper,
 * media/group/animation machinery, and the shared prop surfaces.
 */
export { composeCompatClassName, type ComposeCompatOptions } from './compose'
export { createCompatComponent, type CompatDomProps } from './dom'
export {
  arbitrary,
  type ClassList,
  colorClasses,
  type CommonStyleClassOptions,
  commonStyleClasses,
  enumClass,
  flexboxStyleClasses,
  type FlexboxStyleValues,
  RESET_CLASSES,
  sizeValue,
  spacePx,
} from './style-classes'
export {
  ENTER_EXIT_PRESET_CLASSES,
  ENTER_PRESET_CLASSES,
  EXIT_PRESET_CLASSES,
  type AnimateEnterExitPreset,
  type AnimateEnterPreset,
  type AnimateExitPreset,
} from './animations'
export {
  GROUP_STATE_VARIANT,
  GROUP_STATES,
  type GroupStateParts,
  groupStateVariant,
  parseGroupStateProp,
  parseGroupStateSuffix,
} from './group'
export { MEDIA_VARIANT } from './media'
export {
  COLOR_TOKEN_CLASS,
  lookupToken,
  RADIUS_TOKEN_PX,
  SPACE_TOKEN_PX,
  type SporeColorToken,
  type SporeRadiusToken,
  type SporeSpaceToken,
  THEMED_COLOR_TOKEN_CLASSES,
} from './tokens'
export {
  CSS_PROP_NAME_OVERRIDES,
  cssPropertyName,
  LONG_TAIL_STYLE_PROPS,
  type LongTailStyleProp,
  UNITLESS_STYLE_PROPS,
} from './style-props'
export type {
  ColorValue,
  CompatAnimationProps,
  CompatAriaProps,
  CompatBehavioralProps,
  CompatEventProps,
  CompatGroupProps,
  CompatLegacyA11yProps,
  CompatMediaProps,
  CompatPlatformProps,
  CompatProps,
  CompatPseudoProps,
  CompatStyleProps,
  CompatThemeProps,
  DisplayValue,
  GroupState,
  GroupStatePropKey,
  InsetShorthand,
  LongTailStyleProps,
  MediaPropKey,
  OverflowValue,
  PositionValue,
  SizeValue,
  SpaceValue,
  TransformEntry,
} from './props'
