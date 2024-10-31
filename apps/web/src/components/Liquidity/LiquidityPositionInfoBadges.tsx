import { CopyHelper } from 'theme/components'
import { styled, Text } from 'ui/src'
import { isAddress, shortenAddress } from 'utilities/src/addresses'

export const PositionInfoBadge = styled(Text, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing2',
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

export interface BadgeData {
  label: string
  copyable?: boolean
  icon?: JSX.Element
}

export function LiquidityPositionInfoBadges({
  badges,
  size = 'default',
}: {
  badges: BadgeData[]
  size: 'small' | 'default'
}): JSX.Element {
  return (
    <>
      {badges.map(({ label, copyable, icon }, index) => {
        const displayLabel = isAddress(label) ? shortenAddress(label) : label
        return (
          <PositionInfoBadge
            cursor={copyable ? 'pointer' : 'unset'}
            key={label + index}
            placement={getPlacement(index, badges.length)}
            size={size}
          >
            {icon}
            {copyable ? (
              <CopyHelper toCopy={label} iconSize={12} iconPosition="right">
                {displayLabel}
              </CopyHelper>
            ) : (
              displayLabel
            )}
          </PositionInfoBadge>
        )
      })}
    </>
  )
}
