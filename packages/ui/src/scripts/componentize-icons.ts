/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
import camelcase from 'camelcase'
import { load } from 'cheerio'
import { ESLint } from 'eslint'
import { ensureDir, readdir, readFile, writeFile } from 'fs-extra'
import path, { join } from 'path'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import uppercamelcase from 'uppercamelcase'

interface SVGDirectorySourceAndOutput {
  input: string
  output: string
}

async function run(): Promise<void> {
  const srcDir = join(__dirname, '..')
  const assetsDir = join(srcDir, 'assets')

  const svgDirPairs: SVGDirectorySourceAndOutput[] = [
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
    await generateSVGComponents(dirPair)
  }
}

async function generateSVGComponents(directoryPair: SVGDirectorySourceAndOutput): Promise<void> {
  let indexFile = ``

  await ensureDir(directoryPair.output)

  const fileNames = (await readdir(directoryPair.input)).filter((name) => name.endsWith('.svg'))

  for (const svgFileName of fileNames) {
    try {
      const iconPath = join(directoryPair.input, svgFileName)
      const svg = await readFile(iconPath, 'utf-8')
      const id = path.basename(svgFileName, '.svg')
      const $ = load(svg, {
        xmlMode: true,
      })
      const cname = uppercamelcase(id)
      const fileName = `${cname}.tsx`
      const outPath = path.join(directoryPair.output, fileName)

      // Because CSS does not exist on Native platforms
      // We need to duplicate the styles applied to the
      // SVG to its children
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const svgAttribs = $('svg')[0]!.attribs
      delete svgAttribs.xmlns
      const attribsOfInterest: Record<string, any> = {}

      Object.keys(svgAttribs).forEach((key) => {
        if (
          ![
            'height',
            'width',
            'viewBox',
            'fill',
            'stroke-width',
            'stroke-linecap',
            'stroke-linejoin',
          ].includes(key)
        ) {
          attribsOfInterest[key] = svgAttribs[key]
        }
      })

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
        .replace(/ class=\"[^\"]+\"/g, '')
        .replace(/ version=\"[^\"]+\"/g, '')
        .replace(/width="[0-9]+"/, '')
        .replace(/height="[0-9]+"/, '')
        .replace('<svg', '<Svg')
        .replace('</svg', '</Svg')
        .replace(new RegExp('<circle', 'g'), '<_Circle')
        .replace(new RegExp('</circle', 'g'), '</_Circle')
        .replace(new RegExp('<ellipse', 'g'), '<Ellipse')
        .replace(new RegExp('</ellipse', 'g'), '</Ellipse')
        .replace(new RegExp('<g', 'g'), '<G')
        .replace(new RegExp('</g', 'g'), '</G')
        .replace(new RegExp('<linear-gradient', 'g'), '<LinearGradient')
        .replace(new RegExp('</linear-gradient', 'g'), '</LinearGradient')
        .replace(new RegExp('<radial-gradient', 'g'), '<RadialGradient')
        .replace(new RegExp('</radial-gradient', 'g'), '</RadialGradient')
        .replace(new RegExp('<path', 'g'), '<Path')
        .replace(new RegExp('</path', 'g'), '</Path')
        .replace(new RegExp('<line', 'g'), '<Line')
        .replace(new RegExp('</line', 'g'), '</Line')
        .replace(new RegExp('<polygon', 'g'), '<Polygon')
        .replace(new RegExp('</polygon', 'g'), '</Polygon')
        .replace(new RegExp('<polyline', 'g'), '<Polyline')
        .replace(new RegExp('</polyline', 'g'), '</Polyline')
        .replace(new RegExp('<rect', 'g'), '<Rect')
        .replace(new RegExp('</rect', 'g'), '</Rect')
        .replace(new RegExp('<symbol', 'g'), '<Symbol')
        .replace(new RegExp('</symbol', 'g'), '</Symbol')
        .replace(new RegExp('<text', 'g'), '<_Text')
        .replace(new RegExp('</text', 'g'), '</_Text')
        .replace(new RegExp('<use', 'g'), '<Use')
        .replace(new RegExp('</use', 'g'), '</Use')
        .replace(new RegExp('<defs', 'g'), '<Defs')
        .replace(new RegExp('</defs', 'g'), '</Defs')
        .replace(new RegExp('<stop', 'g'), '<Stop')
        .replace(new RegExp('</stop', 'g'), '</Stop')
        .replace(new RegExp('<clipPath', 'g'), '<ClipPath')
        .replace(new RegExp('</clipPath', 'g'), '</ClipPath')
        .replace(new RegExp('px', 'g'), '')

      const foundFills = Array.from(parsedSvgToReact.matchAll(/fill="(#[a-z0-9]+)"/gi)).flat()
      const defaultFill = foundFills[1]

      let element = `
import React, { memo, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Svg,
  SvgProps,
  Circle as _Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Text as _Text,
  Use,
  Defs,
  Stop,
  ClipPath
} from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [${cname}, Animated${cname}] = createIcon({
  name: '${cname}',
  getIcon: (props) => (
    ${parsedSvgToReact.replace('otherProps="..."', '{...props}')}
  ),
  ${defaultFill ? `defaultFill: '${defaultFill}'` : ''}
})
`

      // if no width/height/color, add them

      element = element.replace(/fill="(#[a-z0-9]+)"/gi, `fill={"currentColor" ?? '$1'}`)
      element = element.replaceAll(`xmlns:xlink="http://www.w3.org/1999/xlink"`, '')
      element = element.replaceAll(`xlink:href`, 'xlinkHref')

      const formatted = await eslintFormat(element)

      if (formatted) {
        element = formatted
      } else {
        console.warn(`not linted ${svgFileName}`)
      }

      await writeFile(outPath, element, 'utf-8')

      indexFile += `\nexport * from './${fileName.replace('.tsx', '')}'`

      console.log(`🦄 ${svgFileName}`)
    } catch (err) {
      console.log(`Error converting icon: ${svgFileName}: ${(err as any).message}`)
    }
  }

  const formattedIndex = await eslintFormat(indexFile)
  await writeFile(join(directoryPair.output, 'index.ts'), formattedIndex, 'utf-8')
}

const eslint = new ESLint({ fix: true })

async function eslintFormat(inSource: string): Promise<string | undefined> {
  const out = await eslint.lintText(inSource, {
    // eslint wants a file to use for determining format and it actually has to exist 🙄
    filePath: './src/scripts/componentize-icons-eslint-dummy-file.tsx',
  })
  return out?.[0]?.output
}

run().catch(() => undefined)
