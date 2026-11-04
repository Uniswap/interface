/**
 * Minimal react-native stand-in for the separator-compat vitest suite (jsdom
 * env — no Metro): the passthrough `View` host plus the `Dimensions` surface
 * the native leg's `$md` breakpoint store reads — only for the export-parity
 * assertions that run inside mycelium.
 */
import { createElement, forwardRef, type ComponentType, type ReactNode } from 'react'

type HostProps = Record<string, unknown> & { children?: ReactNode }

function host(type: string): ComponentType<HostProps> {
  const Host = forwardRef<unknown, HostProps>((props, ref) => createElement(type, { ...props, ref }))
  Host.displayName = type
  return Host as unknown as ComponentType<HostProps>
}

export const View = host('View')

export const Dimensions = {
  get: (_dimension: 'window' | 'screen'): { width: number; height: number } => ({ width: 1024, height: 768 }),
  addEventListener: (_type: 'change', _handler: () => void): { remove: () => void } => ({ remove: (): void => {} }),
}
