/**
 * Validates SVGs for `packages/ui/src/assets/{icons,logos/svg}` and copies them in.
 *
 *   bun scripts/add-icons.ts [--target icons|logos] [--check] [--replace] [--allow-tiny-paths] [--repo <checkout>] <files.svg...>
 *
 * `--check` validates only. `--replace` lets a file overwrite an icon of the same name and
 * removes that icon's generated components so `--skip-existing` regenerates them. Without it, files that pass are written into the target
 * directory of `--repo`, which defaults to the checkout this script lives in; the skill
 * points it at a fresh worktree of `origin/main`. The `/add-icons` skill drives the rest
 * (generators, commit, PR); this only guards the generator's input, so every rejection here
 * is something the generator would otherwise do silently: flatten a second color, overwrite
 * an existing icon in ui and mycelium, or ship invisible geometry.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { load } from 'cheerio'

export type IconTarget = 'icons' | 'logos'

export interface IconFile {
  readonly name: string
  readonly svg: string
}

export interface ValidationIssue {
  /** File stem the issue is about, or `(batch)` for batch-level issues. */
  readonly name: string
  readonly message: string
}

export interface TargetDirs {
  /** Where the SVG source lands. */
  readonly svgDir: string
  /** Every directory a generator writes `<Component>.tsx` into for this target. */
  readonly componentDirs: readonly string[]
}

export interface ValidateOptions {
  readonly target: IconTarget
  readonly dirs: TargetDirs
  readonly allowTinyPaths?: boolean
  /** Treat a name that already exists as a deliberate replacement instead of a collision. */
  readonly replace?: boolean
  readonly exists?: (path: string) => boolean
}

export const ICON_TARGETS: readonly IconTarget[] = ['icons', 'logos']
export const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** A path whose bounding box is under this in both axes is an export artifact, not a detail. */
export const TINY_PATH_UNITS = 1

const FORBIDDEN_TAGS = ['script', 'style', 'image', 'foreignObject'] as const
/**
 * Paint inside these is a shape or luminance value, never a rendered color, so it does not count
 * toward the one-color rule. `defs` is not listed: gradient stop colors inside it do render.
 */
const NON_PAINTING_CONTAINERS = ['clipPath', 'mask'] as const
const COLOR_ATTRIBUTES = ['fill', 'stroke', 'stop-color'] as const
const IGNORED_COLOR_VALUES = new Set(['none', 'currentcolor', 'transparent', 'inherit'])
const HREF_ATTRIBUTES = ['href', 'xlink:href'] as const

export function targetDirs(repoRoot: string, target: IconTarget): TargetDirs {
  const ui = join(repoRoot, 'packages', 'ui', 'src')
  if (target === 'logos') {
    return {
      svgDir: join(ui, 'assets', 'logos', 'svg'),
      componentDirs: [join(ui, 'components', 'logos')],
    }
  }
  return {
    svgDir: join(ui, 'assets', 'icons'),
    componentDirs: [
      join(ui, 'components', 'icons'),
      join(repoRoot, 'packages', 'mycelium', 'src', 'components', 'icons'),
    ],
  }
}

/** Mirrors `uppercamelcase` as the generators apply it to the file stem. */
export function toComponentName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function iconFileFromPath(path: string): IconFile {
  return { name: basename(path).replace(/\.svg$/i, ''), svg: readFileSync(path, 'utf8') }
}

/** Paths a file of this name would overwrite: its SVG and the component each generator emits. */
export function existingPathsFor(
  name: string,
  dirs: TargetDirs,
  exists: (path: string) => boolean = existsSync,
): string[] {
  const component = toComponentName(name)
  return [join(dirs.svgDir, `${name}.svg`), ...dirs.componentDirs.map((dir) => join(dir, `${component}.tsx`))].filter(
    exists,
  )
}

/** Names in the batch that already exist in the target, in batch order. */
export function findReplacements(
  files: readonly IconFile[],
  dirs: TargetDirs,
  exists: (path: string) => boolean = existsSync,
): string[] {
  return files.filter((file) => existingPathsFor(file.name, dirs, exists).length > 0).map((file) => file.name)
}

export function validateBatch(files: readonly IconFile[], options: ValidateOptions): ValidationIssue[] {
  const exists = options.exists ?? existsSync
  const issues: ValidationIssue[] = []

  if (files.length === 0) {
    issues.push({ name: '(batch)', message: 'no files given.' })
    return issues
  }

  const byComponent = new Map<string, string[]>()
  for (const file of files) {
    const component = toComponentName(file.name)
    byComponent.set(component, [...(byComponent.get(component) ?? []), file.name])
  }
  for (const [component, names] of byComponent) {
    if (names.length > 1) {
      const unique = [...new Set(names)]
      const message =
        unique.length === 1
          ? `appears ${names.length} times in the batch.`
          : `${unique.join(' and ')} both generate ${component}; one would overwrite the other. Rename one.`
      issues.push({ name: unique[0] ?? component, message })
    }
  }

  for (const file of files) {
    if (!NAME_RE.test(file.name)) {
      issues.push({ name: file.name, message: 'name must be kebab-case (a-z, 0-9, -). Rename the file.' })
    } else if (!options.replace && existingPathsFor(file.name, options.dirs, exists).length > 0) {
      issues.push({
        name: file.name,
        message: `already exists as ${toComponentName(file.name)}. Pick another name, or pass --replace to overwrite it.`,
      })
    }

    for (const message of validateSvg(file.svg, options)) {
      issues.push({ name: file.name, message })
    }
  }

  return issues
}

/** Rules for one SVG's markup. Name and collision rules live in `validateBatch`. */
export function validateSvg(svg: string, options: Pick<ValidateOptions, 'target' | 'allowTinyPaths'>): string[] {
  const messages: string[] = []
  const $ = load(svg, { xmlMode: true })
  const roots = $.root().children().toArray()
  const root = roots[0]

  if (roots.length !== 1 || !root || root.type !== 'tag' || root.name !== 'svg') {
    return ['not a parseable SVG: expected a single <svg> root element.']
  }

  if (!root.attribs['viewBox']) {
    messages.push('missing viewBox. The generated component needs it to scale; re-export with "Include viewBox".')
  }

  const forbiddenSeen = new Set<(typeof FORBIDDEN_TAGS)[number]>()
  const eventAttributes = new Set<string>()
  const externalHrefs = new Set<string>()
  const animatedHrefs = new Set<string>()
  for (const el of $('*').toArray()) {
    if (el.type !== 'tag') {
      continue
    }
    const forbidden = FORBIDDEN_TAGS.find((tag) => tag.toLowerCase() === localName(el.name))
    if (forbidden) {
      forbiddenSeen.add(forbidden)
    }
    for (const [attribute, value] of Object.entries(el.attribs)) {
      if (/^on/i.test(attribute)) {
        eventAttributes.add(attribute)
      }
      if (HREF_ATTRIBUTES.some((href) => href === attribute.toLowerCase()) && !value.trim().startsWith('#')) {
        externalHrefs.add(value.trim())
      }
      if (
        attribute.toLowerCase() === 'attributename' &&
        HREF_ATTRIBUTES.some((href) => href === value.trim().toLowerCase())
      ) {
        animatedHrefs.add(`<${localName(el.name)} attributeName="${value.trim()}">`)
      }
      for (const reference of paintReferences(attribute, value)) {
        if (!reference.startsWith('#')) {
          externalHrefs.add(reference)
        }
      }
    }
  }
  for (const tag of FORBIDDEN_TAGS) {
    if (forbiddenSeen.has(tag)) {
      messages.push(`contains <${tag}>. ${FORBIDDEN_TAG_HINTS[tag]}`)
    }
  }
  if (eventAttributes.size > 0) {
    messages.push(
      `has event handler attributes (${[...eventAttributes].sort().join(', ')}). Remove them; icons carry no scripts.`,
    )
  }
  if (externalHrefs.size > 0) {
    messages.push(
      `references outside the file (${[...externalHrefs].sort().join(', ')}). Only same-document #fragment references are allowed.`,
    )
  }
  if (animatedHrefs.size > 0) {
    messages.push(`animates an href (${[...animatedHrefs].sort().join(', ')}). Remove it; icons carry no scripts.`)
  }

  if (options.target === 'icons') {
    const colors = collectColors($)
    if (colors.length > 1) {
      messages.push(
        `uses ${colors.length} colors (${colors.join(', ')}). Icons flatten to one color; export a single-color version, or use --target logos.`,
      )
    }
  }

  if (!options.allowTinyPaths) {
    const tiny = $('path')
      .toArray()
      .map((el) => el.attribs['d'])
      .filter((d): d is string => typeof d === 'string')
      .map(pathBBox)
      .filter((box) => box !== null && box.width < TINY_PATH_UNITS && box.height < TINY_PATH_UNITS).length
    if (tiny > 0) {
      messages.push(
        `has ${tiny} stray path${tiny === 1 ? '' : 's'} under ${TINY_PATH_UNITS}px (likely export artifacts). Strip them or pass --allow-tiny-paths.`,
      )
    }
  }

  return messages
}

const FORBIDDEN_TAG_HINTS: Record<(typeof FORBIDDEN_TAGS)[number], string> = {
  script: 'Scripts are never allowed in icon sources.',
  style: 'The generator drops stylesheets; convert rules to presentation attributes.',
  image: 'Embedded rasters are not allowed in icons; use a vector export.',
  foreignObject: 'foreignObject is not supported by react-native-svg.',
}

/** Targets of `url(...)` in a paint attribute or inline style, unquoted, so `url(#g)` yields `#g`. */
function paintReferences(attribute: string, value: string): string[] {
  const name = attribute.toLowerCase()
  const paints = COLOR_ATTRIBUTES.some((color) => color === name) ? [value] : []
  if (name === 'style') {
    for (const match of value.matchAll(/(?:fill|stroke|stop-color|mask|clip-path|filter)\s*:\s*([^;]+)/gi)) {
      paints.push(match[1] ?? '')
    }
  } else if (name === 'mask' || name === 'clip-path' || name === 'filter') {
    paints.push(value)
  }
  return paints.flatMap((paint) =>
    [...paint.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)].map((m) => (m[1] ?? '').trim()),
  )
}

/** Element name without a namespace prefix, lowercased, so `svg:script` and `SCRIPT` match `script`. */
function localName(name: string): string {
  return (name.split(':').pop() ?? name).toLowerCase()
}

function collectColors($: ReturnType<typeof load>): string[] {
  const colors = new Set<string>()
  const nonPainting = NON_PAINTING_CONTAINERS.map((tag) => tag.toLowerCase())
  for (const el of $('*').toArray()) {
    if (el.type !== 'tag') {
      continue
    }
    if (
      $(el)
        .parents()
        .toArray()
        .some((parent) => parent.type === 'tag' && nonPainting.includes(localName(parent.name)))
    ) {
      continue
    }
    for (const attribute of COLOR_ATTRIBUTES) {
      addColor(colors, el.attribs[attribute])
    }
    const style = el.attribs['style']
    if (style) {
      for (const match of style.matchAll(/(?:fill|stroke|stop-color)\s*:\s*([^;]+)/g)) {
        addColor(colors, match[1])
      }
    }
  }
  return [...colors].sort()
}

function addColor(colors: Set<string>, raw: string | undefined): void {
  if (!raw) {
    return
  }
  const value = raw.trim().toLowerCase()
  if (IGNORED_COLOR_VALUES.has(value) || value.startsWith('url(')) {
    return
  }
  colors.add(normalizeHex(value))
}

/** `#abc` and `#aabbcc` are the same color; `#rgba` shorthand expands the same way. */
function normalizeHex(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/.exec(value)
  if (!short) {
    return value
  }
  const [, r, g, b, a] = short
  return `#${r}${r}${g}${g}${b}${b}${a ? `${a}${a}` : ''}`
}

/**
 * Bounding box of a path's control and end points, absolute and relative commands alike.
 * Control points make the box an upper bound, which is what the tiny-path rule needs.
 */
export function pathBBox(d: string): { width: number; height: number } | null {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g)
  if (!tokens) {
    return null
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  let command = ''
  let index = 0

  const visit = (px: number, py: number): void => {
    minX = Math.min(minX, px)
    minY = Math.min(minY, py)
    maxX = Math.max(maxX, px)
    maxY = Math.max(maxY, py)
  }
  const next = (): number => Number(tokens[index++])

  while (index < tokens.length) {
    const token = tokens[index] ?? ''
    if (/^[a-zA-Z]$/.test(token)) {
      command = token
      index++
      if (command === 'z' || command === 'Z') {
        x = startX
        y = startY
        continue
      }
    }
    if (!command) {
      return null
    }
    const relative = command === command.toLowerCase()
    const upper = command.toUpperCase()
    const ox = relative ? x : 0
    const oy = relative ? y : 0

    switch (upper) {
      case 'M':
      case 'L':
      case 'T': {
        x = ox + next()
        y = oy + next()
        visit(x, y)
        if (upper === 'M') {
          startX = x
          startY = y
          command = relative ? 'l' : 'L'
        }
        break
      }
      case 'H': {
        x = ox + next()
        visit(x, y)
        break
      }
      case 'V': {
        y = oy + next()
        visit(x, y)
        break
      }
      case 'C': {
        visit(ox + next(), oy + next())
        visit(ox + next(), oy + next())
        x = ox + next()
        y = oy + next()
        visit(x, y)
        break
      }
      case 'S':
      case 'Q': {
        visit(ox + next(), oy + next())
        x = ox + next()
        y = oy + next()
        visit(x, y)
        break
      }
      case 'A': {
        index += 5
        x = ox + next()
        y = oy + next()
        visit(x, y)
        break
      }
      default:
        return null
    }
  }

  if (!Number.isFinite(minX)) {
    return null
  }
  return { width: maxX - minX, height: maxY - minY }
}

export function writeBatch(files: readonly IconFile[], dirs: TargetDirs): string[] {
  return files.map((file) => {
    const path = join(dirs.svgDir, `${file.name}.svg`)
    writeFileSync(path, file.svg.endsWith('\n') ? file.svg : `${file.svg}\n`, 'utf8')
    return path
  })
}

/**
 * The generators run with `--skip-existing`, so a replaced SVG would keep its stale
 * components unless they are removed first. Returns the paths removed.
 */
export function removeGeneratedComponents(names: readonly string[], dirs: TargetDirs): string[] {
  const removed: string[] = []
  for (const name of names) {
    for (const dir of dirs.componentDirs) {
      const path = join(dir, `${toComponentName(name)}.tsx`)
      if (existsSync(path)) {
        unlinkSync(path)
        removed.push(path)
      }
    }
  }
  return removed
}

export function formatIssues(issues: readonly ValidationIssue[]): string {
  const width = Math.max(...issues.map((issue) => issue.name.length))
  return issues.map((issue) => `  ${issue.name.padEnd(width)}  ${issue.message}`).join('\n')
}

// CLI

interface ParsedArgs {
  readonly target: IconTarget
  readonly check: boolean
  readonly replace: boolean
  readonly allowTinyPaths: boolean
  readonly repo: string
  readonly files: readonly string[]
}

const USAGE =
  'usage: bun scripts/add-icons.ts [--target icons|logos] [--check] [--replace] [--allow-tiny-paths] [--repo <checkout>] <files.svg...>'

function parseArgs(argv: readonly string[]): ParsedArgs {
  let target: IconTarget = 'icons'
  let check = false
  let replace = false
  let allowTinyPaths = false
  let repo = join(import.meta.dir, '..')
  const files: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    if (arg === '--target') {
      const value = argv[++i]
      if (!ICON_TARGETS.includes(value as IconTarget)) {
        throw new Error(`--target must be one of ${ICON_TARGETS.join(', ')}\n${USAGE}`)
      }
      target = value as IconTarget
    } else if (arg === '--check') {
      check = true
    } else if (arg === '--replace') {
      replace = true
    } else if (arg === '--allow-tiny-paths') {
      allowTinyPaths = true
    } else if (arg === '--repo') {
      const value = argv[++i]
      if (!value || !existsSync(join(value, 'packages', 'ui', 'src', 'assets'))) {
        throw new Error(`--repo must point at a universe checkout, got '${value ?? ''}'\n${USAGE}`)
      }
      repo = value
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown flag ${arg}\n${USAGE}`)
    } else {
      files.push(arg)
    }
  }
  return { target, check, replace, allowTinyPaths, repo, files }
}

function run(args: ParsedArgs): void {
  const files = args.files.map(iconFileFromPath)
  const dirs = targetDirs(args.repo, args.target)
  const issues = validateBatch(files, {
    target: args.target,
    dirs,
    allowTinyPaths: args.allowTinyPaths,
    replace: args.replace,
  })

  if (issues.length > 0) {
    const rejected = new Set(issues.filter((issue) => issue.name !== '(batch)').map((issue) => issue.name)).size
    console.error(formatIssues(issues))
    console.error(
      files.length === 0
        ? `\nNothing to do.\n${USAGE}`
        : `\n${rejected} of ${files.length} file${files.length === 1 ? '' : 's'} rejected. Nothing written.`,
    )
    process.exit(1)
  }

  const replacements = new Set(args.replace ? findReplacements(files, dirs) : [])
  const width = Math.max(...files.map((file) => file.name.length))
  for (const file of files) {
    const component = toComponentName(file.name)
    const note = replacements.has(file.name) ? `replaces existing ${component}` : `-> ${component}`
    console.log(`  ${file.name.padEnd(width)}  ok  ${note}`)
  }
  if (args.check) {
    return
  }
  for (const path of removeGeneratedComponents([...replacements], dirs)) {
    console.log(`removed ${path}`)
  }
  for (const path of writeBatch(files, dirs)) {
    console.log(`wrote ${path}`)
  }
}

if (import.meta.main) {
  try {
    run(parseArgs(process.argv.slice(2)))
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
