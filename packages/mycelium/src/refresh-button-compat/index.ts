/**
 * `@universe/mycelium/refresh-button-compat` — the compat `RefreshButton`
 * (INFRA-3489), which replaced the legacy `ui/src` `RefreshButton`.
 *
 * The component is imported by its BASE specifier so Metro resolves the
 * `.native.tsx` leg (a deliberate throwing stub — the render is web-guarded
 * at the sole consumer) and vite the `.web.tsx` leg; the platform-neutral
 * modules (`./props`, `./compile`) are shared, which is what keeps the legs'
 * exports identical (pinned by `platform-legs.test.ts`).
 */
export {
  REFRESH_BUTTON_COMPAT_CLASS_UNIVERSE,
  REFRESH_FRAME_BASE_CLASSES,
  REFRESH_FRAME_CURSOR_ACTIVE_CLASS,
  REFRESH_FRAME_CURSOR_INERT_CLASS,
  REFRESH_FRAME_HIDDEN_CLASS,
  REFRESH_FRAME_REVEAL_CLASSES,
  REFRESH_ICON_FRAME_BASE_CLASSES,
  REFRESH_ICON_HOVER_CLASSES,
  REFRESH_SPIN_CLASS,
  refreshButtonFrameClassName,
  refreshIconFrameClassName,
  type RefreshButtonFrameState,
} from './compile'
export { REFRESH_ICON_SIZE, REFRESH_SHORTCUT_KEYS, type RefreshButtonCompatProps } from './props'
export { RefreshButtonCompat } from './RefreshButtonCompat'
