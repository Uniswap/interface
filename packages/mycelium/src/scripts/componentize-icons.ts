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
// Consumes the SAME SVG sources (packages/ui/src/assets/icons) and generates
// .tsx components into src/components/icons under the SAME export names, but
// emits plain DOM <svg> elements instead of react-native-svg components.
// Re-exports hand-written icons in components/icons without a matching SVG
// (does not create or overwrite hand-written .tsx files).

// Types

interface DirectoryPair {
  input: string
  output: string
}

// Known SVG tags → DOM JSX tag names. Mostly identity (DOM svg tags are used
// as-is in JSX); the kebab-case gradient keys are kept for safety in case a
// future cheerio upgrade ever serializes those tags in kebab-case form.
const TAG_MAP: Record<string, string> = {
  svg: 'svg',
  circle: 'circle',
  ellipse: 'ellipse',
  g: 'g',
  linearGradient: 'linearGradient',
  radialGradient: 'radialGradient',
  'linear-gradient': 'linearGradient',
  'radial-gradient': 'radialGradient',
  path: 'path',
  line: 'line',
  polygon: 'polygon',
  polyline: 'polyline',
  rect: 'rect',
  symbol: 'symbol',
  text: 'text',
  use: 'use',
  defs: 'defs',
  stop: 'stop',
  clipPath: 'clipPath',
  mask: 'mask',
  filter: 'filter',
  feBlend: 'feBlend',
  feFlood: 'feFlood',
  feGaussianBlur: 'feGaussianBlur',
}

// Main Loop

async function run(): Promise<void> {
  const args = process.argv.slice(2)
  const skipExisting = args.includes('--skip-existing')
  const silent = args.includes('--silent')
  const srcDir = join(__dirname, '..')
  // Same SVG sources as the legacy generator — the icon set has a single source of truth.
  const uiAssetsDir = join(srcDir, '..', '..', 'ui', 'src', 'assets')

  const svgDirPairs: DirectoryPair[] = [
    {
      input: join(uiAssetsDir, 'icons'),
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
  // Capture first explicit fill color before we rewrite all fills to currentColor.
  const defaultFill = rawSerialized.match(/fill="(#[a-z0-9]+)"/i)?.[1]

  const parsedSvgToReact = rawSerialized
    .replace(/ class="[^"]+"/g, '')
    .replace(/ version="[^"]+"/g, '')
    .replace(/width="[0-9]+"/, '')
    .replace(/height="[0-9]+"/, '')
    .replace(/<(\/?)([a-zA-Z-]+)(?=[\s>/])/g, (m, slash, tag) => {
      const mapped = TAG_MAP[tag as string]
      if (!mapped) {
        throw new Error(`Unknown SVG tag <${tag}> in ${fileName} — add it to TAG_MAP`)
      }
      return `<${slash}${mapped}`
    })
    .replace(/px/g, '')
    .replace(/style="mask-type:luminance"/g, "style={{ maskType: 'luminance' }}")
    .replace(/fill="(#[a-z0-9]+)"/gi, 'fill="currentColor"')
    .replace(/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/g, '')
    .replace(/xlink:href/g, 'xlinkHref')

  return `
import { createIcon } from '../factories/createIcon'

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
