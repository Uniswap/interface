/**
 * `@universe/mycelium/animatable-copy-icon-compat` — the compat
 * `AnimatableCopyIcon` (INFRA-3653)
 *
 * The component is imported by its BASE specifier so Metro resolves the
 * `.native.tsx` leg and vite the `.web.tsx` leg; the platform-neutral modules
 * (`./props`, `./resolve`) are shared by both legs, which is what keeps their
 * exports and behavior identical.
 */
export { AnimatableCopyIconCompat } from './AnimatableCopyIconCompat'
export {
  COPY_ICON_CHECKMARK_COLOR,
  DEFAULT_COPY_ICON_COLOR,
  type AnimatableCopyIconColor,
  type CopyIconProps,
} from './props'
export { COPY_SHEETS_GLYPH, resolveCopyIconColor } from './resolve'
