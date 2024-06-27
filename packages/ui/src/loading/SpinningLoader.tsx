import { EmptySpinner } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { SpinningLoaderProps } from './types'

export function SpinningLoader({ size = 20, disabled, color }: SpinningLoaderProps): JSX.Element {
  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }
  return (
    <>
      <style>
        {`
            @keyframes rotate360 {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            .RotateElement {
                animation: rotate360 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
            }
        `}
      </style>
      <Flex
        alignItems="center"
        animation="200ms"
        className="StyledPolling"
        height={16}
        marginEnd={2}
        marginStart={2}
        width={16}>
        <Flex
          animation="200ms"
          borderRadius="$roundedFull"
          height={8}
          minHeight={8}
          minWidth={8}
          position="relative"
          width={8}>
          <Flex
            animation="200ms"
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
            left={-3}
            position="relative"
            top={-3}
            transform="translateZ(0)"
            width={size}
          />
        </Flex>
      </Flex>
    </>
  )
}
