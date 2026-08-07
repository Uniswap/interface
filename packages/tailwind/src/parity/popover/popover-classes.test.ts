/**
 * CSS-existence contract for the popover-compat popup classes (INFRA-3021):
 * the compat computes classNames at runtime, so Tailwind's static scanner
 * only ever sees candidates that appear LITERALLY in source (or in a
 * generated class manifest). This suite pins both halves:
 * - the four motion-variant strings stay full literals in
 *   `popover-compat/compile.ts` (template-literal assembly would hide them
 *   from static extraction and the CSS would silently not exist);
 * - every class the compiler emits (both motion directions + the frame
 *   defaults) actually produces CSS through the real Tailwind engine.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { adaptiveWebPopoverContentCompatClassName } from '../../../../mycelium/src/popover-compat/compile'
import { compileTailwindClasses } from '../core/tailwind-compile'

const COMPILE_SOURCE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../mycelium/src/popover-compat/compile.ts',
)

const MOTION_VARIANT_CLASSES = [
  'data-starting-style:translate-y-[10px]',
  'data-ending-style:translate-y-[10px]',
  'data-starting-style:translate-y-[-10px]',
  'data-ending-style:translate-y-[-10px]',
] as const

/** CSS-escape a utility class the way Tailwind writes its selector. */
function escapeForSelector(cls: string): string {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`)
}

describe('popover-compat popup classes — Tailwind CSS existence', () => {
  it('the motion variant classes appear as full literals in compile.ts (static-extraction guarantee)', () => {
    const source = readFileSync(COMPILE_SOURCE_PATH, 'utf8')
    for (const cls of MOTION_VARIANT_CLASSES) {
      expect(source, `"${cls}" must appear literally in popover-compat/compile.ts`).toContain(cls)
    }
  })

  it('every class the compiler emits produces CSS through the real Tailwind engine', async () => {
    const candidates = new Set<string>()
    for (const placement of ['top', 'bottom', undefined] as const) {
      for (const cls of adaptiveWebPopoverContentCompatClassName({ placement }).split(' ')) {
        if (cls !== '') {
          candidates.add(cls)
        }
      }
    }
    expect([...candidates]).toEqual(expect.arrayContaining([...MOTION_VARIANT_CLASSES]))
    const compiled = await compileTailwindClasses([...candidates])
    for (const cls of candidates) {
      // Invalid candidates are dropped from Tailwind's output entirely, so a
      // present (escaped) selector proves the CSS exists.
      expect(compiled.css, `no CSS emitted for class "${cls}"`).toContain(`.${escapeForSelector(cls)}`)
    }
  }, 120_000)
})
