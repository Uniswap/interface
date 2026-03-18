// Component logic from: https://github.com/awesomejerry/react-native-qrcode-svg
// Custom matrix renderer from: https://github.com/awesomejerry/react-native-qrcode-svg/pull/139/files

import { create, QRCodeErrorCorrectionLevel, QRCodeSegment } from 'qrcode'
import { useMemo } from 'react'
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import { BaseQRProps } from 'ui/src/components/QRCode/QRCodeDisplay'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { isWebPlatform } from 'utilities/src/platform'

// size of the SVG element of the eye for the SVG we use in particular.
const SVG_SIZE = 40
// Alignment markers always take up 7x7 cells
const EYE_SIZE_UNITS = 7
/**
 * Unsure why this is need but the scaling on the web is 2x. This
 * offset multiplier ensures that we the eyes align correctly on web.
 */
const EYE_OFFSET_MULTIPLIER = isWebPlatform ? 2 : 1

export interface QRCodeProps extends BaseQRProps {
  /* what the qr code stands for */
  value: string
  /* the whole component size */
  backgroundColor?: string
  /* the color of the background */
  overlayColor: string
  /* quiet zone in pixels */
  quietZone?: number
}

interface SVGPartProps {
  x?: number
  y?: number
  size: number
}

// x and y attributes are not supported on <g> elements on web. Likewise, they are not supported on svg elements on React Native.
// Solution is to wrap with <svg> and pass x and y values to both.
const QREyes = ({
  x = -1,
  y = -1,
  fillColor,
  size,
}: SVGPartProps & {
  fillColor?: string
}): JSX.Element => (
  <Svg x={x} y={y}>
    <G transform={`translate(${x}, ${y}) scale(${size / SVG_SIZE})`}>
      <Path
        clipRule="evenodd"
        d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V28C40 34.6274 34.6274 40 28 40H12C5.37258 40 0 34.6274 0 28V12ZM28 6.27451H12C8.8379 6.27451 6.27451 8.8379 6.27451 12V28C6.27451 31.1621 8.8379 33.7255 12 33.7255H28C31.1621 33.7255 33.7255 31.1621 33.7255 28V12C33.7255 8.8379 31.1621 6.27451 28 6.27451Z"
        fill={fillColor}
        fillRule="evenodd"
      />
      <Path
        d="M11 17C11 13.6863 13.6863 11 17 11H23C26.3137 11 29 13.6863 29 17V23C29 26.3137 26.3137 29 23 29H17C13.6863 29 11 26.3137 11 23V17Z"
        fill={fillColor}
      />
    </G>
  </Svg>
)

const QREyeBG = ({
  x = -1,
  y = -1,
  size,
  backgroundColor,
}: SVGPartProps & {
  backgroundColor?: string
}): JSX.Element => (
  <Svg x={x} y={y}>
    <G transform={`translate(${x}, ${y}) scale(${size / SVG_SIZE})`}>
      <Path d="M0 0H40V40H0V0Z" fill={backgroundColor} />
    </G>
  </Svg>
)

const QREyeWrapper = ({
  x = 0,
  y = 0,
  backgroundColor,
  overlayColor,
  fillColor,
  size,
}: SVGPartProps & {
  backgroundColor?: string
  overlayColor?: string
  fillColor?: string
}): JSX.Element => (
  <>
    <QREyeBG backgroundColor={backgroundColor} size={size} x={x} y={y} />
    <QREyes fillColor={fillColor} size={size} x={x} y={y} />
    <QREyes fillColor={overlayColor} size={size} x={x} y={y} />
  </>
)

function transformMatrixIntoCirclePath(
  matrix: number[][],
  size: number,
): {
  cellSize: number
  path: string
} {
  const cellSize = size / matrix.length
  const radius = cellSize / 2
  let path = ''

  matrix.forEach((row, i) => {
    row.forEach((column: number, j: number) => {
      if (column) {
        const cx = j * cellSize + radius
        const cy = i * cellSize + radius

        path += `
          M ${cx - radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx + radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx - radius},${cy}
        `
      }
    })
  })

  return {
    cellSize,
    path,
  }
}

function genMatrix(value: string | QRCodeSegment[], errorCorrectionLevel: QRCodeErrorCorrectionLevel): number[][] {
  const arr = Array.prototype.slice.call(create(value, { errorCorrectionLevel }).modules.data, 0)
  const sqrt = Math.sqrt(arr.length)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return arr.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, max-params
    (rows, key, index) => (index % sqrt === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows,
    [],
  )
}

/**
 * Renders a QR code with custom colors, custom eyes, and more.
 *
 * @param value - The value to encode in the QR code
 * @param size - The size of the QR code
 * @param color - The color of the QR code
 * @param backgroundColor - The background color of the QR code
 * @param overlayColor - Additional color to overlay on top of the QR code
 * @param quietZone - The quiet zone of the QR code
 * @param ecl - The error correction level of the QR code
 */
export function QRCode({
  value,
  size,
  color,
  backgroundColor: inputBackgroundColor,
  overlayColor = '#FFFFFF',
  quietZone = 8,
  ecl = 'H',
}: QRCodeProps): JSX.Element | null {
  const colors = useSporeColors()

  const { matrix, path } = useMemo(() => {
    const _matrix = genMatrix(value, ecl)
    return {
      matrix: _matrix,
      path: transformMatrixIntoCirclePath(_matrix, size).path,
    }
  }, [value, size, ecl])

  const eyeSize = size * (EYE_SIZE_UNITS / matrix.length)
  const backgroundColor = inputBackgroundColor ?? colors.surface1.val
  const cornerPosition = (size - eyeSize) / EYE_OFFSET_MULTIPLIER

  return (
    <Svg
      height={size}
      viewBox={[-quietZone, -quietZone, size + quietZone * 2, size + quietZone * 2].join(' ')}
      width={size}
    >
      <Defs>
        <LinearGradient gradientTransform="rotate(45)" id="grad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="1" stopColor="rgb(0,255,255)" stopOpacity="1" />
          <Stop offset="1" stopColor={undefined} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <G>
        <Rect
          fill={backgroundColor}
          height={size + quietZone * 2}
          rx={24}
          width={size + quietZone * 2}
          x={-quietZone}
          y={-quietZone}
        />
      </G>
      <G>
        <Path d={path} fill={color} />
        <Path d={path} fill={overlayColor + '2D'} />
        <QREyeWrapper
          backgroundColor={backgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
        />
        <QREyeWrapper
          backgroundColor={backgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
          y={cornerPosition}
        />
        <QREyeWrapper
          backgroundColor={backgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
          x={cornerPosition}
        />
      </G>
    </Svg>
  )
}
