import {
  BlurMask,
  Canvas,
  Circle,
  Color,
  Group,
  LinearGradient,
  Mask,
  Path,
  Rect,
  vec,
} from '@shopify/react-native-skia'
import React, { useMemo } from 'react'
import 'react-native-reanimated'
import { Box } from 'src/components/layout/Box'
import { svgPaths as containerPaths } from 'src/components/unicons/Container'
import { svgPaths as emblemPaths } from 'src/components/unicons/Emblem'
import {
  blurs,
  gradientEnds,
  gradientStarts,
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesToIndices,
} from 'src/components/unicons/types'
import { deriveUniconAttributeIndices, isEthAddress } from 'src/components/unicons/utils'
import { flex } from 'src/styles/flex'

const ORIGINAL_SVG_SIZE = 36
const EMBLEM_XY_SHIFT = 10

const GradientBlur = ({
  size,
  gradientStart,
  gradientEnd,
  blurColor,
}: {
  size: number
  gradientStart: Color
  gradientEnd: Color
  blurColor: Color
}) => {
  return (
    <Group transform={[{ scale: size / ORIGINAL_SVG_SIZE }]}>
      <Rect height={ORIGINAL_SVG_SIZE} width={ORIGINAL_SVG_SIZE} x={0} y={0}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          end={vec(ORIGINAL_SVG_SIZE, ORIGINAL_SVG_SIZE / 2)}
          start={vec(0, ORIGINAL_SVG_SIZE / 2)}
        />
      </Rect>
      <Circle
        color={blurColor}
        cx={ORIGINAL_SVG_SIZE / 2}
        cy={(-13 / 36) * ORIGINAL_SVG_SIZE}
        r={(30 / 36) * ORIGINAL_SVG_SIZE}>
        <BlurMask blur={15} />
      </Circle>
    </Group>
  )
}

export const EXPORT_FOR_TESTING = {
  UniconSvg,
}

function UniconSvg({
  attributeIndices,
  size,
}: {
  attributeIndices: UniconAttributesToIndices
  size: number
}) {
  // UniconSvg is used in the Unicon component or for testing specific shapes/containers
  // UniconSvg canvases will grow to fit their container
  // For best results, wrap in a Box with width and height set to size
  // const [attributeData, setAttributeData] = useState<UniconAttributeData>()

  const attributeData = useMemo(() => {
    if (!attributeIndices) return
    return {
      [UniconAttributes.GradientStart]:
        gradientStarts[attributeIndices[UniconAttributes.GradientStart]],
      [UniconAttributes.GradientEnd]: gradientEnds[attributeIndices[UniconAttributes.GradientEnd]],
      [UniconAttributes.Container]: containerPaths[attributeIndices[UniconAttributes.Container]],
      [UniconAttributes.Shape]: emblemPaths[attributeIndices[UniconAttributes.Shape]],
    } as UniconAttributeData
  }, [attributeIndices])

  if (!attributeIndices || !attributeData) return null

  return (
    <Canvas style={flex.fill}>
      <Mask
        clip={true}
        mask={
          <Group blendMode="xor" transform={[{ scale: size / ORIGINAL_SVG_SIZE }]}>
            <Group transform={[{ translateX: EMBLEM_XY_SHIFT }, { translateY: EMBLEM_XY_SHIFT }]}>
              {/* This is the shape generation code */}
              {attributeData[UniconAttributes.Shape].map((pathProps) => (
                <Path key={pathProps.path as string} {...pathProps} />
              ))}
            </Group>
            {/* This is the container generation code */}
            {attributeData[UniconAttributes.Container].map((pathProps) => (
              <Path key={pathProps.path as string} {...pathProps} />
            ))}
          </Group>
        }>
        <GradientBlur
          blurColor={blurs[attributeIndices[UniconAttributes.GradientStart]]}
          gradientEnd={attributeData[UniconAttributes.GradientEnd]}
          gradientStart={attributeData[UniconAttributes.GradientStart]}
          size={size}
        />
      </Mask>
    </Canvas>
  )
}

interface Props {
  address: string
  size: number
}

export function Unicon({ address, size }: Props) {
  // Renders a Unicon inside a (size) x (size) pixel square Box
  const attributeIndices = useMemo(() => deriveUniconAttributeIndices(address), [address])

  if (!address || !isEthAddress(address) || !attributeIndices) return null

  return (
    <Box height={size} width={size}>
      <UniconSvg attributeIndices={attributeIndices} size={size} />
    </Box>
  )
}
