/**
 * Icon parity contract helpers (INFRA-2956).
 *
 * The contract has two halves:
 *  1. Name parity — the mycelium icon barrel exports exactly the same runtime
 *     names as `ui/src/components/icons` (274 base icons + their Animated twins).
 *  2. Path-data parity — every base icon renders the same meaningful SVG
 *     content as its legacy counterpart once wrapper-level attributes are
 *     normalized away.
 *
 * "Wrapper attributes" are the props the two factories legitimately apply
 * differently: legacy Tamagui resolves `size` into inline style
 * (`width/height` px + `color`) while the mycelium factory emits plain
 * `width`/`height` attributes. Everything that affects what is drawn —
 * element structure, path data, per-node presentation attributes, viewBox,
 * root stroke defaults — is compared verbatim.
 */

export interface NormalizedNode {
  tag: string
  attrs: Record<string, string>
  children: NormalizedNode[]
}

/**
 * Root-level attributes that are part of the drawing contract. Sizing,
 * inline style, classes, and color are wrapper concerns (the caller styles
 * the wrapper); these attributes change what the SVG paints.
 */
const ROOT_KEPT_ATTRS = ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']

/**
 * Derive the base icon names from a barrel's runtime export names: every
 * export except the generated `Animated<Base>` twins. A name only counts as
 * a twin when stripping the `Animated` prefix yields another export (so
 * `AnimatedCaretChange` — whose base `CaretChange` does not exist — stays a
 * base icon in its own right).
 */
export function deriveBaseIconNames(exportNames: readonly string[]): string[] {
  const all = new Set(exportNames)
  return [...exportNames]
    .filter((name) => !(name.startsWith('Animated') && all.has(name.slice('Animated'.length))))
    .sort()
}

function basename(path: string): string {
  const clean = path.split('?')[0] ?? path
  return clean.slice(clean.lastIndexOf('/') + 1)
}

function normalizeSvgElement(el: Element, isRoot: boolean): NormalizedNode {
  const attrs: Record<string, string> = {}
  for (const name of [...el.getAttributeNames()].sort()) {
    if (isRoot && !ROOT_KEPT_ATTRS.includes(name)) {
      continue
    }
    attrs[name] = el.getAttribute(name) ?? ''
  }
  return {
    tag: el.localName,
    attrs,
    children: Array.from(el.children).map((child) => normalizeSvgElement(child, false)),
  }
}

function normalizeImgElement(el: Element): NormalizedNode {
  const attrs: Record<string, string> = {}
  const src = el.getAttribute('src')
  if (src !== null) {
    // Both sides bundle their own copy of the asset; the file identity is the contract.
    attrs.src = basename(src)
  }
  for (const name of ['width', 'height']) {
    const value = el.getAttribute(name)
    if (value !== null) {
      attrs[name] = value
    }
  }
  return { tag: 'img', attrs, children: [] }
}

/**
 * Normalize a rendered icon: find the single drawing element (`svg`, or
 * `img` for the bitmap-based Unitag) anywhere under the container —
 * skipping wrapper elements either side renders around it — and reduce it
 * to a comparable tree.
 */
export function normalizeRenderedIcon(container: HTMLElement): NormalizedNode {
  const drawing = container.querySelectorAll('svg, img')
  if (drawing.length !== 1) {
    throw new Error(`expected exactly one rendered svg/img element, found ${drawing.length}`)
  }
  const el = drawing[0] as Element
  return el.localName === 'img' ? normalizeImgElement(el) : normalizeSvgElement(el, true)
}

/** Required props for icons that cannot render bare. */
export const REQUIRED_RENDER_PROPS: Record<string, Record<string, unknown>> = {
  CloseIconWithHover: { onClose: (): void => undefined },
}
