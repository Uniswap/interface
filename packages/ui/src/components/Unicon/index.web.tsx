import React from 'react'
import { IconPaths, Icons } from 'ui/src/components/Unicon/UniconSVGs'
import { UniconProps } from 'ui/src/components/Unicon/types'
import { getUniconColors, getUniconsDeterministicHash, isValidEthAddress } from 'ui/src/components/Unicon/utils'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'

const styles = { transformOrigin: 'center center' }

export const Unicon: React.FC<UniconProps> = ({ address, size = 32 }) => {
  const isDarkMode = useIsDarkMode()

  if (!address || !isValidEthAddress(address)) {
    return null
  }

  const hashValue = getUniconsDeterministicHash(address)
  const { color } = getUniconColors(address, isDarkMode)

  const iconKeys = Object.keys(Icons)
  if (iconKeys.length === 0) {
    throw new Error('No icons available')
  }

  const iconIndex = Math.abs(Number(hashValue)) % iconKeys.length
  const selectedIconKey = iconKeys[iconIndex] as keyof typeof Icons
  const selectedIconPaths: IconPaths | undefined = Icons[selectedIconKey]

  if (!selectedIconPaths) {
    throw new Error(`No icon found for key: ${String(selectedIconKey)}`)
  }

  const ORIGINAL_CONTAINER_SIZE = 48

  const scaleValue = size / ORIGINAL_CONTAINER_SIZE / 1.5
  const scaledSVGSize = ORIGINAL_CONTAINER_SIZE * scaleValue
  const translateX = (size - scaledSVGSize) / 2
  const translateY = (size - scaledSVGSize) / 2

  return (
    <svg
      height={size} // Use the size prop to control SVG dimensions
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g style={styles}>
        <circle cx={size / 2} cy={size / 2} fill={color + `${isDarkMode ? '29' : '1F'}`} r={size / 2} />
        <g transform={`translate(${translateX}, ${translateY}) scale(${scaleValue})`}>
          {selectedIconPaths.map((pathData: string, index: number) => (
            <path key={index} clipRule="evenodd" d={pathData} fill={color} fillRule="evenodd" />
          ))}
        </g>
      </g>
    </svg>
  )
}
