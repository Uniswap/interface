import { Canvas, Circle, Group, Path } from '@shopify/react-native-skia'
import { memo } from 'react'
import { IconPaths, Icons } from 'ui/src/components/UniconV2/UniconSVGs'
import { UniconV2Props } from 'ui/src/components/UniconV2/types'
import {
  getUniconV2Colors,
  getUniconsV2DeterministicHash,
  isValidEthAddress,
} from 'ui/src/components/UniconV2/utils'
import { Flex } from 'ui/src/components/layout'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'

// Notes:
// Add 1 to effectively increase margin between svg and surrounding box, otherwise get a cropping issue
// Magic numbers to make SVG with border look right - makes the margin larger, and shifts the SVG down and right

export const UniconV2 = memo(_UniconV2)

export function _UniconV2({ address, size = 32 }: UniconV2Props): JSX.Element | null {
  const isDarkMode = useIsDarkMode()

  if (!address || !isValidEthAddress(address)) {
    return null
  }

  const hashValue = getUniconsV2DeterministicHash(address)
  const { color } = getUniconV2Colors(address, isDarkMode)

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
  const translateAmount = (size - scaledSVGSize) / 2

  return (
    <Flex style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Circle
          color={color + `${isDarkMode ? '29' : '1F'}`}
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
        />
        <Group transform={[{ translateX: translateAmount }, { translateY: translateAmount }]}>
          <Group transform={[{ scale: scaleValue }]}>
            {/* This is the shape generation code */}
            {selectedIconPaths.map((pathData: string, index: number) => (
              <Path
                key={index.toString()}
                clip-rule="evenodd"
                color={color}
                fillType="evenOdd"
                path={pathData}
                strokeWidth={1}
              />
            ))}
          </Group>
        </Group>
      </Canvas>
    </Flex>
  )
}
