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
import { memo, useMemo } from 'react'
import 'react-native-reanimated'
import { Flex, flexStyles } from 'ui/src/components/layout'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import {
  UniconAttributeData,
  UniconAttributes,
  UniconAttributesToIndices,
  blurs,
} from './types.native'
import { deriveUniconAttributeIndices, getUniconAttributeData, isEthAddress } from './utils.native'

// HACK: Add 1 to effectively increase margin between svg and surrounding box, otherwise get a cropping issue
const ORIGINAL_SVG_SIZE = 36 + 1
const EMBLEM_XY_SHIFT = 10

// HACKS: Magic numbers to make SVG with border look right - makes the margin larger, and shifts the SVG down and right
const ORIGINAL_SVG_SIZE_WITH_BORDER = 48
const BORDER_SIZE = 10
const BORDER_XY_SHIFT = 9

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
}): JSX.Element => {
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

function UniconMask({
  size,
  attributeData,
  overlay = false,
  showBorder,
}: {
  size: number
  attributeData: UniconAttributeData
  overlay?: boolean
  showBorder?: boolean
}): JSX.Element {
  return (
    <Group
      transform={[
        { translateX: showBorder ? BORDER_XY_SHIFT : 0 },
        { translateY: showBorder ? BORDER_XY_SHIFT : 0 },
      ]}>
      <Group
        blendMode={overlay ? 'multiply' : 'xor'}
        transform={[
          { scale: size / (showBorder ? ORIGINAL_SVG_SIZE_WITH_BORDER : ORIGINAL_SVG_SIZE) },
        ]}>
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
    </Group>
  )
}

function UniconMaskBG({
  size,
  attributeData,
  showBorder,
}: {
  size: number
  attributeData: UniconAttributeData
  showBorder?: boolean
}): JSX.Element {
  return (
    <Group
      transform={[
        { translateX: showBorder ? BORDER_XY_SHIFT : 0 },
        { translateY: showBorder ? BORDER_XY_SHIFT : 0 },
      ]}>
      <Group
        transform={[
          { translateX: EMBLEM_XY_SHIFT + (showBorder ? BORDER_XY_SHIFT + 4 : 0) },
          { translateY: EMBLEM_XY_SHIFT + (showBorder ? BORDER_XY_SHIFT + 4 : 0) },
        ]}>
        {attributeData[UniconAttributes.Shape].map((pathProps) => (
          <Path
            key={pathProps.path as string}
            strokeJoin="round"
            strokeWidth={BORDER_SIZE + 4}
            style="stroke"
            {...pathProps}
          />
        ))}
      </Group>

      <Group
        transform={[
          { scale: size / (showBorder ? ORIGINAL_SVG_SIZE_WITH_BORDER : ORIGINAL_SVG_SIZE) },
        ]}>
        {attributeData[UniconAttributes.Container].map((pathProps) => (
          <Path
            key={pathProps.path as string}
            strokeJoin="round"
            strokeWidth={BORDER_SIZE}
            style="stroke"
            {...pathProps}
          />
        ))}
      </Group>
    </Group>
  )
}

function UniconSvg({
  attributeIndices,
  size,
  lightModeOverlay,
  showBorder,
}: {
  attributeIndices: UniconAttributesToIndices
  size: number
  lightModeOverlay?: boolean
  showBorder?: boolean
}): JSX.Element | null {
  // UniconSvg is used in the Unicon component or for testing specific shapes/containers
  // UniconSvg canvases will grow to fit their container
  // For best results, wrap in a Box with width and height set to size
  // const [attributeData, setAttributeData] = useState<UniconAttributeData>()

  const attributeData = useMemo(() => getUniconAttributeData(attributeIndices), [attributeIndices])

  if (!attributeIndices || !attributeData) {
    return null
  }

  const blurColor = blurs[attributeIndices[UniconAttributes.GradientStart]]
  if (!blurColor) {
    return null
  }

  return (
    <Canvas style={flexStyles.fill}>
      <Mask
        clip={true}
        mask={<UniconMask attributeData={attributeData} showBorder={showBorder} size={size} />}>
        <GradientBlur
          blurColor={blurColor}
          gradientEnd={attributeData[UniconAttributes.GradientEnd]}
          gradientStart={attributeData[UniconAttributes.GradientStart]}
          size={size}
        />
      </Mask>
      {lightModeOverlay && (
        <Mask
          clip={true}
          mask={
            <UniconMask overlay attributeData={attributeData} showBorder={showBorder} size={size} />
          }>
          <Rect color="#000000" height={size} opacity={0.08} width={size} x={0} y={0} />
        </Mask>
      )}
    </Canvas>
  )
}

function UniconBG({
  attributeIndices,
  size,
  backgroundColor,
  showBorder,
}: {
  attributeIndices: UniconAttributesToIndices
  size: number
  backgroundColor?: string
  showBorder?: boolean
}): JSX.Element | null {
  const attributeData = useMemo(() => getUniconAttributeData(attributeIndices), [attributeIndices])

  if (!attributeIndices || !attributeData) {
    return null
  }

  const blurColor = blurs[attributeIndices[UniconAttributes.GradientStart]]
  if (!blurColor) {
    return null
  }

  return (
    <Canvas style={flexStyles.fill}>
      <Mask
        clip={true}
        mask={<UniconMaskBG attributeData={attributeData} showBorder={showBorder} size={size} />}>
        <Rect color={backgroundColor} height={size} opacity={1} width={size} x={0} y={0} />
      </Mask>
    </Canvas>
  )
}

interface Props {
  address: string
  size: number
  randomSeed?: number
  showBorder?: boolean
  backgroundColor?: string
}

export const Unicon = memo(_Unicon)

export function _Unicon({
  address,
  size,
  backgroundColor,
  randomSeed = 0,
  showBorder = false,
}: Props): JSX.Element | null {
  // TODO(MOB-75): move this into a mandatory boolean prop for the Unicon component (e.g. `lightModeOverlay`) so that any consumer of the Unicon component has to decide whether or not to show the light mode overlay (presumably based on whether the current theme is light or dark)
  const isLightMode = !useIsDarkMode()

  // Renders a Unicon inside a (size) x (size) pixel square Box
  const attributeIndices = useMemo(
    () => deriveUniconAttributeIndices(address, randomSeed),
    [address, randomSeed]
  )

  if (!address || !isEthAddress(address) || !attributeIndices) {
    return null
  }

  return (
    <Flex height={size} width={size}>
      <Flex height={size} width={size}>
        <UniconSvg
          attributeIndices={attributeIndices}
          lightModeOverlay={isLightMode}
          showBorder={showBorder}
          size={size}
        />
      </Flex>
      {showBorder && (
        <Flex height={size} position="absolute" width={size} zIndex="$negative">
          <UniconBG
            attributeIndices={attributeIndices}
            backgroundColor={backgroundColor}
            showBorder={true}
            size={size}
          />
        </Flex>
      )}
    </Flex>
  )
}
