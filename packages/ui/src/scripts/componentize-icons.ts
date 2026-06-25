/* oxlint-disable no-console -- misc script, so it's okay */
/* oxlint-disable typescript/no-explicit-any -- misc script, so it's okay */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path, { join } from 'node:path'
import camelcase from 'camelcase'
import { load } from 'cheerio'
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error
import uppercamelcase from 'uppercamelcase'

// Generates .tsx from src/assets/icons/*.svg and re-exports hand-written icons in components/icons
// without a matching SVG (does not create or overwrite hand-written .tsx files).

// Types

interface DirectoryPair {
  input: string
  output: string
}

const TAG_MAP: Record<string, string> = {
  svg: 'Svg',
  circle: 'Circle',
  ellipse: 'Ellipse',
  g: 'G',
  // Source SVGs use the camelCase form. The kebab-case keys are kept for safety in case
  // a future cheerio upgrade ever serializes these tags in kebab-case form.
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
}

// Main Loop

async function run(): Promise<void> {
  const args = process.argv.slice(2)
  const skipExisting = args.includes('--skip-existing')
  const silent = args.includes('--silent')
  const srcDir = join(__dirname, '..')
  const assetsDir = join(srcDir, 'assets')

  const svgDirPairs: DirectoryPair[] = [
    {
      input: join(assetsDir, 'icons'),
      output: join(srcDir, 'components', 'icons'),
    },
    {
      input: join(assetsDir, 'logos', 'svg'),
      output: join(srcDir, 'components', 'logos'),
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
      const outputPath = path.join(dirs.output, `${className}.tsx`)

      if (skipExisting && existsSync(outputPath)) {
        return
      }

      const inputPath = join(dirs.input, fileName)
      const svg = await readFile(inputPath, 'utf-8')
      const element = generateSVGComponentString(svg, fileName)
      if (element) {
        if (!silent) {
          console.log(`🦄 ${fileName}`)
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

  // Because CSS does not exist on Native platforms
  // We need to duplicate the styles applied to the
  // SVG to its children
  // oxlint-disable-next-line typescript/no-non-null-assertion -- SVG element is guaranteed to exist after cheerio parsing
  const svgAttribs = $('svg')[0]!.attribs
  delete svgAttribs['xmlns']
  // oxlint-disable-next-line typescript/no-explicit-any -- biome-parity: oxlint is stricter here
  const attribsOfInterest: Record<string, any> = {}

  for (const key of Object.keys(svgAttribs)) {
    if (!['height', 'width', 'viewBox', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].includes(key)) {
      attribsOfInterest[key] = svgAttribs[key]
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any -- biome-parity: oxlint is stricter here
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

  // Track which react-native-svg components actually appear in the output so we can emit
  // a tight import list. Without this, format:generated needs 3 oxlint passes just to
  // prune the kitchen-sink import block — emitting only-used imports lets us drop it.
  const usedComponents = new Set<string>()

  const parsedSvgToReact = rawSerialized
    .replace(/ class="[^"]+"/g, '')
    .replace(/ version="[^"]+"/g, '')
    .replace(/width="[0-9]+"/, '')
    .replace(/height="[0-9]+"/, '')
    .replace(/<(\/?)([a-zA-Z-]+)(?=[\s>/])/g, (m, slash, tag) => {
      const mapped = TAG_MAP[tag]
      if (!mapped) {
        return m
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
import {
${importList}
} from 'react-native-svg'

// oxlint-disable-next-line universe-custom/no-relative-import-paths
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
