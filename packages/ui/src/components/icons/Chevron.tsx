import { memo } from 'react'
import { Icons } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'

type Props = {
  width?: string | number
  height?: string | number
  direction?: 'n' | 'e' | 's' | 'w'
  color?: string
}

function _Chevron({
  width = 24,
  height = 24,
  direction = 'w',
  color,
  ...rest
}: Props): JSX.Element {
  let degree: string
  switch (direction) {
    case 'n':
      degree = '90deg'
      break
    case 'e':
      degree = '180deg'
      break
    case 's':
      degree = '270deg'
      break
    case 'w':
      degree = '0deg'
      break
    default:
      throw new Error(`Invalid chevron direction ${direction}`)
  }

  return (
    <Flex
      alignItems="center"
      borderRadius="$roundedFull"
      justifyContent="center"
      rotate={degree}
      {...rest}>
      <Icons.ChevronLeft color={color} height={height} width={width} />
    </Flex>
  )
}

export const Chevron = memo(_Chevron)
