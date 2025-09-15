import { Flex, useShadowPropsShort } from 'ui/src'
import { Lock } from 'ui/src/components/icons'

const BOX_ROW_COUNT = 4
const BOX_COL_COUNT = 2
const BOX_HEIGHT = 7
const BOX_WIDTH = 77
const BOXES_CONTAINER_HEIGHT = 136
const BOXES_CONTAINER_WIDTH = 222

const DEFAULT_PREVIEW_HEIGHT = 122

export function LockPreviewImage({ height = DEFAULT_PREVIEW_HEIGHT }: { height?: number }): JSX.Element {
  const shadowProps = useShadowPropsShort()

  const rows: number[][] = new Array(BOX_ROW_COUNT).fill(new Array(BOX_COL_COUNT).fill(0))

  return (
    <Flex
      alignItems="center"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      height={height}
      overflow="hidden"
      pt="$spacing32"
    >
      <Flex
        {...shadowProps}
        alignItems="center"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        height={BOXES_CONTAINER_HEIGHT}
        position="relative"
        pt="$spacing16"
        width={BOXES_CONTAINER_WIDTH}
      >
        <Flex gap="$spacing12">
          {rows.map((cols, rowIndex) => (
            <Flex key={rowIndex} row gap="$spacing24">
              {cols.map((_, colIndex) => (
                <Flex
                  key={colIndex}
                  backgroundColor="$surface3"
                  borderRadius="$rounded4"
                  height={BOX_HEIGHT}
                  width={BOX_WIDTH}
                />
              ))}
            </Flex>
          ))}
        </Flex>

        <Flex position="absolute">
          <Flex
            {...shadowProps}
            backgroundColor="$surface1"
            borderColor="$surface3"
            borderRadius="$rounded12"
            borderWidth="$spacing1"
            p="$spacing12"
            top="$spacing24"
          >
            <Lock color="$neutral1" size="$icon.24" />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
