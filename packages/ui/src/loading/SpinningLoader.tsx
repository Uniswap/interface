import { EmptySpinner } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { SpinningLoaderProps } from 'ui/src/loading/types'

const rotateCSS = `
  @keyframes rotate360 {
      from {
          transform: rotate(0deg);
      }
      to {
          transform: rotate(360deg);
      }
  }

  .RotateElement {
      animation: rotate360 3s linear infinite;
      transform-origin: center center;
  }
`

export function SpinningLoader({ size = 20, disabled, color }: SpinningLoaderProps): JSX.Element {
  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }
  return (
    <>
      <style>{rotateCSS}</style>
      <Flex
        alignItems="center"
        className="RotateElement"
        height={16}
        justifyContent="center"
        marginEnd={2}
        marginStart={2}
        width={16}
      >
        <Flex borderRadius="$roundedFull" height={8} minHeight={8} minWidth={8} position="relative" width={8}>
          <Flex
            backgroundColor="transparent"
            borderBottomColor="transparent"
            borderBottomWidth={1}
            borderLeftColor={color ?? '$neutral1'}
            borderLeftWidth={2}
            borderRadius="$roundedFull"
            borderRightColor="transparent"
            borderRightWidth={1}
            borderTopColor="transparent"
            borderTopWidth={1}
            className="RotateElement"
            height={size}
            left={-6}
            position="relative"
            top={-6}
            width={size}
          />
        </Flex>
      </Flex>
    </>
  )
}
