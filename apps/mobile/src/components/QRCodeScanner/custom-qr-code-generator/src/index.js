// Component logic from: https://github.com/awesomejerry/react-native-qrcode-svg
// Custom matric renderer from: https://github.com/awesomejerry/react-native-qrcode-svg/pull/139/files

import React, { useMemo } from 'react'
import Svg, { ClipPath, Defs, G, Image, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import genMatrix from 'src/components/QRCodeScanner/custom-qr-code-generator/src/genMatrix.js'
import transformMatrixIntoPath from 'src/components/QRCodeScanner/custom-qr-code-generator/src/transformMatrixIntoCirclePath.js'

const renderLogo = ({
  size,
  logo,
  logoBackgroundColor,
  logoSize,
  logoMargin,
  logoBorderRadius,
}) => {
  const logoPosition = (size - logoSize - logoMargin * 2) / 2
  const logoBackgroundSize = logoSize + logoMargin * 2
  const logoBackgroundBorderRadius = logoBorderRadius + (logoMargin / logoSize) * logoBorderRadius

  return (
    <G x={logoPosition} y={logoPosition}>
      <Defs>
        <ClipPath id="clip-logo-background">
          <Rect
            height={logoBackgroundSize}
            rx={logoBackgroundBorderRadius}
            ry={logoBackgroundBorderRadius}
            width={logoBackgroundSize}
          />
        </ClipPath>
        <ClipPath id="clip-logo">
          <Rect height={logoSize} rx={logoBorderRadius} ry={logoBorderRadius} width={logoSize} />
        </ClipPath>
      </Defs>
      <G>
        <Rect
          clipPath="url(#clip-logo-background)"
          fill={logoBackgroundColor}
          height={logoBackgroundSize}
          width={logoBackgroundSize}
        />
      </G>
      <G x={logoMargin} y={logoMargin}>
        <Image
          clipPath="url(#clip-logo)"
          height={logoSize}
          href={logo}
          preserveAspectRatio="xMidYMid slice"
          width={logoSize}
        />
      </G>
    </G>
  )
}

const QRCode = ({
  value = 'this is a QR code',
  size = 100,
  color = 'sporeBlack',
  backgroundColor = 'sporeWhite',
  borderRadius = 24,
  logo,
  logoSize = size * 0.2,
  logoBackgroundColor = 'transparent',
  logoMargin = -2,
  logoBorderRadius = 0,
  quietZone = 4,
  enableLinearGradient = false,
  gradientDirection = ['0%', '0%', '100%', '100%'],
  linearGradient = ['rgb(255,0,0)', 'rgb(0,255,255)'],
  ecl = 'M',
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

  if (!result) {
    return null
  }

  const { path } = result

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
          y1={gradientDirection[1]}
          y2={gradientDirection[3]}>
          <Stop offset="0" stopColor={linearGradient[0]} stopOpacity="1" />
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
      </G>
      {logo &&
        renderLogo({
          size,
          logo,
          logoSize,
          logoBackgroundColor,
          logoMargin,
          logoBorderRadius,
        })}
    </Svg>
  )
}

export default QRCode
