import React, { memo, useMemo } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { blurs, UniconAttributeData, UniconAttributes, UniconAttributesToIndices } from './types'
import { deriveUniconAttributeIndices, getUniconAttributeData, isEthAddress } from './utils'

const ORIGINAL_CONTAINER_SIZE = 36
const EMBLEM_XY_SHIFT = 10

function PathMask({
  id,
  paths,
  scale,
  shift = 0,
}: {
  id: string
  paths: React.SVGProps<SVGPathElement>[]
  scale: number
  shift?: number
}) {
  return (
    <mask id={id}>
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <g transform={`scale(${scale}) \n translate(${shift}, ${shift})`}>
        {paths.map((pathProps) => (
          <path key={pathProps.d as string} {...pathProps} fill="black" />
        ))}
      </g>
    </mask>
  )
}

type UniconMaskProps = { maskId: string; attributeData: UniconAttributeData; size: number }
function UniconMask({ maskId, attributeData, size }: UniconMaskProps) {
  const shapeMaskId = `shape-${maskId}`
  const containerMaskId = `container-${maskId}`

  return (
    <defs>
      <PathMask
        id={containerMaskId}
        paths={attributeData[UniconAttributes.Container]}
        scale={size / ORIGINAL_CONTAINER_SIZE}
      />
      <PathMask
        id={shapeMaskId}
        paths={attributeData[UniconAttributes.Shape]}
        scale={size / ORIGINAL_CONTAINER_SIZE}
        shift={EMBLEM_XY_SHIFT}
      />
      <mask id={maskId}>
        <g fill="white">
          <g mask={`url(#${shapeMaskId})`}>
            <g transform={`scale(${size / ORIGINAL_CONTAINER_SIZE})`}>
              {attributeData[UniconAttributes.Container].map((pathProps) => (
                <path key={pathProps.d as string} {...pathProps} />
              ))}
            </g>
          </g>
          <g mask={`url(#${containerMaskId})`}>
            <g
              transform={`scale(${size / ORIGINAL_CONTAINER_SIZE})
        translate(10, 10)`}
            >
              {attributeData[UniconAttributes.Shape].map((pathProps) => (
                <path key={pathProps.d as string} {...pathProps} />
              ))}
            </g>
          </g>
        </g>
      </mask>
    </defs>
  )
}

type UniconGradientProps = { gradientId: string; attributeData: UniconAttributeData }
function UniconGradient({ gradientId, attributeData }: UniconGradientProps) {
  return (
    <linearGradient id={gradientId}>
      <stop offset="0%" stopColor={attributeData[UniconAttributes.GradientStart]} />
      <stop offset="100%" stopColor={attributeData[UniconAttributes.GradientEnd]} />
    </linearGradient>
  )
}

function UniconBlur({ blurId, size }: { blurId: string; size: number }) {
  return (
    <filter id={blurId} x="-50%" y="-50%" height="200%" width="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={size / 3} />
    </filter>
  )
}

function UniconSvg({
  attributeIndices,
  size,
  address,
}: {
  attributeIndices: UniconAttributesToIndices
  size: number
  address: string
  mobile?: boolean
}) {
  const isDarkMode = useIsDarkMode()
  const attributeData = useMemo(() => getUniconAttributeData(attributeIndices), [attributeIndices])

  const gradientId = `gradient${address + size}`
  const maskId = `mask${address + size}`
  const blurId = `blur${address + size}`
  const svgProps = {
    viewBox: `0 0 ${size} ${size}`,
  }

  if (!attributeIndices || !attributeData) return null

  return (
    <svg {...svgProps}>
      <defs>
        <UniconMask maskId={maskId} attributeData={attributeData} size={size} />
        <UniconGradient gradientId={gradientId} attributeData={attributeData} />
        <UniconBlur blurId={blurId} size={size} />
      </defs>

      <g mask={`url(#${maskId})`}>
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        {!isDarkMode && <rect x="0" y="0" width="100%" height="100%" fill="black" opacity={0.08} />}
        <ellipse
          cx={size / 2}
          cy={0}
          rx={size / 2}
          ry={size / 2}
          fill={blurs[attributeIndices[UniconAttributes.GradientStart]]}
          filter={`url(#${blurId})`}
        />
      </g>
    </svg>
  )
}

interface Props {
  address: string
  size?: number
  randomSeed?: number
  border?: boolean
  mobile?: boolean
}

function _Unicon({ address, size = 24, randomSeed = 0, mobile }: Props) {
  const attributeIndices = useMemo(() => deriveUniconAttributeIndices(address, randomSeed), [address, randomSeed])

  if (!address || !isEthAddress(address) || !attributeIndices) return null

  return (
    <div style={{ height: size, width: size, position: 'relative' }}>
      <div style={{ height: size, width: size, overflow: 'visible', position: 'absolute' }}>
        <UniconSvg attributeIndices={attributeIndices} size={size} address={address} mobile={mobile} />
      </div>
    </div>
  )
}

export const Unicon = memo(_Unicon)
