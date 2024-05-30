import { ShineProps } from './ShineProps'

/**
 * Replaces Shine component during e2e testing because expo LinearGradient
 * is currently not supported by detox.
 */
export function Shine({ children }: ShineProps): JSX.Element {
  return children
}
