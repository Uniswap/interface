import { styled, Text } from 'ui/src'

const PositionInfoBadge = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  backgroundColor: '$surface3',
  py: '$spacing2',
  px: '$padding6',
  variants: {
    size: {
      default: {
        variant: 'body3',
      },
      small: {
        variant: 'body4',
      },
    },
    placement: {
      start: {
        borderTopLeftRadius: '$rounded4',
        borderBottomLeftRadius: '$rounded4',
      },
      middle: {},
      end: {
        borderTopRightRadius: '$rounded4',
        borderBottomRightRadius: '$rounded4',
      },
      only: {
        borderRadius: '$rounded4',
      },
    },
  } as const,
})

function getPlacement(index: number, length: number): 'start' | 'middle' | 'end' | 'only' {
  return length === 1 ? 'only' : index === 0 ? 'start' : index === length - 1 ? 'end' : 'middle'
}

export function LiquidityPositionInfoBadges({
  labels,
  size = 'default',
}: {
  labels: string[]
  size: 'small' | 'default'
}): JSX.Element {
  return (
    <>
      {labels.map((label, index) => (
        <PositionInfoBadge key={label + index} placement={getPlacement(index, labels.length)} size={size}>
          {label}
        </PositionInfoBadge>
      ))}
    </>
  )
}
