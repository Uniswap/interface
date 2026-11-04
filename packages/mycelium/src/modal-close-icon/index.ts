/**
 * `@universe/mycelium/modal-close-icon` — the compat `ModalCloseIcon`
 * (INFRA-3282), which replaced the legacy `ui/src` `ModalCloseIcon`.
 *
 * The component is imported by its BASE specifier so Metro resolves the
 * `.native.tsx` leg and vite the `.web.tsx` leg; the platform-neutral modules
 * (`./props`, `./resolve`) are shared by both legs, which is what keeps their
 * exports and behavior identical.
 */
export { ModalCloseIconCompat } from './ModalCloseIconCompat'
export {
  DEFAULT_CLOSE_ICON_COLOR,
  DEFAULT_CLOSE_ICON_HOVER_COLOR,
  DEFAULT_CLOSE_ICON_ROLE,
  DEFAULT_CLOSE_ICON_SIZE,
  type ModalCloseIconColor,
  type ModalCloseIconProps,
} from './props'
export { closeIconSizePx, resolveCloseIconColor } from './resolve'
