import { styled, Text } from 'ui/src'

export const H2 = styled(Text, {
  p: 0,
  m: 0,
  fontSize: 52,
  fontStyle: 'normal',
  lineHeight: 60,
  color: '$neutral1',

  '$platform-web': {
    letterSpacing: '-0.02em',
  },

  $xl: {
    fontSize: 36,
  },
})
