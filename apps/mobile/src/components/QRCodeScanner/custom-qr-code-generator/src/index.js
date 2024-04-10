// Component logic from: https://github.com/awesomejerry/react-native-qrcode-svg
// Custom matric renderer from: https://github.com/awesomejerry/react-native-qrcode-svg/pull/139/files

import React, { useMemo } from 'react'
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import genMatrix from 'src/components/QRCodeScanner/custom-qr-code-generator/src/genMatrix.js'
import transformMatrixIntoPath from 'src/components/QRCodeScanner/custom-qr-code-generator/src/transformMatrixIntoCirclePath.js'
import { useMedia } from 'ui/src'

const QREyes = ({ x = -1, y = -1, fillColor, size }) => (
  <G transform={`scale(${size / 120})`} x={x} y={y}>
    <Path
      clip-rule="evenodd"
      d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V28C40 34.6274 34.6274 40 28 40H12C5.37258 40 0 34.6274 0 28V12ZM28 6.27451H12C8.8379 6.27451 6.27451 8.8379 6.27451 12V28C6.27451 31.1621 8.8379 33.7255 12 33.7255H28C31.1621 33.7255 33.7255 31.1621 33.7255 28V12C33.7255 8.8379 31.1621 6.27451 28 6.27451Z"
      fill={fillColor}
      fill-rule="evenodd"
    />
    <Path
      d="M11 17C11 13.6863 13.6863 11 17 11H23C26.3137 11 29 13.6863 29 17V23C29 26.3137 26.3137 29 23 29H17C13.6863 29 11 26.3137 11 23V17Z"
      fill={fillColor}
    />
  </G>
)

const QREyeBG = ({ x = -1, y = -1, size, backgroundColor }) => (
  <G transform={`scale(${size / 120})`} x={x} y={y}>
    <Path d="M0 0H40V40H0V0Z" fill={backgroundColor} />
  </G>
)

const QREyeWrapper = ({ x = 0, y = 0, backgroundColor, overlayColor, fillColor, size }) => (
  <>
    <QREyeBG backgroundColor={backgroundColor} size={size} x={x} y={y} />
    <QREyes fillColor={fillColor} size={size} x={x} y={y} />
    <QREyes fillColor={overlayColor} size={size} x={x} y={y} />
  </>
)

const QRCode = ({
  value = 'Wallet QR code',
  size = 190,
  color,
  backgroundColor,
  overlayColor = '#FFFFFF',
  borderRadius = 24,
  quietZone = 8,
  enableLinearGradient = false,
  gradientDirection = ['0%', '0%', '100%', '100%'],
  linearGradient = ['rgb(255,255,255)', 'rgb(0,255,255)'],
  ecl = 'H',
  getRef,
  onError,
}) => {
  const result = useMemo(() => {
    try {
      return transformMatrixIntoPath(genMatrix(value, ecl), size)
    } catch (error) {
      if (onError && typeof onError === 'function') {
        onError(error)
      } else {
        // Pass the error when no handler presented
        throw error
      }
    }
  }, [value, size, ecl, onError])

  const media = useMedia()
  if (!result) {
    return null
  }

  const { path } = result

  const eyeSize = media.short ? 126 : 138

  return (
    <Svg
      ref={getRef}
      height={size}
      viewBox={[-quietZone, -quietZone, size + quietZone * 2, size + quietZone * 2].join(' ')}
      width={size}>
      <Defs>
        <LinearGradient
          gradientTransform="rotate(45)"
          id="grad"
          x1={gradientDirection[0]}
          x2={gradientDirection[2]}
          y1={gradientDirection[0]}
          y2={gradientDirection[2]}>
          <Stop offset="0" stopColor={color} stopOpacity="1" />
          <Stop offset="1" stopColor={linearGradient[1]} stopOpacity="1" />
          <Stop offset="1" stopColor={linearGradient[2]} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <G>
        <Rect
          fill={backgroundColor}
          height={size + quietZone * 2}
          rx={borderRadius}
          width={size + quietZone * 2}
          x={-quietZone}
          y={-quietZone}
        />
      </G>
      <G>
        <Path d={path} fill={enableLinearGradient ? 'url(#grad)' : color} />
        <Path d={path} fill={enableLinearGradient ? overlayColor + '66' : overlayColor + '2D'} />
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
          y={size - eyeSize / 3}
        />
        <QREyeWrapper
          backgroundColor={backgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
          x={size - eyeSize / 3}
        />
      </G>
    </Svg>
  )
}

export default QRCode
