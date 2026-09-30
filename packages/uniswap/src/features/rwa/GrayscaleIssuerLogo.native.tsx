import { Flex, useSvgData } from '@universe/mycelium'
import { useMemo } from 'react'
import { Circle, ClipPath, Defs, FeColorMatrix, Filter, Image, Svg, SvgXml } from 'react-native-svg'
import type { GrayscaleIssuerLogoProps } from 'uniswap/src/features/rwa/GrayscaleIssuerLogo'
import { isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'

const FILTER_ID = 'issuer-logo-grayscale'
const CLIP_ID = 'issuer-logo-clip'
const SVG_OPEN_TAG_REGEX = /<svg\b[^>]*>/i
const SVG_CLOSE_TAG_REGEX = /<\/svg>\s*$/i

/**
 * RN's `filter: grayscale()` is a no-op on iOS (gated behind the off-by-default `enableSwiftUIBasedFilters`), so
 * apply the same saturate(0) matrix CSS uses via an SVG filter.
 */
export function GrayscaleIssuerLogo({ uri, size }: GrayscaleIssuerLogoProps): JSX.Element | null {
  const href = uriToHttpUrls(uri, { allowLocalUri: true })[0]
  if (!href) {
    return null
  }
  return isSVGUri(href) ? <GrayscaleSvgLogo uri={href} size={size} /> : <GrayscaleRasterLogo uri={href} size={size} />
}

function GrayscaleSvgLogo({ uri, size }: GrayscaleIssuerLogoProps): JSX.Element | null {
  const svgData = useSvgData(uri)
  const xml = useMemo(() => (svgData ? wrapSvgInGrayscaleFilter(svgData.content) : undefined), [svgData])
  if (!xml) {
    return null
  }
  // The SVG's own viewBox is unknown, so clip with the wrapper instead of an in-SVG ClipPath
  return (
    <Flex borderRadius={size / 2} height={size} overflow="hidden" width={size}>
      <SvgXml height={size} width={size} xml={xml} />
    </Flex>
  )
}

function GrayscaleRasterLogo({ uri, size }: GrayscaleIssuerLogoProps): JSX.Element {
  const radius = size / 2
  return (
    <Svg height={size} width={size}>
      <Defs>
        <Filter id={FILTER_ID}>
          <FeColorMatrix type="saturate" values={0} />
        </Filter>
        <ClipPath id={CLIP_ID}>
          <Circle cx={radius} cy={radius} r={radius} />
        </ClipPath>
      </Defs>
      <Image
        clipPath={`url(#${CLIP_ID})`}
        filter={`url(#${FILTER_ID})`}
        height={size}
        href={uri}
        preserveAspectRatio="xMidYMid slice"
        width={size}
      />
    </Svg>
  )
}

function wrapSvgInGrayscaleFilter(content: string): string {
  const openTag = SVG_OPEN_TAG_REGEX.exec(content)?.[0]
  // Unparseable markup degrades to a color logo rather than no logo
  if (!openTag || !SVG_CLOSE_TAG_REGEX.test(content)) {
    return content
  }
  const filterDefs = `<defs><filter id="${FILTER_ID}"><feColorMatrix type="saturate" values="0"/></filter></defs>`
  return content
    .replace(SVG_CLOSE_TAG_REGEX, '</g></svg>')
    .replace(openTag, `${openTag}${filterDefs}<g filter="url(#${FILTER_ID})">`)
}
