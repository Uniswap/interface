import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
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
      <Svg fill="none" height={height} viewBox="0 0 26 24" width={width}>
        <Path
          d="M15 6L9 12L15 18"
          stroke={color || '#000000'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </Svg>
    </Flex>
  )
}

export const Chevron = memo(_Chevron)
