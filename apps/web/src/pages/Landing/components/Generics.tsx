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

export const H3 = styled(Text, {
  p: 0,
  m: 0,
  fontSize: 24,
  lineHeight: 32,
  color: '$neutral1',

  '$platform-web': {
    letterSpacing: '-0.02em',
  },
})

export const Body1 = styled(Text, {
  p: 0,
  m: 0,
  fontSize: 18,
  fontStyle: 'normal',
  fontWeight: '$book',
  lineHeight: 24,
  color: '$neutral1',

  '$platform-web': {
    letterSpacing: '-0.01em',
    fontFeatureSettings: "'ss07' on",
  },
})
