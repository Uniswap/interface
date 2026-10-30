import { cloneElement, type ReactElement } from 'react'

/**
 * Static marker identifying mycelium primitives to legacy color-injecting
 * wrappers.
 *
 * The legacy `ui/src` `TouchableArea` (and its compat twin here) clones its
 * direct children with injected Spore color guidance, defaulting `color` to
 * `$accent3` — a token on the REJECTED side of the compat colour boundary
 * (`color-token-coverage.ts`), so a mycelium child cloned that way throws at
 * render. Mycelium primitives style themselves against `@universe/tailwind`
 * and take no legacy token guidance, so both injectors skip any child whose
 * component carries this marker.
 *
 * The marker is a registered symbol, but `packages/ui` is not blocked from
 * importing this module — `packages/ui` already depends on
 * `@universe/mycelium` (see `ui/src/components/factories/createIcon.tsx`
 * for a working deep import, and the `ui`→`mycelium` edge in the Nx project
 * graph). `WithInjectedColors` (the legacy `TouchableArea` injector) imports
 * `isMyceliumPrimitive`/`isMyceliumIcon` directly from
 * `@universe/mycelium/compat` rather than recomputing them from the registry
 * key. The KEY string stays pinned by `primitive-marker.test.tsx` here as a
 * guard on the registry spelling itself, independent of the direct import.
 */
export const MYCELIUM_PRIMITIVE_KEY = 'mycelium.primitive'

const MYCELIUM_PRIMITIVE = Symbol.for(MYCELIUM_PRIMITIVE_KEY)

export interface Markable {
  [MYCELIUM_PRIMITIVE]?: true
}

/**
 * Stamp a component (function or forwardRef/memo exotic) as a mycelium primitive.
 *
 * Ordering matters: `memo`/`forwardRef` WRAP rather than clone — `memo(Foo)`
 * is a fresh `{ $$typeof, type }` object with no prototype link back to
 * `Foo`, so a mark on the inner component is invisible on the wrapper. Always
 * mark the OUTERMOST object React reconciles against:
 *
 *   memo(markMyceliumPrimitive(FooImpl)) // mark lost — lives on FooImpl
 *   markMyceliumPrimitive(memo(FooImpl)) // mark found
 */
export function markMyceliumPrimitive<T>(component: T): T {
  Object.defineProperty(component, MYCELIUM_PRIMITIVE, {
    value: true,
    enumerable: false,
    configurable: true,
  })
  return component
}

/** True when a React element `type` is a marked mycelium primitive. */
export function isMyceliumPrimitive(type: unknown): type is Markable {
  if (type === null || (typeof type !== 'object' && typeof type !== 'function')) {
    return false
  }
  return (type as Markable)[MYCELIUM_PRIMITIVE] === true
}

/**
 * The gate for legacy `TouchableArea`'s hover-recolor injector, which injects
 * boundary-mapped `color` into a MYCELIUM glyph instead of skipping it like
 * other primitives — so it marks mycelium's factory output only.
 * Glyph-only sizing and colour must gate on `isIconGlyph` instead: this marker
 * misses every `ui/src` glyph, which is the defect that produced the 8px box.
 *
 * Local plain `Symbol()` — no registered `Symbol.for` key needed like
 * `MYCELIUM_PRIMITIVE_KEY`'s, because `ui/src`'s `WithInjectedColors` (the
 * cross-package reader) imports the `isMyceliumIcon` predicate directly from
 * `@universe/mycelium/compat` instead of recomputing a symbol from the
 * global registry.
 */
const MYCELIUM_ICON = Symbol('mycelium.icon')

export interface IconMarkable extends Markable {
  [MYCELIUM_ICON]?: true
}

/**
 * Stamp a component as a mycelium glyph (`createIcon` output). Also stamps
 * the generic primitive marker — a glyph IS a mycelium primitive, and
 * enforcing the subset here keeps consumers that gate on the generic marker
 * from ever seeing an icon-marked component slip through. Same
 * outermost-object rule as `markMyceliumPrimitive` around `memo`/`forwardRef`.
 */
export function markMyceliumIcon<T>(component: T): T {
  markMyceliumPrimitive(component)
  markIconGlyph(component)
  Object.defineProperty(component, MYCELIUM_ICON, {
    value: true,
    enumerable: false,
    configurable: true,
  })
  return component
}

/** True when a React element `type` is a marked mycelium glyph (`createIcon` output). */
export function isMyceliumIcon(type: unknown): type is IconMarkable {
  if (type === null || (typeof type !== 'object' && typeof type !== 'function')) {
    return false
  }
  return (type as IconMarkable)[MYCELIUM_ICON] === true
}

/**
 * `createIcon` output from EITHER factory. Separate from MYCELIUM_ICON, which
 * also stamps the generic primitive mark and so decides which colour-injection
 * path legacy `TouchableArea` takes — a `ui/src` glyph must keep the path it has.
 */
const ICON_GLYPH = Symbol('icon.glyph')

export interface GlyphMarkable {
  [ICON_GLYPH]?: true
}

/** Same outermost-object rule as `markMyceliumPrimitive`. */
export function markIconGlyph<T>(component: T): T {
  Object.defineProperty(component, ICON_GLYPH, {
    value: true,
    enumerable: false,
    configurable: true,
  })
  return component
}

/** Gate for cloning a pixel box onto a glyph: both factories size on inline style, beating a class. */
export function isIconGlyph(type: unknown): type is GlyphMarkable {
  if (type === null || (typeof type !== 'object' && typeof type !== 'function')) {
    return false
  }
  return (type as GlyphMarkable)[ICON_GLYPH] === true
}

/**
 * Clone a glyph onto a concrete pixel box, preserving an explicit caller colour.
 * Shared so the Button and IconButton slots cannot drift apart again.
 */
export function cloneGlyphBox(glyph: ReactElement, box: number): ReactElement {
  const { color } = glyph.props as { color?: unknown }
  return cloneElement(glyph, { color: color ?? 'currentColor', width: box, height: box } as Partial<unknown>)
}
