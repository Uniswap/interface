import { EmptySpinner } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { SpinningLoaderProps } from 'ui/src/loading/types'

const rotateCSS = `
  @keyframes rotate360 {
      from {
          transform: rotate(45deg);
      }
      to {
          transform: rotate(405deg);
      }
  }

  .RotateElement {
      animation: rotate360 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
      transform-origin: center center;
  }
`

export function SpinningLoader({ size = 20, width = 3, disabled, color }: SpinningLoaderProps): JSX.Element {
  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }
  return (
    <>
      <style>{rotateCSS}</style>
      <Flex alignItems="center" height={size} justifyContent="center" marginEnd={2} marginStart={2} width={size}>
        <Flex height={size} minHeight={8} minWidth={8} p={1.66667} position="relative" width={size}>
          <Flex
            backgroundColor="transparent"
            borderColor={color ?? '$neutral1'}
            borderRadius="$roundedFull"
            borderWidth={width}
            height={size}
            opacity={0.1}
            position="absolute"
            width={size}
          />
          <Flex
            backgroundColor="transparent"
            borderBottomColor="transparent"
            borderBottomWidth={width}
            borderLeftColor="transparent"
            borderLeftWidth={width}
            borderRadius="$roundedFull"
            borderRightColor="transparent"
            borderRightWidth={width}
            borderTopColor={color ?? '$neutral1'}
            borderTopWidth={width}
            className="RotateElement"
            height={size}
            position="absolute"
            width={size}
          />
        </Flex>
      </Flex>
    </>
  )
}
