/**
 * CSS-existence contract for the dropdown-set literal class constants
 * (INFRA-3021): the compat components compute row/section classNames through
 * the compilers (covered by the parity matrices), but the fixed chrome —
 * trigger sizes, search-input frame, checkbox visuals, the
 * --available-height / --anchor-width clamps — ships as FULL LITERAL class
 * strings (template-literal assembly would hide candidates from Tailwind's
 * static scanner and the CSS would silently not exist). This suite pins:
 * - the constants stay full literals in their compile sources;
 * - every class they contain produces CSS through the real Tailwind engine.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// nx-ignore-next-line
import {
  FILTER_SELECT_ITEM_FRAME_CLASS_NAME,
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
} from '../../../../mycelium/src/filter-select-compat/compile'
// nx-ignore-next-line
import {
  NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME,
  NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
} from '../../../../mycelium/src/network-selector-compat/compile'
// Relative cross-package imports: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  OPTION_CHECKED_MARKER_CLASS_NAME,
  OPTION_LIST_BOTTOM_FADE_CLASS_NAME,
  OPTION_LIST_EMPTY_STATE_CLASS_NAME,
  OPTION_LIST_SCROLL_CLASS_NAME,
  OPTION_LIST_SCROLL_SHELL_CLASS_NAME,
  OPTION_LIST_SEARCH_INPUT_CLASS_NAME,
  OPTION_LIST_SEARCH_INPUT_FRAME_CLASS_NAME,
  OPTION_ROW_ACTIVE_CLASS_NAME,
  OPTION_ROW_PILE_ITEM_CLASS_NAME,
  SELECT_ALL_CLEAR_HEADER_CLASS_NAMES,
} from '../../../../mycelium/src/option-list-compat/compile'
// nx-ignore-next-line
import {
  TRIGGER_BUTTON_BASE_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
  TRIGGER_BUTTON_SIZE_CLASS_NAMES,
  TRIGGER_BUTTON_VARIANT_CLASS_NAMES,
} from '../../../../mycelium/src/trigger-button-compat/compile'
import { compileTailwindClasses } from '../core/tailwind-compile'

const MYCELIUM_SRC = join(dirname(fileURLToPath(import.meta.url)), '../../../../mycelium/src')

interface ConstantGroup {
  sourceFile: string
  constants: Record<string, string>
}

const GROUPS: ConstantGroup[] = [
  {
    sourceFile: join(MYCELIUM_SRC, 'option-list-compat/compile.ts'),
    constants: {
      OPTION_CHECKED_MARKER_CLASS_NAME,
      OPTION_LIST_BOTTOM_FADE_CLASS_NAME,
      OPTION_LIST_EMPTY_STATE_CLASS_NAME,
      OPTION_LIST_SCROLL_CLASS_NAME,
      OPTION_LIST_SCROLL_SHELL_CLASS_NAME,
      OPTION_LIST_SEARCH_INPUT_CLASS_NAME,
      OPTION_LIST_SEARCH_INPUT_FRAME_CLASS_NAME,
      OPTION_ROW_ACTIVE_CLASS_NAME,
      OPTION_ROW_PILE_ITEM_CLASS_NAME,
      ...Object.fromEntries(
        Object.entries(SELECT_ALL_CLEAR_HEADER_CLASS_NAMES).map(([key, value]) => [`selectAllClear.${key}`, value]),
      ),
    },
  },
  {
    sourceFile: join(MYCELIUM_SRC, 'network-selector-compat/compile.ts'),
    constants: {
      NETWORK_SELECTOR_CONTENT_FRAME_CLASS_NAME,
      NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
    },
  },
  {
    sourceFile: join(MYCELIUM_SRC, 'trigger-button-compat/compile.ts'),
    constants: {
      TRIGGER_BUTTON_BASE_CLASS_NAME,
      TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
      TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
      ...Object.fromEntries(
        Object.entries(TRIGGER_BUTTON_SIZE_CLASS_NAMES).map(([key, value]) => [`size.${key}`, value]),
      ),
      ...Object.fromEntries(
        Object.entries(TRIGGER_BUTTON_VARIANT_CLASS_NAMES).map(([key, value]) => [`variant.${key}`, value]),
      ),
    },
  },
  {
    sourceFile: join(MYCELIUM_SRC, 'filter-select-compat/compile.ts'),
    constants: {
      FILTER_SELECT_ITEM_FRAME_CLASS_NAME,
      FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
    },
  },
]

/** CSS-escape a utility class the way Tailwind writes its selector. */
function escapeForSelector(cls: string): string {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`)
}

function splitClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean)
}

describe('dropdown-set literal class constants — Tailwind CSS existence', () => {
  it('every class appears as a full literal in its compile source (static-extraction guarantee)', () => {
    for (const group of GROUPS) {
      const source = readFileSync(group.sourceFile, 'utf8')
      for (const [name, value] of Object.entries(group.constants)) {
        for (const cls of splitClasses(value)) {
          expect(source, `"${cls}" (from ${name}) must appear literally in ${group.sourceFile}`).toContain(cls)
        }
      }
    }
  })

  it('every class produces CSS through the real Tailwind engine', async () => {
    const candidates = new Set<string>()
    for (const group of GROUPS) {
      for (const value of Object.values(group.constants)) {
        for (const cls of splitClasses(value)) {
          candidates.add(cls)
        }
      }
    }
    expect(candidates.size).toBeGreaterThan(20)
    const compiled = await compileTailwindClasses([...candidates])
    for (const cls of candidates) {
      // Invalid candidates are dropped from Tailwind's output entirely, so a
      // present (escaped) selector proves the CSS exists.
      expect(compiled.css, `no CSS emitted for class "${cls}"`).toContain(`.${escapeForSelector(cls)}`)
    }
  }, 120_000)
})
