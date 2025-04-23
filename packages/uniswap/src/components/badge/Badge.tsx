import { styled, Text } from 'ui/src'

export enum BadgeVariant {
  WARNING = 'WARNING',
  SOFT = 'SOFT',
}

const Badge = styled(Text, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing2',
  py: '$spacing2',
  px: '$spacing6',
  justifyContent: 'center',
  backgroundColor: '$surface3',
  fontWeight: '500',
  color: '$neutral2',
  variant: 'body3',

  variants: {
    badgeVariant: {
      [BadgeVariant.SOFT]: { backgroundColor: '$accent2', color: '$accent1' },
      [BadgeVariant.WARNING]: { backgroundColor: '$statusWarning', color: '$surface1' },
    },
    size: {
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
export default Badge
