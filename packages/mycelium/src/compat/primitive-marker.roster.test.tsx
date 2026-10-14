/**
 * Self-maintaining marker roster (INFRA-3336 audit follow-through).
 *
 * `primitive-marker.test.tsx` pins the marker MECHANISM on a hand-picked
 * component list; this suite pins the SURFACE by enumerating public barrels,
 * so a new generated icon, hand-written logo, or compat leg cannot ship
 * without the marker that legacy color-injecting wrappers key their skip on
 * — the forgetting-to-mark failure mode is silent otherwise.
 *
 * Compat legs are enumerated from the filesystem (every `*Compat.web.tsx`
 * under `src/`) — the `.web` files where marking happens — rather than
 * through the platformless base stubs, which throw by design and are never
 * what a legacy wrapper clones on web. Web-only compat components without a
 * platform split (`menu-compat`, `popover-compat`, …) have no `.web` leg and
 * sit outside this net; they gain coverage the moment they grow one —
 * `tooltip-compat` did exactly that, and is now ledgered below.
 */
import { readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as icons from '../components/icons'
import * as logos from '../components/logos'
import { isMyceliumIcon, isMyceliumPrimitive } from './primitive-marker'

/**
 * Hand-written icons known to ship UNMARKED, found by this suite (INFRA-3336).
 *
 * They cannot be marked yet: `TouchableAreaCompat`'s injector currently
 * FULL-skips marked primitives, so marking these today silently drops the
 * hover-recolor guidance their unmarked state receives (measured on
 * OtherWalletsModal's BackArrow: the `group-hover` recolor emission
 * disappears). INFRA-3537 / PR #39578 makes the injectors icon-aware
 * (marked GLYPHS keep boundary-mapped color guidance; only non-glyph
 * primitives are skipped) — once that lands, mark these with
 * `markMyceliumIcon` + `markMyceliumPrimitive` (what `createIcon` stamps)
 * and delete the entries. The flip assertion below goes red the moment one
 * is marked, so an entry can never rot after its fix lands.
 */
const KNOWN_UNMARKED_HANDWRITTEN_ICONS: ReadonlySet<string> = new Set([
  'BackArrow',
  // The bare `Caret` reaches the barrel via `export * from './exported'` → `export * from './Caret'`; the barrel's direct `AnimatedCaretChange` export is already marked.
  'Caret',
  'CloseIconWithHover',
  'HeartWithFill',
  'OSDynamicCloudIcon',
  'RotatableChevron',
  'Unitag',
])

/** PascalCase value exports — components; lowercase helpers and erased types fall out. */
function componentExports(mod: Record<string, unknown>): [string, unknown][] {
  return Object.entries(mod).filter(
    ([name, value]) =>
      /^[A-Z]/.test(name) && (typeof value === 'function' || (typeof value === 'object' && value !== null)),
  )
}

const iconEntries = componentExports(icons as Record<string, unknown>)
const logoEntries = componentExports(logos as Record<string, unknown>)

describe('icon + logo barrels: every export carries both markers', () => {
  it('the enumeration reads the real surface, not an accidentally empty one', () => {
    // 274+ base icons plus their Animated twins; exact counts live in the
    // tailwind parity suites — this only guards the enumeration itself.
    expect(iconEntries.length).toBeGreaterThan(274)
    expect(logoEntries.length).toBeGreaterThan(0)
  })

  it('every icon and logo export outside the known-gap ledger is marked as a mycelium icon', () => {
    const unmarked = [...iconEntries, ...logoEntries]
      .filter(([name, value]) => !KNOWN_UNMARKED_HANDWRITTEN_ICONS.has(name) && !isMyceliumIcon(value))
      .map(([name]) => name)
    expect(unmarked).toEqual([])
  })

  it('every icon and logo export outside the known-gap ledger also carries the generic primitive marker', () => {
    const unmarked = [...iconEntries, ...logoEntries]
      .filter(([name, value]) => !KNOWN_UNMARKED_HANDWRITTEN_ICONS.has(name) && !isMyceliumPrimitive(value))
      .map(([name]) => name)
    expect(unmarked).toEqual([])
  })

  it('known-gap entries are real exports and still unmarked — marking one forces its entry out of the ledger', () => {
    const exportsByName = new Map([...iconEntries, ...logoEntries])
    for (const name of KNOWN_UNMARKED_HANDWRITTEN_ICONS) {
      const component = exportsByName.get(name)
      expect(component, `'${name}' is in the known-gap ledger but is not an icon-barrel export`).toBeDefined()
      expect(
        isMyceliumIcon(component) || isMyceliumPrimitive(component),
        `'${name}' is marked now — delete its KNOWN_UNMARKED_HANDWRITTEN_ICONS entry`,
      ).toBe(false)
    }
  })
})

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Every `*Compat.web.tsx` under `src/`, as extensionless module ids relative to `src/` (e.g. `flex-compat/FlexCompat.web`). */
function collectCompatWebLegs(directory: string): string[] {
  const legs: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      legs.push(...collectCompatWebLegs(full))
    } else if (entry.name.endsWith('Compat.web.tsx')) {
      legs.push(
        relative(SRC_ROOT, full)
          .split(sep)
          .join('/')
          .replace(/\.tsx$/, ''),
      )
    }
  }
  return legs
}

const compatWebLegs = collectCompatWebLegs(SRC_ROOT).sort()

async function importCompatLeg(moduleId: string): Promise<Record<string, unknown>> {
  // @vite-ignore: build-time dynamic-import-vars can't glob across directory
  // levels; vitest's runtime resolver handles the specifier fine (same
  // extension appending as the static `../flex-compat/FlexCompat.web` form).
  // oxlint-disable-next-line no-unsanitized/method -- moduleId comes from readdirSync over this repo's own src tree (test-only), not user input
  return (await import(/* @vite-ignore */ `../${moduleId}`)) as Record<string, unknown>
}

/**
 * The legs the legacy injectors are known to clone — the reason this suite
 * exists. A floor for the enumeration, not a ceiling: legs found beyond
 * these still face the marked/ledgered dichotomy below.
 */
const CLONEABLE_COMPAT_WEB_LEGS = [
  'flex-compat/FlexCompat.web',
  'text-compat/TextCompat.web',
  'touchable-area/TouchableAreaCompat.web',
  'view-compat/ViewCompat.web',
] as const

/**
 * Compat web legs known to ship UNMARKED — seeded when this enumeration became
 * filesystem-derived, and grown since by legs that landed after it (the
 * enumeration finds them the moment they hit disk). Marker adoption has
 * so far covered only the legs above plus `createIcon` glyphs; these await
 * triage — and marking is not a blind fix: `TouchableAreaCompat`'s injector
 * FULL-skips marked children (the same caveat that parks the icon ledger
 * above on INFRA-3537 / PR #39578). Per leg, either mark it once the
 * injectors are icon/primitive-aware, or record here why it can never be a
 * legacy-clone target. The flip assertion below goes red the moment a leg
 * gets marked, so an entry can never rot after its fix lands.
 */
const KNOWN_UNMARKED_COMPAT_WEB_LEGS: ReadonlySet<string> = new Set([
  'animatable-copy-icon-compat/AnimatableCopyIconCompat.web',
  'button-compat/ButtonCompat.web',
  'button-frame-compat/ButtonFrameCompat.web',
  'button-frame-compat/ButtonTextCompat.web',
  'button-frame-compat/ThemedIconCompat.web',
  'checkbox-compat/CheckboxCompat.web',
  'checkbox-compat/LabeledCheckboxCompat.web',
  'dynamic-size-text/DynamicSizeTextCompat.web',
  'element-after-text/ElementAfterTextCompat.web',
  'icon-button-compat/IconButtonCompat.web',
  'modal-close-icon/ModalCloseIconCompat.web',
  'touchable-text-link/TouchableTextLinkCompat.web',
  'tooltip-compat/TooltipCompat.web',
])

describe('compat web legs (filesystem-derived): every component export carries the primitive marker', () => {
  it('the enumeration reads the real surface — the known cloneable legs are all present', () => {
    expect(compatWebLegs).toEqual(expect.arrayContaining([...CLONEABLE_COMPAT_WEB_LEGS]))
  })

  it('known-unmarked entries are real legs on disk — deleting a module forces its entry out of the ledger', () => {
    for (const moduleId of KNOWN_UNMARKED_COMPAT_WEB_LEGS) {
      expect(
        compatWebLegs,
        `'${moduleId}' is in KNOWN_UNMARKED_COMPAT_WEB_LEGS but no such module exists — delete its entry`,
      ).toContain(moduleId)
    }
  })

  it.each(compatWebLegs.filter((moduleId) => !KNOWN_UNMARKED_COMPAT_WEB_LEGS.has(moduleId)))(
    '%s exports only marked components',
    async (moduleId) => {
      const entries = componentExports(await importCompatLeg(moduleId))
      expect(entries.length).toBeGreaterThan(0)
      const unmarked = entries.filter(([, value]) => !isMyceliumPrimitive(value)).map(([name]) => name)
      expect(unmarked).toEqual([])
    },
  )

  // Registered conditionally: `it.each` errors on an empty table, and the
  // ledger's intended terminal state is exactly that — every leg triaged and
  // the set emptied, at which point there is nothing left to pin.
  // oxlint-disable-next-line vitest/no-conditional-tests
  if (KNOWN_UNMARKED_COMPAT_WEB_LEGS.size > 0) {
    it.each([...KNOWN_UNMARKED_COMPAT_WEB_LEGS].sort())(
      '%s is still unmarked — marking it forces its entry out of the ledger',
      async (moduleId) => {
        const entries = componentExports(await importCompatLeg(moduleId))
        expect(entries.length).toBeGreaterThan(0)
        const unmarked = entries.filter(([, value]) => !isMyceliumPrimitive(value)).map(([name]) => name)
        expect(
          unmarked.length,
          `'${moduleId}' is fully marked now — delete its KNOWN_UNMARKED_COMPAT_WEB_LEGS entry`,
        ).toBeGreaterThan(0)
      },
    )
  }

  it('compat components are NOT icon-marked — glyph-only consumers must not catch them', async () => {
    const modules = await Promise.all(compatWebLegs.map(importCompatLeg))
    const iconMarked = modules
      .flatMap((mod) => componentExports(mod))
      .filter(([, value]) => isMyceliumIcon(value))
      .map(([name]) => name)
    expect(iconMarked).toEqual([])
  })
})
