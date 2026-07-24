import { CircleSpinner, EmptySpinner } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { SpinningLoaderProps } from 'ui/src/loading/types'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const CSS_RULE_ID = '__spinning_loader_styles__'
const SPINNING_LOADER_CSS = `
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
      transform-origin: center center;
  }
`

export function SpinningLoader({ size = 20, disabled, color, unstyled }: SpinningLoaderProps): JSX.Element {
  useInjectSingleStylesheet({ id: CSS_RULE_ID, css: SPINNING_LOADER_CSS, active: !disabled })

  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }

  if (unstyled) {
    return (
      <Flex className="RotateElement">
        <CircleSpinner color={color} size={size} />
      </Flex>
    )
  }

  return (
    <Flex alignItems="center" height={size} justifyContent="center" marginEnd={2} marginStart={2} width={size}>
      <Flex height={size} minHeight={8} minWidth={8} p={1.66667} position="relative" width={size}>
        <Flex className="RotateElement" position="absolute">
          <CircleSpinner color={color} size={size} />
        </Flex>
      </Flex>
    </Flex>
  )
}
