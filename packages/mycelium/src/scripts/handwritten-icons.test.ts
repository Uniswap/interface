import { readdir } from 'node:fs/promises'
import path, { join } from 'node:path'
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error
import uppercamelcase from 'uppercamelcase'
import { describe, expect, it } from 'vitest'
import { assertNotHandwritten, HANDWRITTEN_ICON_COMPONENTS } from './handwritten-icons'

describe('generator hand-written guard', () => {
  it('lets non-colliding SVG names through', () => {
    expect(() => assertNotHandwritten('Heart', 'heart.svg')).not.toThrow()
  })

  it('fails loudly when an SVG would overwrite a hand-written icon', () => {
    expect(() => assertNotHandwritten('Caret', 'caret.svg')).toThrow(/hand-written/)
  })

  it('the guard set is exactly the on-disk hand-written files (icons without an SVG source)', async () => {
    const iconsDir = join(__dirname, '..', 'components', 'icons')
    const svgDir = join(__dirname, '..', '..', '..', 'ui', 'src', 'assets', 'icons')

    const generated = new Set(
      (await readdir(svgDir))
        .filter((name) => name.endsWith('.svg'))
        .map((name) => uppercamelcase(path.basename(name, '.svg')) as string),
    )
    const handwritten = (await readdir(iconsDir))
      .filter((name) => name.endsWith('.tsx'))
      .map((name) => path.basename(name, '.tsx'))
      .filter((name) => !generated.has(name) && name !== 'index' && name !== 'exported')
      .sort()

    expect(handwritten).toEqual([...HANDWRITTEN_ICON_COMPONENTS].sort())
  })
})
