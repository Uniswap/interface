import camelcase from 'camelcase'
import { load } from 'cheerio'
import { ESLint } from 'eslint'
import { ensureDir, readdir, readFile, writeFile } from 'fs-extra'
import path, { join } from 'path'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import uppercamelcase from 'uppercamelcase'

async function run(): Promise<void> {
  const srcDir = join(__dirname, '..')
  const assetsDir = join(srcDir, 'assets')
  const iconsDir = join(assetsDir, 'icons')
  const outDir = join(srcDir, 'components', 'icons')

  let indexFile = ``

  await ensureDir(outDir)

  const iconFileNames = (await readdir(iconsDir)).filter((name) => name.endsWith('.svg'))

  for (const iconFileName of iconFileNames) {
    try {
      const iconPath = join(iconsDir, iconFileName)
      const svg = await readFile(iconPath, 'utf-8')
      const id = path.basename(iconFileName, '.svg')
      const $ = load(svg, {
        xmlMode: true,
      })
      const cname = uppercamelcase(id)
      const fileName = `${cname}.tsx`
      const outPath = path.join(outDir, fileName)

      // Because CSS does not exist on Native platforms
      // We need to duplicate the styles applied to the
      // SVG to its children
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

      $('*').each((index, el: any) => {
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
        .replace(new RegExp('stroke="currentColor"', 'g'), 'stroke={color}')
        .replace(/width="[0-9]+"/, 'width={size}')
        .replace(/height="[0-9]+"/, 'height={size}')
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
        .replace(new RegExp('px', 'g'), '')

      const foundFills = Array.from(parsedSvgToReact.matchAll(/fill="(#[a-z0-9]+)"/gi)).flat()
      const defaultFill = foundFills[1]

      let element = `
import React, { memo, forwardRef } from 'react'
import PropTypes from 'prop-types'
import type { IconProps } from '@tamagui/helpers-icon'
import { useTheme, isWeb, getTokenValue } from 'tamagui'
import {
  Svg,
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
  Stop
} from 'react-native-svg'
import { themed } from '@tamagui/helpers-icon'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = ${defaultFill ? `'${defaultFill}'` : `isWeb ? 'currentColor' : undefined`},
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps,
  } = props
  const theme = useTheme()
  
  const size =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      sizeProp,
      'size'
    ) ?? sizeProp

  const strokeWidth =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      strokeWidthProp,
      'size'
    ) ?? strokeWidthProp

  const color = 
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() 
    ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    ${parsedSvgToReact
      .replace(`<Svg `, `<Svg ref={ref} `)
      .replace('otherProps="..."', '{...svgProps}')}
  )
})

Icon.displayName = '${cname}'

export const ${cname} = memo<IconProps>(Icon)
`

      // if no width/height/color, add them

      element = element.replace(/fill="(#[a-z0-9]+)"/gi, `fill={color ?? '$1'}`)

      if (!element.includes(`width={size}`)) {
        element = element.replace(`<Svg `, `<Svg width={size} height={size}`)
      }

      element = element.replaceAll(`fill="currentColor"`, `fill={color}`)

      const formatted = await eslintFormat(element)

      if (formatted) {
        element = formatted
      } else {
        // eslint-disable-next-line no-console
        console.warn(`not linted ${iconFileName}`)
      }

      await writeFile(outPath, element, 'utf-8')

      indexFile += `\nexport * from './${fileName.replace('.tsx', '')}'`

      // eslint-disable-next-line no-console
      console.log(`🦄 ${iconFileName}`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`Error converting icon: ${iconFileName}: ${(err as any).message}`)
    }
  }

  const formattedIndex = await eslintFormat(indexFile)
  await writeFile(join(outDir, 'index.ts'), formattedIndex, 'utf-8')

  // eslint-disable-next-line no-console
  console.log(
    `⚠️ Warning: The CameraScan icon needs manual removing strokeWidth="10", we could automate...`
  )
}

const eslint = new ESLint({ fix: true })

async function eslintFormat(inSource: string): Promise<string | undefined> {
  const out = await eslint.lintText(inSource, {
    // eslint wants a file to use for determining format and it actually has to exist 🙄
    filePath: './src/scripts/componentize-icons-eslint-dummy-file.tsx',
  })
  return out?.[0]?.output
}

run()
