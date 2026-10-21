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

// Generates .tsx from packages/mycelium/src/assets/icons/*.svg and re-exports hand-written icons in components/icons
// without a matching SVG (does not create or overwrite hand-written .tsx files). Logos whose solid colors would be
// flattened are skipped, so the SVG stays usable as an image without generating a broken component.

// Types

interface DirectoryPair {
  input: string
  output: string
  skipMultiColor: boolean
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
  const assetsDir = join(srcDir, '..', '..', 'mycelium', 'src', 'assets')

  const svgDirPairs: DirectoryPair[] = [
    {
      input: join(assetsDir, 'icons'),
      output: join(srcDir, 'components', 'icons'),
      skipMultiColor: false,
    },
    {
      input: join(assetsDir, 'logos', 'svg'),
      output: join(srcDir, 'components', 'logos'),
      skipMultiColor: true,
    },
  ]

  await Promise.all(svgDirPairs.map((dirPair) => createSVGComponents(dirPair, skipExisting, silent)))
}

// Logic Functions

async function createSVGComponents(dirs: DirectoryPair, skipExisting: boolean, silent: boolean): Promise<void> {
  // Ensure output directory exists
  await mkdir(dirs.output, { recursive: true })

  const svgFileNames = (await readdir(dirs.input)).filter((name: string) => name.endsWith('.svg')).sort()
  const svgs = new Map(
    await Promise.all(
      svgFileNames.map(async (fileName) => [fileName, await readFile(join(dirs.input, fileName), 'utf-8')] as const),
    ),
  )
  const fileNames = svgFileNames.filter((fileName) => {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- every listed file was read above
    const colors = flattenedColors(svgs.get(fileName)!)
    if (dirs.skipMultiColor && colors.length > 1) {
      if (!silent) {
        console.log(`⏭️  ${fileName}: skipped, would flatten ${colors.join(', ')} into one color`)
      }
      return false
    }
    return true
  })

  // Parse + write every SVG in parallel; libuv handles the disk fanout fine for a few hundred files.
  await Promise.all(
    fileNames.map(async (fileName) => {
      const className = generateClassName(fileName)
      const outputPath = path.join(dirs.output, `${className}.tsx`)

      if (skipExisting && existsSync(outputPath)) {
        return
      }

      // oxlint-disable-next-line typescript/no-non-null-assertion -- every listed file was read above
      const element = generateSVGComponentString(svgs.get(fileName)!, fileName)
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
  // Quirks below (first-hex defaultFill, non-global width/height strip, global /px/g)
  // are byte-parity-coupled with packages/mycelium/src/scripts/componentize-icons.ts —
  // change both together or the icons path-data parity suite goes red.
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

/**
 * Distinct solid colors the generator rewrites to `currentColor`: every hex `fill` and every `stroke`.
 * Gradient stops are left alone, so a logo whose color lives in gradients plus one solid fill still
 * renders correctly (e.g. google-chrome-logo).
 */
function flattenedColors(svg: string): string[] {
  const colors = new Set<string>()
  for (const [, attribute = '', value = ''] of svg.matchAll(/\b(fill|stroke)="([^"]+)"/gi)) {
    const color = value.trim().toLowerCase()
    const isHexFill = attribute.toLowerCase() === 'fill' && /^#[0-9a-f]+$/.test(color)
    const isPaintedStroke =
      attribute.toLowerCase() === 'stroke' && !['none', 'currentcolor', 'transparent'].includes(color)
    if (isHexFill || isPaintedStroke) {
      colors.add(expandHex(color))
    }
  }
  return [...colors].sort()
}

/** `#abc` and `#aabbcc` are the same color. */
function expandHex(color: string): string {
  return /^#[0-9a-f]{3}$/.test(color) ? `#${[...color.slice(1)].map((c) => c + c).join('')}` : color
}

function generateClassName(fileName: string): string {
  return uppercamelcase(path.basename(fileName, '.svg')) as string
}

// This must be at the end to run all code

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
