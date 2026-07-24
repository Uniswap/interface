import { FunctionComponent, SVGProps } from 'react'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacifyRaw } from 'ui/src/theme'
import { ReactComponent as Bloom } from '~/assets/svg/positions-empty/bloom.svg'
import { ReactComponent as Butterfly } from '~/assets/svg/positions-empty/butterfly.svg'
import { ReactComponent as Flower } from '~/assets/svg/positions-empty/flower.svg'
import { ReactComponent as Leaf } from '~/assets/svg/positions-empty/leaf.svg'

const fillAbsolute = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const

const GRID_SIZE_PX = 32
const GRID_OPACITY = 6

interface Motif {
  Svg: FunctionComponent<SVGProps<SVGSVGElement>>
  width: number
  height: number
  top?: number
  bottom?: number
  left?: number
  right?: number
}

// Inset so the full shape always sits inside the card (the banner clips overflow).
const MOTIFS: Motif[] = [
  { Svg: Flower, width: 52, height: 52, bottom: 16, right: 48 },
  { Svg: Bloom, width: 84, height: 84, bottom: 16, left: 148 },
  { Svg: Butterfly, width: 60, height: 35, top: 0, right: 132 },
  { Svg: Leaf, width: 44, height: 60, top: 16, left: 0 },
]

export function NoPositionsBanner({
  title,
  description,
  cta,
}: {
  title: string
  description: string
  cta?: JSX.Element
}): JSX.Element {
  const colors = useSporeColors()
  const gridColor = opacifyRaw(GRID_OPACITY, colors.accent1.val)
  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
    backgroundSize: `${GRID_SIZE_PX}px ${GRID_SIZE_PX}px`,
  }

  return (
    <Flex
      position="relative"
      overflow="hidden"
      width="100%"
      minHeight={160}
      justifyContent="center"
      borderRadius="$rounded20"
      backgroundColor="$accent2"
      py="$spacing32"
      px="$spacing24"
    >
      <Flex {...fillAbsolute} style={gridStyle} />
      {MOTIFS.map(({ Svg, width, height, top, bottom, left, right }, index) => (
        <Flex
          key={index}
          position="absolute"
          top={top}
          bottom={bottom}
          left={left}
          right={right}
          $md={{ display: 'none' }}
        >
          <Svg width={width} height={height} />
        </Flex>
      ))}
      <Flex zIndex={1} centered gap="$gap8" width="100%" $platform-web={{ textAlign: 'center' }}>
        <Text variant="heading3" color="$neutral1">
          {title}
        </Text>
        <Text variant="body2" color="$neutral2" maxWidth={520}>
          {description}
        </Text>
        {cta ? <Flex mt="$spacing16">{cta}</Flex> : null}
      </Flex>
    </Flex>
  )
}
