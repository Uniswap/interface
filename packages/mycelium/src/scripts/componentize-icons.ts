/* oxlint-disable no-console -- misc script, so it's okay */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path, { join } from 'node:path'
import camelcase from 'camelcase'
import { load } from 'cheerio'
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error
import uppercamelcase from 'uppercamelcase'
import { assertNotHandwritten } from './handwritten-icons'

// Plain-React port of packages/ui/src/scripts/componentize-icons.ts (INFRA-2956).
// Consumes the SAME SVG sources (src/assets/icons) and generates
// .tsx components into src/components/icons under the SAME export names, but
// emits platform-agnostic markup: capitalized host components imported from
// `../factories/svg-elements`, whose platform split (DOM tags on web,
// react-native-svg on device — INFRA-3508) rides the generated file's
// extensionless import instead of per-icon `.native.tsx` twins (the
// `./icons/*` exports map resolves exact base files, so per-icon twins would
// never be picked up). Re-exports hand-written icons in components/icons
// without a matching SVG (does not create or overwrite hand-written .tsx
// files).

// Types

interface DirectoryPair {
  input: string
  output: string
}

// Known SVG tags → `svg-elements` host component names (react-native-svg's
// naming; the base leg maps them back to DOM tags). The kebab-case gradient
// keys are kept for safety in case a future cheerio upgrade ever serializes
// those tags in kebab-case form. Keep in lockstep with the export set of
// `src/components/factories/svg-elements.ts` / `.native.ts`.
const TAG_MAP: Record<string, string> = {
  svg: 'Svg',
  circle: 'Circle',
  ellipse: 'Ellipse',
  g: 'G',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  'linear-gradient': 'LinearGradient',
  'radial-gradient': 'RadialGradient',
  path: 'Path',
  line: 'Line',
  polygon: 'Polygon',
  polyline: 'Polyline',
  rect: 'Rect',
  symbol: 'Symbol',
  text: 'Text',
  use: 'Use',
  defs: 'Defs',
  stop: 'Stop',
  clipPath: 'ClipPath',
  mask: 'Mask',
  filter: 'Filter',
  feBlend: 'FeBlend',
  feFlood: 'FeFlood',
  feGaussianBlur: 'FeGaussianBlur',
}

// Main Loop

async function run(): Promise<void> {
  const args = process.argv.slice(2)
  const skipExisting = args.includes('--skip-existing')
  const silent = args.includes('--silent')
  const srcDir = join(__dirname, '..')
  // Same SVG sources as the legacy generator — the icon set has a single source of truth.
  const assetsDir = join(srcDir, 'assets')

  const svgDirPairs: DirectoryPair[] = [
    {
      input: join(assetsDir, 'icons'),
      output: join(srcDir, 'components', 'icons'),
    },
  ]

  await Promise.all(svgDirPairs.map((dirPair) => createSVGComponents(dirPair, skipExisting, silent)))
}

// Logic Functions

async function createSVGComponents(dirs: DirectoryPair, skipExisting: boolean, silent: boolean): Promise<void> {
  // Ensure output directory exists
  await mkdir(dirs.output, { recursive: true })

  const fileNames = (await readdir(dirs.input)).filter((name: string) => name.endsWith('.svg')).sort()

  // Parse + write every SVG in parallel; libuv handles the disk fanout fine for a few hundred files.
  await Promise.all(
    fileNames.map(async (fileName) => {
      const className = generateClassName(fileName)
      assertNotHandwritten(className, fileName)
      const outputPath = path.join(dirs.output, `${className}.tsx`)

      if (skipExisting && existsSync(outputPath)) {
        return
      }

      const inputPath = join(dirs.input, fileName)
      const svg = await readFile(inputPath, 'utf-8')
      const element = generateSVGComponentString(svg, fileName)
      if (element) {
        if (!silent) {
          console.log(`🍄 ${fileName}`)
        }
        await writeFile(outputPath, element, 'utf-8')
      }
    }),
  )

  // Build the index file from the sorted SVG list so output is deterministic regardless of
  // the order in which the parallel writes above resolved.
  let indexFile = ``
  for (const fileName of fileNames) {
    indexFile += `\nexport * from './${generateClassName(fileName)}'`
  }

  // Also export hand-written components that exist in the output directory
  // but don't have corresponding SVG sources (e.g. multi-color logos)
  const generatedClassNames = new Set(fileNames.map(generateClassName))
  const existingComponents = (await readdir(dirs.output))
    .filter((name: string) => name.endsWith('.tsx'))
    .map((name: string) => path.basename(name, '.tsx'))
    .filter((name: string) => !generatedClassNames.has(name))
    .filter((name: string) => name !== 'index' && name !== 'exported')
    .filter((name: string) => !name.endsWith('.stories'))
    .sort()

  for (const className of existingComponents) {
    indexFile += `\nexport * from './${className}'`
  }

  // Write index file (without formatting)
  if (!silent) {
    console.log('Writing index file...')
  }
  const indexPath = join(dirs.output, 'exported.ts')
  await writeFile(indexPath, indexFile, 'utf-8')
}

// Core SVG File Generation

function generateSVGComponentString(svg: string, fileName: string): string {
  const $ = load(svg, {
    xmlMode: true,
  })

  const className = generateClassName(fileName)

  // Duplicate the styles applied to the SVG to its children — mirrors the
  // legacy generator so the emitted markup (and the parity suite) stays
  // byte-compatible with the ui components.
  // oxlint-disable-next-line typescript/no-non-null-assertion -- SVG element is guaranteed to exist after cheerio parsing
  const svgAttribs = $('svg')[0]!.attribs
  delete svgAttribs['xmlns']
  // Size comes from createIcon via style, and react-native-svg lets a root
  // width/height prop beat style, so a hardcoded root size would pin the icon
  // on device. Stripped here rather than by regex so any unit (24px, 100%) goes.
  delete svgAttribs['width']
  delete svgAttribs['height']
  const attribsOfInterest: Record<string, string> = {}

  for (const key of Object.keys(svgAttribs)) {
    if (!['height', 'width', 'viewBox', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].includes(key)) {
      attribsOfInterest[key] = svgAttribs[key] ?? ''
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any -- cheerio element attribs are untyped, mirrors the legacy generator
  $('*').each((_, el: any) => {
    const a = el.attribs
    for (const k of Object.keys(a)) {
      if (k.includes('-')) {
        a[camelcase(k)] = a[k]
        delete a[k]
      }
      if (k === 'stroke') {
        a[k] = 'currentColor'
      }
    }

    if (el.name === 'svg') {
      a.otherProps = '...'
    } else {
      for (const key of Object.keys(attribsOfInterest)) {
        a[camelcase(key)] = attribsOfInterest[key]
      }
    }
  })

  const rawSerialized = $('svg').toString()
  // Quirks below (first-hex defaultFill, global /px/g)
  // are byte-parity-coupled with packages/ui/src/scripts/componentize-icons.ts —
  // change both together or the icons path-data parity suite goes red.
  // Capture first explicit fill color before we rewrite all fills to currentColor.
  const defaultFill = rawSerialized.match(/fill="(#[a-z0-9]+)"/i)?.[1]

  // Track which host components actually appear in the output so the emitted
  // import list stays tight (the legacy generator's mechanism).
  const usedComponents = new Set<string>()

  const parsedSvgToReact = rawSerialized
    .replace(/ class="[^"]+"/g, '')
    .replace(/ version="[^"]+"/g, '')
    .replace(/<(\/?)([a-zA-Z-]+)(?=[\s>/])/g, (m, slash, tag) => {
      const mapped = TAG_MAP[tag as string]
      if (!mapped) {
        throw new Error(`Unknown SVG tag <${tag}> in ${fileName} — add it to TAG_MAP`)
      }
      usedComponents.add(mapped)
      return `<${slash}${mapped}`
    })
    .replace(/px/g, '')
    .replace(/style="mask-type:luminance"/g, "style={{ maskType: 'luminance' }}")
    .replace(/fill="(#[a-z0-9]+)"/gi, 'fill="currentColor"')
    .replace(/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/g, '')
    .replace(/xlink:href/g, 'xlinkHref')

  const importList = [...usedComponents].sort().join(',\n')

  return `
import { createIcon } from '../factories/createIcon'
import {
${importList}
} from '../factories/svg-elements'

export const [${className}, Animated${className}] = createIcon({
name: '${className}',
getIcon: (props) => (
  ${parsedSvgToReact.replace('otherProps="..."', '{...props}')}
),
${defaultFill ? `defaultFill: '${defaultFill}'` : ''}
})
`
}

// Helpers

function generateClassName(fileName: string): string {
  return uppercamelcase(path.basename(fileName, '.svg')) as string
}

// This must be at the end to run all code

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
