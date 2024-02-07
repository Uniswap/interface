import { memo } from 'react'
import { Flex, FlexProps, useSporeColors } from 'ui/src'
import Checkmark from 'ui/src/assets/icons/checkmark.svg'

type Props = {
  size: number
  checkmarkStrokeWidth?: number
  color?: string
} & FlexProps

function _CheckmarkCircle({ color, checkmarkStrokeWidth = 3, size, ...rest }: Props): JSX.Element {
  const colors = useSporeColors()
  return (
    <Flex
      alignItems="center"
      borderRadius="$roundedFull"
      height={size}
      justifyContent="center"
      width={size}
      {...rest}>
      <Checkmark
        color={color ?? colors.sporeWhite.val}
        height={size / 2}
        strokeWidth={checkmarkStrokeWidth}
        width={size / 2}
      />
    </Flex>
  )
}

export const CheckmarkCircle = memo(_CheckmarkCircle)
