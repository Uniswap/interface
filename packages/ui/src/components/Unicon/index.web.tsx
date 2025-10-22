import React, { lazy, Suspense } from 'react'
import { Flex } from 'ui/src/components/layout/Flex'
import { UniconProps } from 'ui/src/components/Unicon/types'
import { getUniconColors, getUniconsDeterministicHash } from 'ui/src/components/Unicon/utils'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'

// In test environments, import Icons synchronously
const isTestEnv = process.env.NODE_ENV === 'test'
const { Icons } = isTestEnv ? require('ui/src/components/Unicon/UniconSVGs') : { Icons: {} }

function UniconSVGInner({
  address,
  size = 32,
  icons,
}: UniconProps & { icons: typeof Icons }): React.ReactElement | null {
  const isDarkMode = useIsDarkMode()
  if (!address || (!isEVMAddressWithChecksum(address) && !isSVMAddress(address))) {
    return null
  }

  const hashValue = getUniconsDeterministicHash(address)
  const { color } = getUniconColors(address, isDarkMode)
  const iconKeys = Object.keys(icons)
  const iconIndex = Math.abs(Number(hashValue)) % iconKeys.length
  const selectedIconKey = iconKeys[iconIndex] as keyof typeof icons
  const selectedIconPaths = icons[selectedIconKey]

  const ORIGINAL_CONTAINER_SIZE = 48
  const scaleValue = size / ORIGINAL_CONTAINER_SIZE / 1.5
  const scaledSVGSize = ORIGINAL_CONTAINER_SIZE * scaleValue
  const translateX = (size - scaledSVGSize) / 2
  const translateY = (size - scaledSVGSize) / 2

  return (
    <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} xmlns="http://www.w3.org/2000/svg">
      <g style={{ transformOrigin: 'center center' }}>
        <circle cx={size / 2} cy={size / 2} fill={color + `${isDarkMode ? '29' : '1F'}`} r={size / 2} />
        <g transform={`translate(${translateX}, ${translateY}) scale(${scaleValue})`}>
          {selectedIconPaths?.map((pathData: string, index: number) => (
            <path key={index} clipRule="evenodd" d={pathData} fill={color} fillRule="evenodd" />
          ))}
        </g>
      </g>
    </svg>
  )
}

const UniconSVGBase = (props: UniconProps): React.ReactElement | null => UniconSVGInner({ ...props, icons: Icons })

const UniconSVGComponent = isTestEnv
  ? UniconSVGBase
  : lazy(async () => {
      const { Icons: LazyIcons } = await import('ui/src/components/Unicon/UniconSVGs')
      return {
        default: (props: UniconProps): React.ReactElement | null => UniconSVGInner({ ...props, icons: LazyIcons }),
      }
    })

export const Unicon: React.FC<UniconProps> = (props) => (
  <Suspense fallback={<Flex width={props.size} height={props.size} />}>
    <UniconSVGComponent {...props} />
  </Suspense>
)
