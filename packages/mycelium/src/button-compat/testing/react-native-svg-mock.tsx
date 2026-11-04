/**
 * Minimal react-native-svg stand-in for the button-compat vitest suites. The
 * real package ships CJS that reaches into react-native's untranspiled Flow
 * sources, which jsdom cannot parse (`SyntaxError: Unexpected token 'typeof'`)
 * — merely IMPORTING the native leg is enough to hit it. Hosts render as
 * `Svg.${name}`.
 */
import { createElement, forwardRef, type ComponentType, type ReactNode } from 'react'

type SvgProps = Record<string, unknown> & { children?: ReactNode }

function host(name: string): ComponentType<SvgProps> {
  const Component = forwardRef<unknown, SvgProps>((props, ref) => createElement(`Svg.${name}`, { ...props, ref }))
  Component.displayName = name
  return Component as unknown as ComponentType<SvgProps>
}

export const Svg = host('Svg')
export const Path = host('Path')
export const Circle = host('Circle')
export const G = host('G')

export default Svg
