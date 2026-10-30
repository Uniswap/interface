/**
 * Full-window overlay portal (INFRA-2958), the Tamagui-free replacement for
 * `ui/src/components/portal/Portal`. Web is a true document-level
 * `createPortal` into `document.body`; native teleports into a
 * provider-mounted overlay layer. `PortalProvider` belongs at the app root.
 */
export { Portal, PortalProvider } from './Portal'
export { PORTAL_LAYER_TEST_ID } from './PortalProps'
export type { PortalProps, PortalProviderProps } from './PortalProps'
export {
  createPortalStackRegistry,
  PORTAL_DEFAULT_Z_INDEX,
  PORTAL_STACK_LAYER_STEP,
  type PortalStackRegistry,
  type PortalZIndexInput,
  resolvePortalZIndex,
} from './stack'
