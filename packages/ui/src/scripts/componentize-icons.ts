/* oxlint-disable no-console -- misc script, so it's okay */
/* oxlint-disable typescript/no-explicit-any -- misc script, so it's okay */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path, { join } from 'node:path'
import camelcase from 'camelcase'
import { load } from 'cheerio'
// oxlint-disable-next-line typescript/ban-ts-comment
// @ts-expect-error
import uppercamelcase from 'uppercamelcase'

// Generates .tsx from src/assets/icons/*.svg and re-exports hand-written icons in components/icons
// without a matching SVG (does not create missing .tsx files).

// Types

interface DirectoryPair {
  input: string
  output: string
}

// Main Loop

async function run(): Promise<void> {
  const skipExisting = process.argv.length > 2 && process.argv[2] === '--skip-existing'
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

  for (const dirPair of svgDirPairs) {
    await createSVGComponents(dirPair, skipExisting)
  }
}

// Logic Functions

async function createSVGComponents(dirs: DirectoryPair, skipExisting: boolean): Promise<void> {
  // Ensure output directory exists
  mkdirSync(dirs.output, { recursive: true })

  let indexFile = ``
  const fileNames = readdirSync(dirs.input)
    .filter((name: string) => name.endsWith('.svg'))
    .sort()

  for (const fileName of fileNames) {
    const className = generateClassName(fileName)
    const inputPath = join(dirs.input, fileName)
    const outputPath = path.join(dirs.output, `${className}.tsx`)

    // Add to index file even if it exists
    indexFile += `\nexport * from './${className}'`

    if (skipExisting && existsSync(outputPath)) {
      continue
    }

    // Generate and write file (without formatting)
    const svg = readFileSync(inputPath, 'utf-8')
    const element = generateSVGComponentString(svg, fileName)
    if (element) {
      console.log(`🦄 ${fileName}`)
      writeFileSync(outputPath, element, 'utf-8')
    }
  }

  // Also export hand-written components that exist in the output directory
  // but don't have corresponding SVG sources (e.g. multi-color logos)
  const generatedClassNames = new Set(fileNames.map(generateClassName))
  const existingComponents = readdirSync(dirs.output)
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
  console.log('Writing index file...')
  const indexPath = join(dirs.output, 'exported.ts')
  writeFileSync(indexPath, indexFile, 'utf-8')
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

  Object.keys(svgAttribs).forEach((key) => {
    if (!['height', 'width', 'viewBox', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].includes(key)) {
      attribsOfInterest[key] = svgAttribs[key]
    }
  })

  // oxlint-disable-next-line typescript/no-explicit-any -- biome-parity: oxlint is stricter here
  $('*').each((_, el: any) => {
    Object.keys(el.attribs).forEach((x) => {
      if (x.includes('-')) {
        $(el).attr(camelcase(x), el.attribs[x]).removeAttr(x)
      }
      if (x === 'stroke') {
        $(el).attr(x, 'currentColor')
      }
    })

    // For every element that is NOT svg ...
    if (el.name !== 'svg') {
      Object.keys(attribsOfInterest).forEach((key) => {
        $(el).attr(camelcase(key), attribsOfInterest[key])
      })
    }

    if (el.name === 'svg') {
      $(el).attr('otherProps', '...')
    }
  })

  const parsedSvgToReact = $('svg')
    .toString()
    .replace(/ class="[^"]+"/g, '')
    .replace(/ version="[^"]+"/g, '')
    .replace(/width="[0-9]+"/, '')
    .replace(/height="[0-9]+"/, '')
    .replace('<svg', '<Svg')
    .replace('</svg', '</Svg')
    .replace(/<circle/g, '<Circle')
    .replace(/<\/circle/g, '</Circle')
    .replace(/<ellipse/g, '<Ellipse')
    .replace(/<\/ellipse/g, '</Ellipse')
    .replace(/<g/g, '<G')
    .replace(/<\/g/g, '</G')
    .replace(/<linear-gradient/g, '<LinearGradient')
    .replace(/<\/linear-gradient/g, '</LinearGradient')
    .replace(/<radial-gradient/g, '<RadialGradient')
    .replace(/<\/radial-gradient/g, '</RadialGradient')
    .replace(/<path/g, '<Path')
    .replace(/<\/path/g, '</Path')
    .replace(/<line/g, '<Line')
    .replace(/<\/line/g, '</Line')
    .replace(/<polygon/g, '<Polygon')
    .replace(/<\/polygon/g, '</Polygon')
    .replace(/<polyline/g, '<Polyline')
    .replace(/<\/polyline/g, '</Polyline')
    .replace(/<rect/g, '<Rect')
    .replace(/<\/rect/g, '</Rect')
    .replace(/<symbol/g, '<Symbol')
    .replace(/<\/symbol/g, '</Symbol')
    .replace(/<text/g, '<Text')
    .replace(/<\/text/g, '</Text')
    .replace(/<use/g, '<Use')
    .replace(/<\/use/g, '</Use')
    .replace(/<defs/g, '<Defs')
    .replace(/<\/defs/g, '</Defs')
    .replace(/<stop/g, '<Stop')
    .replace(/<\/stop/g, '</Stop')
    .replace(/<clipPath/g, '<ClipPath')
    .replace(/<\/clipPath/g, '</ClipPath')
    .replace(/<mask/g, '<Mask')
    .replace(/<\/mask/g, '</Mask')
    .replace(/px/g, '')
    .replace(/style="mask-type:luminance"/g, "style={{ maskType: 'luminance' }}")

  const foundFills = Array.from(parsedSvgToReact.matchAll(/fill="(#[a-z0-9]+)"/gi)).flat()
  const defaultFill = foundFills[1]

  return `
import React, { memo, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
Svg,
SvgProps,
Ellipse,
G,
LinearGradient,
RadialGradient,
Line,
Mask,
Path,
Polygon,
Polyline,
Rect,
Symbol,
Use,
Defs,
Stop,
ClipPath,
Text,
Circle,
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
    .replace(/fill="(#[a-z0-9]+)"/gi, `fill="currentColor"`)
    .replaceAll(`xmlns:xlink="http://www.w3.org/1999/xlink"`, '')
    .replaceAll(`xlink:href`, 'xlinkHref')
}

// Helpers

function generateClassName(fileName: string): string {
  return uppercamelcase(path.basename(fileName, '.svg')) as string
}

// This must be at the end to run all code

run().catch(() => undefined)
