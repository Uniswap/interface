import { styled, Text } from 'ui/src'

export enum BadgeVariant {
  WARNING = 'WARNING',
  SOFT = 'SOFT',
}

const Badge = styled(Text, {
  alignItems: 'center',
  borderRadius: '$rounded8',
  display: 'inline-flex',
  py: '$spacing4',
  px: '$spacing6',
  justifyContent: 'center',
  backgroundColor: '$surface2',
  fontWeight: '500',
  color: '$neutral2',
  variants: {
    variant: {
      [BadgeVariant.SOFT]: { backgroundColor: '$accent2', color: '$accent1' },
      [BadgeVariant.WARNING]: { backgroundColor: '$DEP_accentWarning', color: '$surface1' },
    },
  } as const,
})
export default Badge
