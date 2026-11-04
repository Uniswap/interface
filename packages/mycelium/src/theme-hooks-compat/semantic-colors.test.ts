import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { BASE_COLOR_CSS_VARS, SEMANTIC_COLOR_CSS_VARS } from './semantic-color-css-vars'
import { BASE_COLORS, SEMANTIC_COLORS_DARK, SEMANTIC_COLORS_LIGHT } from './semantic-colors.generated'

// Drift guard: the generated JS colours must equal @universe/tailwind's theme.css
// byte-for-byte, so a colour edited in theme.css fails here until the generator is re-run.
const themeCss = readFileSync(createRequire(import.meta.url).resolve('@universe/tailwind/theme'), 'utf8')

describe('semantic-colors.generated mirrors @universe/tailwind theme.css', () => {
  it.each(Object.entries(SEMANTIC_COLOR_CSS_VARS))('%s (light and dark)', (key, stem) => {
    expect(SEMANTIC_COLORS_LIGHT[key as keyof typeof SEMANTIC_COLORS_LIGHT]).toBe(cssVar(`${stem}-light`))
    expect(SEMANTIC_COLORS_DARK[key as keyof typeof SEMANTIC_COLORS_DARK]).toBe(cssVar(`${stem}-dark`))
  })

  it.each(Object.entries(BASE_COLOR_CSS_VARS))('%s', (key, stem) => {
    expect(BASE_COLORS[key as keyof typeof BASE_COLORS]).toBe(cssVar(stem))
  })

  it('maps every generated key', () => {
    expect(Object.keys(SEMANTIC_COLORS_LIGHT)).toEqual(Object.keys(SEMANTIC_COLOR_CSS_VARS))
    expect(Object.keys(SEMANTIC_COLORS_DARK)).toEqual(Object.keys(SEMANTIC_COLOR_CSS_VARS))
    expect(Object.keys(BASE_COLORS)).toEqual(Object.keys(BASE_COLOR_CSS_VARS))
  })
})

function cssVar(name: string): string | undefined {
  return new RegExp(`--color-${name}:\\s*([^;]+);`).exec(themeCss)?.[1]?.trim()
}
