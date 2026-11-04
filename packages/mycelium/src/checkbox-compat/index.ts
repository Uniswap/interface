/**
 * `@universe/mycelium/checkbox-compat` — the compat-capable checkbox pair
 * (INFRA-3233), which replaced the legacy Tamagui `Checkbox` and `LabeledCheckbox`
 * from `ui/src`.
 *
 * Deliberately NOT named `Checkbox`: mycelium already exports a different,
 * web-only Radix `Checkbox` from `@universe/mycelium/components`
 * (`components/checkbox.tsx`), which is left entirely alone — it is not the
 * compat target (its props are Radix's, its size is a hard-coded 20px, and it
 * has no native leg).
 *
 * The two components are imported by their BASE specifier so Metro resolves the
 * `.native.tsx` leg and vite the `.web.tsx` leg; every platform-neutral module
 * (`./props`, `./resolve`, `./compile`) is shared by both legs, which is what
 * keeps their exports and behavior identical.
 */
export { CheckboxCompat } from './CheckboxCompat'
export { LabeledCheckboxCompat } from './LabeledCheckboxCompat'
export {
  BOX_BASE_CLASSES,
  BOX_SIZE_CLASS_BY_TOKEN,
  CHECK_GLYPH_BASE_CLASSES,
  CHECKBOX_COMPAT_CLASS_UNIVERSE,
  checkboxBoxClassName,
  checkboxFocusRingClassName,
  checkboxIndicatorClassName,
  checkGlyphClassName,
  checkGlyphColorToken,
  FOCUS_RING_BASE_CLASSES,
  FOCUS_RING_SIZE_CLASS_BY_TOKEN,
  GAP_CLASS_BY_TOKEN,
  HOVER_DOT_CLASSES,
  INDICATOR_BASE_CLASSES,
  INDICATOR_SIZE_CLASS_BY_TOKEN,
  LABELED_CONTAINER_CLASSES,
  LABELED_ROW_BASE_CLASSES,
  LABELED_TEXT_CLASSES,
  LABELED_TEXT_WRAPPER_CLASSES,
  labeledRowClassName,
  labeledRowStyle,
  PX_CLASS_BY_TOKEN,
  PY_CLASS_BY_TOKEN,
  spaceClass,
  type CheckboxFrameState,
  type LabeledRowOptions,
} from './compile'
export {
  CHECKBOX_AT_REST,
  CHECKBOX_SIZES_BY_TOKEN,
  checkboxSizePx,
  checkGlyphGeometry,
  checkGlyphPx,
  DEFAULT_CHECKBOX_POSITION,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_CHECKBOX_VARIANT,
  DEFAULT_LABELED_GAP,
  DEFAULT_LABELED_PX,
  deriveCheckboxSizes,
  hoverDotPx,
  labeledTextShape,
  resolveCheckboxSizes,
  resolveHoverStyle,
  shouldShowHoverDot,
  shouldShowIndicator,
  type CheckboxInteractionState,
  type CheckboxSizes,
  type CheckGlyphGeometry,
  type LabeledTextShape,
} from './resolve'
export type {
  CheckboxCompatHoverStyle,
  CheckboxCompatPointerEvents,
  CheckboxCompatPressEvent,
  CheckboxCompatPressHandler,
  CheckboxCompatProps,
  CheckboxCompatSizeToken,
  CheckboxCompatStyleProp,
  CheckboxCompatVariant,
  CheckboxPosition,
  LabeledCheckboxCompatProps,
} from './props'
