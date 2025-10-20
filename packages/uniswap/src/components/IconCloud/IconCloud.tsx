import PoissonDiskSampling from 'poisson-disk-sampling'
import { useMemo, useRef } from 'react'
import { Flex } from 'ui/src'
import { CloudItem } from 'uniswap/src/components/IconCloud/CloudItem'
import { randomFloat, randomInt } from 'uniswap/src/components/IconCloud/utils'

export type FloatingElementPosition = 'left' | 'right'

export interface ItemData {
  color?: string
  logoUrl: string
}

export interface ItemPoint<T extends ItemData> {
  x: number
  y: number
  blur: number
  size: number
  color?: string
  opacity: number
  rotation: number
  delay: number
  floatDuration: number
  floatingElementPosition: FloatingElementPosition
  itemData: T
}

export function IconCloud<T extends ItemData>({
  data,
  minItemSize = 50,
  maxItemSize = 96,
  onPress,
  renderOuterElement,
  getElementRounded,
}: {
  data: T[]
  minItemSize?: number
  maxItemSize?: number
  onPress?: (item: ItemPoint<T>) => void
  renderOuterElement?: (item: ItemPoint<T>) => JSX.Element
  getElementRounded?: (item: ItemPoint<T>) => boolean
}): JSX.Element {
  const pts = useMemo((): ItemPoint<T>[] => {
    const w = window.innerWidth
    const h = window.innerHeight - 72
    const leftThreshold = w / 2 - 240
    const rightThreshold = w / 2 + 240
    const poissonConfig = {
      shape: [w, h],
      minDistance: 250,
      maxDistance: 375,
      tries: 10,
    }
    const poissonDiskSampling = new PoissonDiskSampling(poissonConfig)
    const points = poissonDiskSampling
      .fill()
      // Order by distance from center, ie idx = 0 is closest to center
      .sort((a, b) => Math.abs(a[0] ?? 0 - w / 2) - Math.abs(b[0] ?? 0 - w / 2))
      .map(([x = 0, y = 0], idx: number) => {
        // biome-ignore lint/style/noNonNullAssertion: array access is safe here
        const item = data[idx % data.length]!
        const size = randomInt(minItemSize, maxItemSize)

        return {
          x,
          y,
          blur: (1 / size) * 500 * ((x > leftThreshold && x < rightThreshold) || y < 100 ? 5 : 1), // make blur bigger for smaller icons
          size,
          color: item.color,
          opacity: randomFloat(0.5, 1.0) * ((x > leftThreshold && x < rightThreshold) || y < 100 ? 0.75 : 1),
          rotation: randomInt(-20, 20),
          delay: Math.abs(x - w / 2) / 800,
          floatDuration: randomFloat(3, 6),
          floatingElementPosition: (x < leftThreshold && x + 100 > leftThreshold) || x + 200 > w ? 'left' : 'right',
          itemData: item,
        } satisfies ItemPoint<T>
      })
      .map((p) => {
        return {
          ...p,
          y: p.y - 0.5 * p.size,
          x: p.x - 0.5 * p.size,
        }
      })

    return points
  }, [data, maxItemSize, minItemSize])

  const constraintsRef = useRef(null)

  return (
    <Flex
      ref={constraintsRef}
      centered
      width="100vw"
      position="absolute"
      overflow="hidden"
      inset={0}
      pointerEvents="none"
      contain="strict"
    >
      {pts.map((point: ItemPoint<T>, idx) => {
        return (
          <CloudItem
            key={`token-${idx}`}
            point={point}
            renderOuterElement={renderOuterElement}
            getElementRounded={getElementRounded}
            onPress={onPress}
          />
        )
      })}
    </Flex>
  )
}
