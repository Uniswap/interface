/**
 * Behavior tests for the icon intake validator. Every rejection here is a way the
 * generator would otherwise fail late or silently: flatten a second color, regenerate
 * over an existing icon, or ship invisible geometry.
 *
 * Run with `bun test scripts/add-icons.test.ts`.
 */
import { describe, expect, it } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error uppercamelcase ships no types; the generators import it the same way
import uppercamelcase from 'uppercamelcase'
import {
  type IconFile,
  type TargetDirs,
  existingPathsFor,
  findReplacements,
  pathBBox,
  removeGeneratedComponents,
  targetDirs,
  toComponentName,
  validateBatch,
  validateSvg,
} from './add-icons'

const DIRS: TargetDirs = {
  svgDir: '/repo/packages/ui/src/assets/icons',
  componentDirs: ['/repo/packages/ui/src/components/icons', '/repo/packages/mycelium/src/components/icons'],
}

const GOOD_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 2H14V14H2Z" fill="#131313"/>
</svg>`

function svgWith(inner: string, rootAttrs = 'viewBox="0 0 16 16" fill="none"'): string {
  return `<svg ${rootAttrs} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
}

function validate(files: IconFile[], existing: string[] = [], replace = false): string[] {
  const existingSet = new Set(existing)
  return validateBatch(files, {
    target: 'icons',
    dirs: DIRS,
    replace,
    exists: (path) => existingSet.has(path),
  }).map((issue) => `${issue.name}: ${issue.message}`)
}

describe('toComponentName', () => {
  it('matches uppercamelcase, which both generators use on the file stem', () => {
    for (const name of ['tag', 'game-controller', 'arrow-down-arrow-up', 'face-laugh-relaxed', 'x-twitter', 'web3']) {
      expect(toComponentName(name)).toBe(uppercamelcase(name))
    }
  })
})

describe('validateBatch', () => {
  it('accepts a clean batch', () => {
    expect(
      validate([
        { name: 'robot', svg: GOOD_SVG },
        { name: 'game-controller', svg: GOOD_SVG },
      ]),
    ).toEqual([])
  })

  it('rejects an empty batch', () => {
    expect(validate([])).toEqual(['(batch): no files given.'])
  })

  it('rejects names that are not kebab-case', () => {
    const issues = validate([
      { name: 'Robot Icon', svg: GOOD_SVG },
      { name: 'robot_icon', svg: GOOD_SVG },
      { name: '-robot', svg: GOOD_SVG },
    ])
    expect(issues).toHaveLength(3)
    for (const issue of issues) {
      expect(issue).toContain('name must be kebab-case')
    }
  })

  it('rejects a name whose SVG already exists', () => {
    expect(validate([{ name: 'coin', svg: GOOD_SVG }], [`${DIRS.svgDir}/coin.svg`])).toEqual([
      'coin: already exists as Coin. Pick another name, or pass --replace to overwrite it.',
    ])
  })

  it('allows an existing name when replace is set', () => {
    expect(validate([{ name: 'coin', svg: GOOD_SVG }], [`${DIRS.svgDir}/coin.svg`], true)).toEqual([])
  })

  it('still applies every other rule when replace is set', () => {
    const noViewBox = svgWith('<path d="M0 0H16" fill="#131313"/>', 'width="16" height="16"')
    expect(validate([{ name: 'coin', svg: noViewBox }], [`${DIRS.svgDir}/coin.svg`], true)[0]).toContain(
      'missing viewBox',
    )
    expect(validate([{ name: 'Bad Name', svg: GOOD_SVG }], [], true)[0]).toContain('kebab-case')
  })

  it('rejects a name whose component exists in any generator output dir', () => {
    const [ui, mycelium] = DIRS.componentDirs
    expect(validate([{ name: 'coin', svg: GOOD_SVG }], [`${ui}/Coin.tsx`])).toHaveLength(1)
    expect(validate([{ name: 'coin', svg: GOOD_SVG }], [`${mycelium}/Coin.tsx`])).toHaveLength(1)
  })

  it('rejects duplicate names within the batch', () => {
    expect(
      validate([
        { name: 'robot', svg: GOOD_SVG },
        { name: 'robot', svg: GOOD_SVG },
      ]),
    ).toEqual(['robot: appears 2 times in the batch.'])
  })

  it('rejects different stems that generate the same component', () => {
    expect(
      validate([
        { name: 'icon-2', svg: GOOD_SVG },
        { name: 'icon2', svg: GOOD_SVG },
      ]),
    ).toEqual(['icon-2: icon-2 and icon2 both generate Icon2; one would overwrite the other. Rename one.'])
  })

  it('reports every failing file at once', () => {
    const issues = validate(
      [
        { name: 'Bad Name', svg: GOOD_SVG },
        { name: 'coin', svg: GOOD_SVG },
        { name: 'ok', svg: svgWith('<path d="M0 0H16" fill="#131313"/>', 'fill="none"') },
      ],
      [`${DIRS.svgDir}/coin.svg`],
    )
    expect(issues.map((issue) => issue.split(':')[0])).toEqual(['Bad Name', 'coin', 'ok'])
  })
})

describe('validateSvg', () => {
  const icons = { target: 'icons' as const }

  it('accepts a single-color icon with a viewBox', () => {
    expect(validateSvg(GOOD_SVG, icons)).toEqual([])
  })

  it('rejects markup without an <svg> root', () => {
    expect(validateSvg('<div>nope</div>', icons)).toEqual([
      'not a parseable SVG: expected a single <svg> root element.',
    ])
    expect(validateSvg('not xml at all', icons)[0]).toContain('not a parseable SVG')
  })

  it('rejects a missing viewBox', () => {
    expect(validateSvg(svgWith('<path d="M0 0H16" fill="#131313"/>', 'width="16" height="16"'), icons)).toEqual([
      'missing viewBox. The generated component needs it to scale; re-export with "Include viewBox".',
    ])
  })

  it('rejects script, style, image and foreignObject elements', () => {
    const inner = '<path d="M0 0H16" fill="#131313"/>'
    expect(validateSvg(svgWith(`${inner}<script>alert(1)</script>`), icons)[0]).toContain('contains <script>')
    expect(validateSvg(svgWith(`${inner}<style>path{fill:red}</style>`), icons)[0]).toContain('contains <style>')
    expect(validateSvg(svgWith(`${inner}<image href="x.png"/>`), icons)[0]).toContain('contains <image>')
    expect(validateSvg(svgWith(`${inner}<foreignObject/>`), icons)[0]).toContain('contains <foreignObject>')
  })

  it('rejects a multi-color icon and names the colors', () => {
    const svg = svgWith('<rect fill="#FFFFFF"/><path d="M0 0H16" fill="#131313"/><path d="M0 8H16" stroke="#8A38F5"/>')
    expect(validateSvg(svg, icons)).toEqual([
      'uses 3 colors (#131313, #8a38f5, #ffffff). Icons flatten to one color; export a single-color version, or use --target logos.',
    ])
  })

  it('ignores none, currentColor and gradient references when counting colors', () => {
    const svg = svgWith(
      '<path d="M0 0H16" fill="url(#g)" stroke="none"/><path d="M0 8H16" fill="currentColor"/><path d="M0 4H16" fill="#131313"/>',
    )
    expect(validateSvg(svg, icons)).toEqual([])
  })

  it('counts colors set through inline style attributes', () => {
    const svg = svgWith(
      '<path d="M0 0H16" style="fill:#131313"/><path d="M0 8H16" style="fill: #FF37C7; stroke:none"/>',
    )
    expect(validateSvg(svg, icons)[0]).toContain('uses 2 colors')
  })

  it('ignores paint inside clipPath and mask, which never renders as a color', () => {
    const svg = svgWith(
      '<defs><clipPath id="c"><rect width="16" height="16" fill="white"/></clipPath></defs>' +
        '<mask id="m"><rect width="16" height="16" fill="#FFFFFF"/></mask>' +
        '<g clip-path="url(#c)"><path d="M2 2H14V14H2Z" fill="#131313"/></g>',
    )
    expect(validateSvg(svg, icons)).toEqual([])
  })

  it('still counts gradient stop colors inside defs', () => {
    const svg = svgWith(
      '<defs><linearGradient id="g"><stop stop-color="#FF37C7"/><stop stop-color="#131313"/></linearGradient></defs>' +
        '<path d="M2 2H14V14H2Z" fill="url(#g)"/>',
    )
    expect(validateSvg(svg, icons)[0]).toContain('uses 2 colors (#131313, #ff37c7)')
  })

  it('treats short and long hex of the same color as one color', () => {
    const svg = svgWith(
      '<path d="M0 0H16" fill="#000"/><path d="M0 8H16" fill="#000000"/><path d="M0 4H16" stroke="#000"/>',
    )
    expect(validateSvg(svg, icons)).toEqual([])
    expect(
      validateSvg(svgWith('<path d="M0 0H16" fill="#abc"/><path d="M0 8H16" fill="#aabbcd"/>'), icons)[0],
    ).toContain('uses 2 colors (#aabbcc, #aabbcd)')
  })

  it('rejects forbidden tags regardless of case or namespace prefix', () => {
    const inner = '<path d="M0 0H16" fill="#131313"/>'
    expect(validateSvg(svgWith(`${inner}<SCRIPT>alert(1)</SCRIPT>`), icons)[0]).toContain('contains <script>')
    expect(validateSvg(svgWith(`${inner}<svg:script>alert(1)</svg:script>`), icons)[0]).toContain('contains <script>')
  })

  it('rejects event handler attributes on any element', () => {
    const svg = svgWith('<path d="M0 0H16" fill="#131313" onclick="alert(1)" onLoad="x()"/>')
    expect(validateSvg(svg, icons)).toEqual([
      'has event handler attributes (onLoad, onclick). Remove them; icons carry no scripts.',
    ])
  })

  it('rejects hrefs that leave the document but allows same-document fragments', () => {
    const external = svgWith(
      '<a href="javascript:alert(1)"><path d="M0 0H16" fill="#131313"/></a><use xlink:href="https://evil.example/x.svg#i"/>',
    )
    expect(validateSvg(external, icons)).toEqual([
      'references outside the file (https://evil.example/x.svg#i, javascript:alert(1)). Only same-document #fragment references are allowed.',
    ])
    const fragment = svgWith('<defs><path id="p" d="M0 0H16" fill="#131313"/></defs><use href="#p"/>')
    expect(validateSvg(fragment, icons)).toEqual([])
  })

  it('rejects hrefs set through animation elements', () => {
    const svg = svgWith(
      '<a href="#x"><path d="M0 0H16" fill="#131313"/><set attributeName="href" to="javascript:alert(1)"/></a>' +
        '<animate attributeName="xlink:href" to="https://evil.example"/>',
    )
    expect(validateSvg(svg, icons)).toEqual([
      'animates an href (<animate attributeName="xlink:href">, <set attributeName="href">). Remove it; icons carry no scripts.',
    ])
  })

  it('rejects url() paint that points outside the document but allows url(#fragment)', () => {
    const external = svgWith(
      '<path d="M0 0H16" fill="url(https://evil.example/p.svg#g)"/><path d="M0 8H16" style="fill: url(\'//cdn.example/x\')"/>',
    )
    expect(validateSvg(external, icons)).toEqual([
      'references outside the file (//cdn.example/x, https://evil.example/p.svg#g). Only same-document #fragment references are allowed.',
    ])
    const local = svgWith(
      '<defs><linearGradient id="g"><stop stop-color="#131313"/></linearGradient><clipPath id="c"><rect width="16" height="16"/></clipPath></defs>' +
        '<path d="M0 0H16" fill="url(#g)" clip-path="url(#c)"/>',
    )
    expect(validateSvg(local, icons)).toEqual([])
  })

  it('allows multiple colors for logos', () => {
    const svg = svgWith('<path d="M0 0H16" fill="#FF37C7"/><path d="M0 8H16" fill="#131313"/>')
    expect(validateSvg(svg, { target: 'logos' })).toEqual([])
  })

  it('rejects sub-pixel stray paths unless allowed', () => {
    // Three specks like the ones a Figma frame export leaves at the bottom of a 16px icon.
    const specks = [
      'M8.38714 15.173L8.39514 15.1716L8.4058 15.1836L8.41714 15.4683L8.33714 15.5396L8.2498 15.4903L8.25114 15.183Z',
      'M8.5618 15.0976L8.57114 15.0963L8.60714 15.5203L8.45114 15.4736L8.43047 15.1736Z',
      'M8.08467 15.096L8.21714 15.159L8.2138 15.4603L8.07114 15.535L8.07247 15.111Z',
    ]
      .map((d) => `<path d="${d}" fill="#131313"/>`)
      .join('')
    const svg = svgWith(`${specks}<path d="M2 2H14V14H2Z" fill="#131313"/>`)
    expect(validateSvg(svg, icons)).toEqual([
      'has 3 stray paths under 1px (likely export artifacts). Strip them or pass --allow-tiny-paths.',
    ])
    expect(validateSvg(svg, { ...icons, allowTinyPaths: true })).toEqual([])
  })
})

describe('pathBBox', () => {
  it('handles absolute and relative commands', () => {
    expect(pathBBox('M2 2H14V14H2Z')).toEqual({ width: 12, height: 12 })
    expect(pathBBox('m2 2h12v12h-12z')).toEqual({ width: 12, height: 12 })
    expect(pathBBox('M0 0 C 4 4, 8 8, 12 0 s 4 4 4 0')).toEqual({ width: 16, height: 8 })
    expect(pathBBox('M0 0 A 5 5 0 0 1 10 0')).toEqual({ width: 10, height: 0 })
  })

  it('handles compact Figma syntax with implicit repeats and negative numbers', () => {
    expect(pathBBox('M1-1L3-3-5 5')).toEqual({ width: 8, height: 8 })
    expect(pathBBox('M.5.5L1.5 1.5')).toEqual({ width: 1, height: 1 })
  })

  it('returns null for unparseable data', () => {
    expect(pathBBox('')).toBeNull()
    expect(pathBBox('12 34')).toBeNull()
    expect(pathBBox('M0 0 X 1 1')).toBeNull()
  })
})

describe('targetDirs', () => {
  it('covers both generators for icons and only ui for logos', () => {
    expect(targetDirs('/repo', 'icons')).toEqual(DIRS)
    expect(targetDirs('/repo', 'logos')).toEqual({
      svgDir: '/repo/packages/ui/src/assets/logos/svg',
      componentDirs: ['/repo/packages/ui/src/components/logos'],
    })
  })
})

describe('replacements', () => {
  it('lists the paths a name would overwrite across the SVG and both component dirs', () => {
    const [ui, mycelium] = DIRS.componentDirs
    const existing = new Set([`${DIRS.svgDir}/coin.svg`, `${mycelium}/Coin.tsx`])
    expect(existingPathsFor('coin', DIRS, (path) => existing.has(path))).toEqual([
      `${DIRS.svgDir}/coin.svg`,
      `${mycelium}/Coin.tsx`,
    ])
    expect(existingPathsFor('robot', DIRS, (path) => existing.has(path))).toEqual([])
    expect(ui).toBeDefined()
  })

  it('finds which files in a batch are replacements, in batch order', () => {
    const existing = new Set([`${DIRS.svgDir}/coin.svg`, `${DIRS.componentDirs[0]}/Tag.tsx`])
    const files = [
      { name: 'robot', svg: GOOD_SVG },
      { name: 'tag', svg: GOOD_SVG },
      { name: 'coin', svg: GOOD_SVG },
    ]
    expect(findReplacements(files, DIRS, (path) => existing.has(path))).toEqual(['tag', 'coin'])
  })

  it('removes the generated components of replaced names so the generators regenerate them', () => {
    const root = mkdtempSync(join(tmpdir(), 'add-icons-'))
    try {
      const dirs = targetDirs(root, 'icons')
      for (const dir of [dirs.svgDir, ...dirs.componentDirs]) {
        mkdirSync(dir, { recursive: true })
      }
      for (const dir of dirs.componentDirs) {
        writeFileSync(join(dir, 'Coin.tsx'), 'stale')
        writeFileSync(join(dir, 'Tag.tsx'), 'keep')
      }
      const removed = removeGeneratedComponents(['coin', 'robot'], dirs)
      expect(removed).toEqual(dirs.componentDirs.map((dir) => join(dir, 'Coin.tsx')))
      for (const dir of dirs.componentDirs) {
        expect(existsSync(join(dir, 'Coin.tsx'))).toBe(false)
        expect(existsSync(join(dir, 'Tag.tsx'))).toBe(true)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
